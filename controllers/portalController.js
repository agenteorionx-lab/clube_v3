const supabase = require('../database');

exports.getMyData = async (req, res) => {
    const userId = req.userId; // From JWT middleware

    try {
        const { data: client, error } = await supabase
            .from('clients')
            .select(`
                *,
                users!inner ( email ),
                subscriptions!left ( status, next_due_date, start_date )
            `)
            .eq('user_id', userId)
            .single();

        if (error || !client) {
            return res.status(404).json({ message: 'Dados de cliente não encontrados para este usuário.' });
        }

        // Flatten to match expected output format
        const responseData = {
            ...client,
            email: client.users ? client.users.email : null,
            status: client.subscriptions && client.subscriptions.length > 0 ? client.subscriptions[0].status : null,
            next_due_date: client.subscriptions && client.subscriptions.length > 0 ? client.subscriptions[0].next_due_date : null,
            start_date: client.subscriptions && client.subscriptions.length > 0 ? client.subscriptions[0].start_date : null,
        };

        // Clean up nested objects
        delete responseData.users;
        delete responseData.subscriptions;

        res.json(responseData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar dados do cliente' });
    }
};

exports.updateMyData = async (req, res) => {
    const userId = req.userId;
    const { email, phone, password } = req.body;
    const bcrypt = require('bcrypt');

    try {
        // 1. Update User (Email, Password)
        if (email || password) {
            const updates = {};
            if (email) updates.email = email;

            if (password) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(password, salt);
                updates.password_hash = hash;
                updates.force_password_change = false; // Supabase uses boolean false
            }

            const { error: userError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId);

            if (userError) {
                console.error('Update User Error:', userError);
                return res.status(500).json({ message: 'Erro ao atualizar dados de login' });
            }
        }

        // 2. Update Client (Phone)
        if (phone) {
            const { error: clientError } = await supabase
                .from('clients')
                .update({ phone: phone })
                .eq('user_id', userId);

            if (clientError) {
                console.error('Update Client Error:', clientError);
                return res.status(500).json({ message: 'Erro ao atualizar telefone' });
            }
        }

        res.json({ message: 'Dados atualizados com sucesso' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao confirmar atualização' });
    }
};
