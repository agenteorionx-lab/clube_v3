const bcrypt = require('bcrypt');
const supabase = require('../database');
exports.list = async (req, res) => {
    // Exclude clients from this list. They appear separately.
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .neq('role', 'cliente');

    if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao listar usuários' });
    }
    res.json(data);
};

exports.create = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const userRole = role || 'funcionario';

    const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, password_hash: hash, role: userRole }])
        .select();

    if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao criar usuário. Email já existe?' });
    }

    // Supabase returns an array for inserts with .select()
    const newId = data && data[0] ? data[0].id : null;
    res.status(201).json({ message: 'Usuário criado com sucesso', id: newId });
};

exports.delete = async (req, res) => {
    const id = req.params.id;

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao excluir usuário' });
    }
    res.json({ message: 'Usuário excluído com sucesso' });
};
