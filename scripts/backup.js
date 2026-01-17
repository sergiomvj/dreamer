
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configura o dotenv
dotenv.config();

// Resolve o __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações (Puxa do seu .env)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRO: SUPABASE_URL ou SUPABASE_KEY não encontrados no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runBackup() {
    console.log("🚀 Iniciando Backup de Dados (GetLeads)...");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolder = path.join(__dirname, '../supabase/backups');

    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    const tables = ['projects', 'products', 'offers', 'strategy_versions', 'leads'];
    const backupData = {
        timestamp: new Date().toISOString(),
        tables: {}
    };

    for (const table of tables) {
        console.log(`📡 Coletando dados da tabela: ${table}...`);
        try {
            const { data, error } = await supabase.from(table).select('*');

            if (error) {
                console.error(`❌ Erro em ${table}:`, error.message);
                backupData.tables[table] = [];
            } else {
                console.log(`✅ ${data?.length || 0} registros encontrados em ${table}.`);
                backupData.tables[table] = data || [];
            }
        } catch (e) {
            console.error(`❌ Falha crítica ao acessar ${table}:`, e.message);
        }
    }

    const fileName = `backup_getleads_${timestamp}.json`;
    const filePath = path.join(backupFolder, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    console.log("\n==========================================");
    console.log(`🎉 BACKUP CONCLUÍDO COM SUCESSO!`);
    console.log(`📂 Arquivo salvo em: ${filePath}`);
    console.log("==========================================");
}

runBackup();
