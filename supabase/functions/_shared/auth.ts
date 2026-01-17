export function assertWebhookSecret(req: Request) {
    const expected = Deno.env.get("N8N_WEBHOOK_SECRET") || "";
    const got = req.headers.get("x-webhook-secret") || "";
    if (!expected || got !== expected) {
        throw new Error("Unauthorized: invalid webhook secret");
    }
}
