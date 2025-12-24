const SUPABASE_URL = 'https://mkmddihzukdtxnxlrnts.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue'; 

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storageKey: 'wedding-auth-token'
    }
});

window.supabaseClient = _supabase;