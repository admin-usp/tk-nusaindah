Sistem Informasi Manajemen Sekolah TK (Taman Kanak-Kanak) Terintegrasi

Aplikasi web sistem informasi sekolah anak usia dini (PAUD/TK) yang menggabungkan Website Frontend Publik, Sistem PPDB Online, dan Dashboard AdminLTE 3 dengan penyimpanan permanen berbasis Supabase Cloud (PostgreSQL + Storage + Auth).

1. Struktur Direktori Project

/tk-school
├── index.html               # Website Frontend Publik & Form PPDB Online
├── database_schema.sql      # Skema PostgreSQL, Relasi Tabel, RLS Policies & Storage Buckets
├── README.md                # Dokumentasi Instalasi & Deployment
├── admin/
│   ├── login.html           # Halaman Login Administrator
│   └── dashboard.html       # Dashboard AdminLTE 3 (Statistik, Chart, Full CRUD, Export)
└── assets/
    └── js/
        └── supabase.js      # Konfigurasi Klien Supabase, Cloud Storage & Auth Guard


2. Langkah Instalasi Backend Cloud (Supabase)

Buat proyek baru di Supabase.

Buka menu SQL Editor di dashboard Supabase, salin seluruh isi file database_schema.sql, lalu klik Run untuk membuat:

17 tabel relasional (profiles, school_profile, teachers, students, classes, parents, admissions, news, galleries, dll).

Kebijakan keamanan Row Level Security (RLS) agar pengunjung publik hanya dapat membaca informasi publik dan mengirim formulir PPDB, sedangkan operasi CRUD penuh hanya diizinkan bagi staf terautentikasi.

Bucket Storage school-public (publik) dan ppdb-documents (privat/terproteksi).

Buka menu Project Settings > API, salin Project URL dan anon public key.

Masukkan kedua nilai tersebut ke dalam file assets/js/supabase.js:

const SUPABASE_CONFIG = {
    URL: 'https://your-project-ref.supabase.co',
    ANON_KEY: 'your-anon-public-key'
};


Peringatan Keamanan: Jangan pernah menaruh service_role key di sisi klien/frontend.

3. Membuat Akun Super Admin Awal

Pada dashboard Supabase, buka menu Authentication > Users, klik Add User > Create New User.

Masukkan email dan password admin (misal: admin@tkcerianusantara.sch.id), lalu salin User UID yang terbentuk.

Jalankan perintah SQL berikut pada SQL Editor untuk mendaftarkan hak aksesnya pada tabel profiles:

INSERT INTO public.profiles (id, full_name, email, role, is_active)
VALUES (
    'PASTE-USER-UID-DI-SINI',
    'Administrator Utama',
    'admin@tkcerianusantara.sch.id',
    'super_admin',
    TRUE
);


Akses admin/login.html dan masuk menggunakan email serta password tersebut.

4. Panduan Deployment ke Hosting / Cloud

Karena seluruh backend ditangani oleh Supabase Cloud, aplikasi ini dapat di-deploy secara gratis maupun berbayar ke berbagai layanan hosting:

Vercel / Netlify: Unggah folder /tk-school ke repositori GitHub Anda dan hubungkan ke Vercel/Netlify tanpa memerlukan konfigurasi build tambahan.

Shared Hosting / cPanel: Kompres seluruh isi folder /tk-school menjadi file .zip, unggah ke direktori public_html, lalu ekstrak.