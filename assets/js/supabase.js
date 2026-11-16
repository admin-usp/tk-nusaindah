/**
 * Konfigurasi & Layanan Backend Supabase
 * Sistem Informasi Sekolah TK Terintegrasi
 */

// Ganti dengan kredensial proyek Supabase Anda (Gunakan ANON_KEY, JANGAN PERNAH gunakan SERVICE_ROLE_KEY di frontend)
// const SUPABASE_CONFIG = {
//     URL: window.ENV ? .SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co',
//     ANON_KEY: window.ENV ? .SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
// };
const SUPABASE_CONFIG = {
    URL: window.ENV?.SUPABASE_URL || 'https://pqdbcfchsoguokgztzbn.supabase.co',
    ANON_KEY: window.ENV?.SUPABASE_ANON_KEY || 'sb_publishable_u7Fd9Ifl6Tr3Im1Dqhb8Wg_2AjUjYvZ'
};

// Inisialisasi Klien Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);

/**
 * Sanitasi string untuk mencegah XSS sederhana pada tampilan dinamis
 */
function sanitizeHTML(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Upload File ke Supabase Storage
 * @param {File} file - Objek file dari input HTML
 * @param {string} bucket - Nama bucket ('school-public' atau 'ppdb-documents')
 * @param {string} folder - Subfolder penyimpanan (misal: 'students', 'teachers', 'ppdb')
 * @returns {Promise<string>} Public URL atau Path file
 */
async function uploadFileToCloud(file, bucket = 'school-public', folder = 'general') {
    if (!file) return null;

    // Validasi ukuran maksimal 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error('Ukuran file maksimal adalah 5MB.');
    }

    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    if (bucket === 'school-public') {
        const { data: publicUrlData } = supabaseClient.storage
            .from(bucket)
            .getPublicUrl(filePath);
        return publicUrlData.publicUrl;
    }

    return filePath;
}

/**
 * Mencatat Aktivitas Admin ke tabel activity_logs
 */
async function logAdminActivity(action, tableName, recordId, details) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        await supabaseClient.from('activity_logs').insert([{
            user_id: user.id,
            action,
            table_name: tableName,
            record_id: String(recordId || ''),
            details
        }]);
    } catch (err) {
        console.warn('Gagal mencatat log aktivitas:', err.message);
    }
}

/**
 * Proteksi Halaman Admin & Pengambilan Profil Pengguna
 */
async function requireAdminAuth() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) {
        window.location.href = 'login.html';
        return null;
    }

    const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profileError || !profile || !profile.is_active) {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html?error=unauthorized';
        return null;
    }

    return { session, profile };
}

/**
 * Logout Admin
 */
async function adminLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}
