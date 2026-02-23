const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'clube.db');
const db = new sqlite3.Database(dbPath);

const salt = bcrypt.genSaltSync(10);
const password = '123'; // Senha simples para teste
const hash = bcrypt.hashSync(password, salt);

db.serialize(() => {
    // Criar Funcionário
    const emailFunc = 'func@clube.com';
    db.run("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ['Funcionário Teste', emailFunc, hash, 'funcionario'],
        function (err) {
            if (err) {
                console.log('Erro ou usuário já existe:', emailFunc);
            } else {
                console.log(`Funcionário criado: ${emailFunc} / ${password}`);
            }
        }
    );

    // NOTA: Clientes não têm login direto na tabela 'users' na implementação atual simplificada 
    // a menos que criemos um user vinculado. O sistema foca no Admin/Funcionário gerindo.
    // Se o cliente precisar logar, precisaríamos criar um user com role='cliente' e vincular.
    // Vamos criar um para teste de fluxo futuro se necessário.
});
