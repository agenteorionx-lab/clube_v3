const bcrypt = require('bcrypt');
const supabase = require('../database');

exports.list = async (req, res) => {
    try {
        // Get clients with their latest subscription status
        const { data, error } = await supabase
            .from('clients')
            .select(`
                *,
                subscriptions!left ( status, next_due_date, start_date )
            `);

        if (error) throw error;

        // Flatten the subscriptions array just like the sql join did
        const formattedData = data.map(client => {
            const sub = client.subscriptions && client.subscriptions.length > 0 ? client.subscriptions[0] : {};
            const result = { ...client, ...sub };
            delete result.subscriptions;
            return result;
        });

        res.json(formattedData);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao buscar clientes' });
    }
};

exports.create = async (req, res) => {
    const { name, cpf, phone, plan, value, address, email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório para o login do cliente.' });
    }

    const password = cpf.replace(/\D/g, ''); // Default password is CPF numbers
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    try {
        // 1. Create User
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([{
                name,
                email,
                password_hash: hash,
                role: 'cliente',
                force_password_change: true
            }])
            .select();

        if (userError) {
            console.error('User creation error:', userError);
            return res.status(500).json({ message: 'Erro ao criar usuário do cliente. Email já existe?' });
        }

        const userId = userData[0].id;

        // 2. Create Client linked to User
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert([{
                user_id: userId,
                name,
                cpf,
                phone,
                plan,
                value,
                address
            }])
            .select();

        if (clientError) {
            console.error('Client creation error:', clientError);
            // Ideally we should rollback user here, but keeping it simple for now
            await supabase.from('users').delete().eq('id', userId);
            return res.status(500).json({ message: 'Erro ao criar cliente. CPF já existe?' });
        }

        const clientId = clientData[0].id;
        const today = new Date();
        const nextDue = new Date();
        nextDue.setDate(today.getDate() + 30);

        // 3. Create Subscription
        const { error: subError } = await supabase
            .from('subscriptions')
            .insert([{
                client_id: clientId,
                start_date: today.toISOString().split('T')[0],
                next_due_date: nextDue.toISOString().split('T')[0],
                status: 'pendente'
            }]);

        if (subError) {
            console.error('Subscription creation error:', subError);
            return res.status(500).json({ message: 'Erro ao criar assinatura' });
        }

        res.status(201).json({ message: 'Cliente e Login criados com sucesso. Senha padrão é o CPF (apenas números).', id: clientId });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro interno ao criar cliente.' });
    }
};

exports.confirmPayment = async (req, res) => {
    const clientId = req.params.id;

    try {
        const { data: sub, error: fetchError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('client_id', clientId)
            .single();

        if (fetchError || !sub) return res.status(404).json({ message: 'Assinatura não encontrada' });

        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 30);

        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                status: 'ativo',
                next_due_date: newDueDate.toISOString().split('T')[0]
            })
            .eq('client_id', clientId);

        if (updateError) return res.status(500).json({ message: 'Erro ao confirmar pagamento' });

        res.json({ message: 'Pagamento confirmado', newDueDate: newDueDate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro interno ao confirmar pagamento' });
    }
};

exports.delete = async (req, res) => {
    const clientId = req.params.id;

    try {
        const { data: client, error: fetchError } = await supabase
            .from('clients')
            .select('user_id')
            .eq('id', clientId)
            .single();

        if (fetchError || !client) return res.status(404).json({ message: 'Cliente não encontrado' });

        const userId = client.user_id;

        // Due to Supabase/Postgres ON DELETE CASCADE for foreign keys we established
        // deleting the User will delete the Client, which deletes Subscriptions.
        // However, if we didn't setup cascade, we should delete them individually.
        // Let's delete individually to be safe from foreign key setup misses.

        await supabase.from('subscriptions').delete().eq('client_id', clientId);
        await supabase.from('clients').delete().eq('id', clientId);

        if (userId) {
            const { error: userDelError } = await supabase.from('users').delete().eq('id', userId);
            if (userDelError) console.error("Error deleting old user auth record:", userDelError);
        }

        res.json({ message: 'Cliente e usuário excluídos com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro interno ao excluir cliente' });
    }
};

exports.update = async (req, res) => {
    const clientId = req.params.id;
    const { name, cpf, phone, plan, status, next_due_date } = req.body;
    console.log(`[UPDATE] Client ${clientId}:`, req.body);

    try {
        // 1. Update Client Info
        const { error: clientError } = await supabase
            .from('clients')
            .update({ name, cpf, phone, plan })
            .eq('id', clientId);

        if (clientError) {
            console.error('[UPDATE] Client Error:', clientError);
            return res.status(500).json({ message: 'Erro ao atualizar dados do cliente: ' + clientError.message });
        }

        // 2. Update Subscription Status/Dates if provided
        if (status || next_due_date) {
            const subUpdates = {};
            if (status) subUpdates.status = status;
            if (next_due_date) subUpdates.next_due_date = next_due_date;

            const { error: subError } = await supabase
                .from('subscriptions')
                .update(subUpdates)
                .eq('client_id', clientId);

            if (subError) {
                console.error('[UPDATE] Subscription Error:', subError);
                return res.status(500).json({ message: 'Erro ao atualizar assinatura: ' + subError.message });
            }

            res.json({ message: 'Cliente atualizado com sucesso' });
        } else {
            res.json({ message: 'Dados do cliente atualizados com sucesso' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro interno ao atualizar cliente' });
    }
};
