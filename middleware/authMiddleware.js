const jwt = require('jsonwebtoken');
const SECRET_KEY = 'super_secret_key_change_this_in_production';

exports.verifyToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    if (!token) {
        return res.status(403).send({ message: 'Nenhum token fornecido!' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Não autorizado!' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

exports.isAdmin = (req, res, next) => {
    if (req.userRole === 'admin') {
        next();
        return;
    }
    res.status(403).send({ message: 'Requer privilégios de Administrador!' });
};
