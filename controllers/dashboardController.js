const supabase = require('../database');

exports.getStats = async (req, res) => {
    try {
        // 1. Counts by Status using aggregated select
        const stats = {
            ativo: 0,
            pendente: 0,
            cancelado: 0,
            lead_inativo: 0
        };

        const { data: subsData, error: subsError } = await supabase
            .from('subscriptions')
            .select('status');

        if (subsError) throw subsError;

        if (subsData) {
            subsData.forEach(sub => {
                if (stats.hasOwnProperty(sub.status)) {
                    stats[sub.status]++;
                }
            });
        }

        // 2. Revenue Forecast (Sum of value of all active/pendente clients)
        // A direct join sum is tricky without RPC, so we fetch clients that have active/pendente subs
        const { data: revenueData, error: revError } = await supabase
            .from('clients')
            .select(`
                value,
                subscriptions!inner ( status )
            `)
            .in('subscriptions.status', ['ativo', 'pendente']);

        if (revError) throw revError;

        let totalRevenue = 0;
        if (revenueData) {
            revenueData.forEach(client => {
                totalRevenue += client.value || 0;
            });
        }

        res.json({
            counts: stats,
            revenue: totalRevenue
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro nos stats' });
    }
};

exports.getReports = async (req, res) => {
    try {
        // 1. Revenue by Month (last 6 months - or all)
        // Group by in memory
        const { data: growthDataRaw, error: growthError } = await supabase
            .from('clients')
            .select('created_at, value');

        if (growthError) throw growthError;

        const growthMap = {};
        if (growthDataRaw) {
            growthDataRaw.forEach(client => {
                const dateObj = new Date(client.created_at);
                const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                if (!growthMap[month]) growthMap[month] = { month, new_clients: 0, new_revenue: 0 };
                growthMap[month].new_clients++;
                growthMap[month].new_revenue += client.value || 0;
            });
        }

        let growthData = Object.values(growthMap).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);

        // 2. Clients by Plan
        const { data: plansDataRaw, error: plansError } = await supabase
            .from('clients')
            .select('plan');

        if (plansError) throw plansError;

        const planMap = {};
        if (plansDataRaw) {
            plansDataRaw.forEach(c => {
                planMap[c.plan] = (planMap[c.plan] || 0) + 1;
            });
        }
        const plansData = Object.keys(planMap).map(k => ({ plan: k, count: planMap[k] }));

        // 3. Status Distribution
        const { data: statusDataRaw, error: statusError } = await supabase
            .from('subscriptions')
            .select('status');

        if (statusError) throw statusError;

        const statusMap = {};
        if (statusDataRaw) {
            statusDataRaw.forEach(s => {
                statusMap[s.status] = (statusMap[s.status] || 0) + 1;
            });
        }
        const statusData = Object.keys(statusMap).map(k => ({ status: k, count: statusMap[k] }));


        res.json({
            growth: growthData.reverse(), // reverse to show chronological order
            plans: plansData,
            status: statusData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar relatórios' });
    }
};
