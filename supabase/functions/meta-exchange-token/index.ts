import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-GCM Encryption
const ALGORITHM = "AES-GCM";
const KEY_HEX = Deno.env.get("TOKEN_ENCRYPTION_KEY") || ""; 

async function getKey() {
  // Convert hex string to Uint8Array
  const keyBytes = new Uint8Array(
    KEY_HEX.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    ALGORITHM,
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(text: string) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  
  // Return IV + Ciphertext as hex string
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${ivHex}:${cipherHex}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { code, tenantId, redirectUri } = await req.json();

    if (!code || !tenantId || !redirectUri) {
      throw new Error("Missing required parameters");
    }

    // 1. Exchange Code for Token
    const metaAppId = Deno.env.get("NEXT_PUBLIC_META_APP_ID");
    const metaAppSecret = Deno.env.get("META_APP_SECRET");

    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${redirectUri}&client_secret=${metaAppSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    let accessToken = tokenData.access_token;

    // 1.5. Exchange for Long-Lived Token
    try {
        const longLivedRes = await fetch(
            `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${accessToken}`
        );
        const longLivedData = await longLivedRes.json();
        if (longLivedData.access_token) {
            accessToken = longLivedData.access_token;
        }
    } catch (e) {
        console.warn("Failed to exchange for long-lived token, using short-lived.", e);
    }

    // 2. Fetch Ad Accounts
    const accountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=account_id,name&access_token=${accessToken}`
    );
    const accountsData = await accountsRes.json();

    if (accountsData.error) {
      throw new Error(accountsData.error.message);
    }

    // 3. Init Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 4. Get Platform ID
    const { data: platform } = await supabaseAdmin
      .from('ad_platforms')
      .select('id')
      .eq('name', 'Meta') // Changed from platform_name to name based on schema check
      .single();
    
    // Fallback if not found (seed?)
    let platformId = platform?.id;
    if (!platformId) {
        // Try insert or fail. For now fail if seeding not done.
        // Assuming 'Meta' exists.
        // If not, we could insert it.
        const { data: newPlat } = await supabaseAdmin.from('ad_platforms').upsert({ name: 'Meta' }, { onConflict: 'name' }).select().single();
        platformId = newPlat?.id;
    }

    // 5. Encrypt Token
    const encryptedToken = await encrypt(accessToken);

    // 6. Upsert Accounts
    const accountsToUpsert = accountsData.data.map((acc: any) => ({
      tenant_id: tenantId,
      project_id: "00000000-0000-0000-0000-000000000000", // TODO: Need a valid project ID.
      // Schema requires project_id. We might need to ask user to select a project or use a default.
      // For now, I'll fetch the first project of the tenant.
      ad_platform_id: platformId,
      external_account_id: acc.account_id,
      account_name: acc.name,
      access_token: encryptedToken, // Schema col name is access_token, but storing encrypted
      is_active: true
    }));

    // Fix Project ID issue:
    const { data: projects } = await supabaseAdmin.from('projects').select('id').eq('tenant_id', tenantId).limit(1);
    if (projects && projects.length > 0) {
        accountsToUpsert.forEach((a: any) => a.project_id = projects[0].id);
    } else {
        // Create a default project if none?
        const { data: newProj } = await supabaseAdmin.from('projects').insert({
            tenant_id: tenantId,
            name: "Default Project"
        }).select().single();
        accountsToUpsert.forEach((a: any) => a.project_id = newProj.id);
    }

    const { error: upsertError } = await supabaseAdmin
        .from('ad_accounts')
        .upsert(accountsToUpsert, {
            onConflict: 'tenant_id, project_id, external_account_id, ad_platform_id'
        });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
