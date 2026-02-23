// We no longer need SQLite. We just re-export the Supabase client
// so that existing require('./database') calls don't break immediately,
// but we will need to refactor the queries everywhere from SQLite SQL to Supabase.

const supabase = require('./supabase-client');

console.log('Connected to Supabase (Database wrapper)');

module.exports = supabase;
