const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oqziajekeeawkcnjsahb.supabase.co';
const supabaseKey = 'sb_publishable_4AN9B937-k-QjCh0lyA-9g_LHhsFz5I';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
