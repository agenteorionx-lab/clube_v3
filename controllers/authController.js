const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../database');

const SECRET_KEY = 'super_secret_key_change_this_in_production'; // Use env var in real app

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single(); // Returns single object or throws error if 0 or >1

    if (error || !user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordIsValid) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, force_password_change: user.force_password_change }, SECRET_KEY, {
        expiresIn: 86400 // 24 hours
    });

    res.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        force_password_change: user.force_password_change,
        accessToken: token
    });
};

exports.register = async (req, res) => {
    // Only Admin should register new users ideally, but keeping simple for now
    const { name, email, password, role } = req.body;

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    const userRole = role || 'funcionario';

    const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, password_hash: hash, role: userRole }])
        .select();

    if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erro ao registrar usuário. Email já existe?' });
    }

    const newId = data && data[0] ? data[0].id : null;
    res.status(201).json({ message: 'Usuário criado com sucesso', userId: newId });
};
