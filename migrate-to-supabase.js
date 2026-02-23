const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const supabase = require('./supabase-client');

// Connect to local SQLite database
const dbPath = path.resolve(__dirname, 'clube.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to local SQLite database.');
});

async function migrate() {
    console.log('--- Iniciando Migração para o Supabase ---');

    try {
        // 1. Migate Users
        console.log('Migrando Users...');
        db.all('SELECT * FROM users', async (err, users) => {
            if (err) throw err;
            if (users.length > 0) {
                const { error } = await supabase.from('users').upsert(users);
                if (error) console.error('  Erro ao migrar users:', error);
                else console.log(`  Sucesso: ${users.length} users importados.`);
            }

            // 2. Migrate Clients
            console.log('Migrando Clients...');
            db.all('SELECT * FROM clients', async (err, clients) => {
                if (err) throw err;
                if (clients.length > 0) {
                    // Supabase timestamp formating may require adjustment depending on the exact string
                    // But upsert often handles standard SQL texts well.
                    const { error } = await supabase.from('clients').upsert(clients);
                    if (error) console.error('  Erro ao migrar clients:', error);
                    else console.log(`  Sucesso: ${clients.length} clients importados.`);
                }

                // 3. Migrate Subscriptions
                console.log('Migrando Subscriptions...');
                db.all('SELECT * FROM subscriptions', async (err, subs) => {
                    if (err) throw err;
                    if (subs.length > 0) {
                        const { error } = await supabase.from('subscriptions').upsert(subs);
                        if (error) console.error('  Erro ao migrar subscriptions:', error);
                        else console.log(`  Sucesso: ${subs.length} subscriptions importadas.`);
                    }

                    console.log('--- Migração Concluída! ---');
                    process.exit(0);
                });
            });
        });

    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

migrate();
