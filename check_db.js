const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./clube.db');

db.serialize(() => {
    console.log("--- USERS ---");
    db.each("SELECT id, name, email, role FROM users", (err, row) => {
        console.log(`${row.id} - ${row.name} (${row.email}) [${row.role}]`);
    });

    console.log("\n--- CLIENTS ---");
    db.each("SELECT id, name, user_id FROM clients", (err, row) => {
        console.log(`${row.id} - ${row.name} (User ID: ${row.user_id})`);
    });
});
db.close();
