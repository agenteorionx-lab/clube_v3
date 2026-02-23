const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./clube.db');

console.log("Expected: Only users with role != 'cliente'");
db.serialize(() => {
    db.each("SELECT id, name, email, role FROM users WHERE role != 'cliente'", (err, row) => {
        if (err) console.error(err);
        else console.log(`FOUND: ${row.name} [${row.role}]`);
    });
});
db.close();
