-- ============================================================================
-- SISTEM INFORMASI MANAJEMEN SEKOLAH TK (TAMAN KANAK-KANAK)
-- Database Schema PostgreSQL & Row Level Security (RLS) untuk Supabase
-- ============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PROFILES (Role-Based Access Control terhubung dengan auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'admin_sekolah' CHECK (role IN ('super_admin', 'admin_sekolah', 'operator', 'guru')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL SCHOOL_PROFILE (Identitas & Profil Sekolah)
CREATE TABLE public.school_profile (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    npsn VARCHAR(20),
    school_name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255),
    history TEXT,
    vision TEXT,
    mission TEXT,
    principal_name VARCHAR(150),
    principal_photo_url TEXT,
    principal_welcome TEXT,
    curriculum_info TEXT,
    facilities JSONB DEFAULT '[]'::jsonb,
    address TEXT,
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(100),
    maps_embed_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL CLASSES (Kelompok Kelas: TK A, TK B, KB)
CREATE TABLE public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('KB', 'TK A', 'TK B')),
    academic_year VARCHAR(20) NOT NULL,
    capacity INT DEFAULT 20,
    homeroom_teacher_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL TEACHERS (Data Guru & Tenaga Pendidik)
CREATE TABLE public.teachers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nip VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(15) CHECK (gender IN ('Laki-laki', 'Perempuan')),
    birth_place VARCHAR(100),
    birth_date DATE,
    education VARCHAR(100),
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    bio TEXT,
    photo_url TEXT,
    status VARCHAR(20) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Cuti', 'Nonaktif')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes
ADD CONSTRAINT fk_homeroom_teacher
FOREIGN KEY (homeroom_teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- 5. TABEL PARENTS (Data Orang Tua / Wali)
CREATE TABLE public.parents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    father_name VARCHAR(150) NOT NULL,
    father_job VARCHAR(100),
    mother_name VARCHAR(150) NOT NULL,
    mother_job VARCHAR(100),
    whatsapp_number VARCHAR(30) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL STUDENTS (Data Peserta Didik)
CREATE TABLE public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nis VARCHAR(30) UNIQUE,
    registration_number VARCHAR(50),
    full_name VARCHAR(150) NOT NULL,
    nik VARCHAR(20),
    gender VARCHAR(15) NOT NULL CHECK (gender IN ('Laki-laki', 'Perempuan')),
    birth_place VARCHAR(100),
    birth_date DATE,
    address TEXT,
    photo_url TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
    academic_year VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Lulus', 'Pindah', 'Nonaktif')),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL ADMISSIONS (PPDB Online)
CREATE TABLE public.admissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    child_full_name VARCHAR(150) NOT NULL,
    child_nik VARCHAR(20),
    gender VARCHAR(15) NOT NULL CHECK (gender IN ('Laki-laki', 'Perempuan')),
    birth_place VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    address TEXT NOT NULL,
    target_group VARCHAR(20) NOT NULL CHECK (target_group IN ('KB', 'TK A', 'TK B')),
    academic_year VARCHAR(20) NOT NULL,
    father_name VARCHAR(150) NOT NULL,
    mother_name VARCHAR(150) NOT NULL,
    parent_whatsapp VARCHAR(30) NOT NULL,
    photo_url TEXT,
    birth_certificate_url TEXT,
    family_card_url TEXT,
    status VARCHAR(20) DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Verifikasi', 'Diterima', 'Ditolak')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL NEWS_CATEGORIES & NEWS (Berita & Artikel)
CREATE TABLE public.news_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE public.news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.news_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL GALLERIES & GALLERY_ITEMS (Galeri Foto & Video)
CREATE TABLE public.galleries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'Kegiatan',
    event_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.gallery_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
    media_type VARCHAR(10) DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    caption VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL ANNOUNCEMENTS, SCHOOL_EVENTS, ACHIEVEMENTS, CONTACT_MESSAGES
CREATE TABLE public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.school_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    location VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    student_or_school_name VARCHAR(150),
    level VARCHAR(50),
    year INT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_name VARCHAR(150) NOT NULL,
    sender_email VARCHAR(150),
    sender_phone VARCHAR(30),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABEL SITE_SETTINGS & ACTIVITY_LOGS
CREATE TABLE public.site_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    logo_url TEXT,
    favicon_url TEXT,
    hero_banner_url TEXT,
    active_academic_year VARCHAR(20) DEFAULT '2026/2027',
    is_ppdb_open BOOLEAN DEFAULT TRUE,
    ppdb_info TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    youtube_url TEXT,
    footer_text TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id VARCHAR(100),
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Aktifkan RLS pada semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function untuk memeriksa apakah user adalah staff terautentikasi
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES PUBLIK (READ-ONLY untuk informasi publik)
CREATE POLICY "Public read school_profile" ON public.school_profile FOR SELECT USING (true);
CREATE POLICY "Public read teachers" ON public.teachers FOR SELECT USING (status = 'Aktif');
CREATE POLICY "Public read classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public read news_categories" ON public.news_categories FOR SELECT USING (true);
CREATE POLICY "Public read published news" ON public.news FOR SELECT USING (status = 'published');
CREATE POLICY "Public read galleries" ON public.galleries FOR SELECT USING (true);
CREATE POLICY "Public read gallery_items" ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Public read school_events" ON public.school_events FOR SELECT USING (true);
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

-- POLICIES PUBLIK (INSERT untuk form PPDB & Kontak, SELECT terbatas PPDB)
CREATE POLICY "Public insert admissions" ON public.admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public check admission status" ON public.admissions FOR SELECT USING (true);
CREATE POLICY "Public insert contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- POLICIES STAFF / ADMIN (FULL ACCESS untuk data operasional)
DROP POLICY IF EXISTS "Staff full access profiles" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Staff full access school_profile" ON public.school_profile FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access classes" ON public.classes FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access teachers" ON public.teachers FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access parents" ON public.parents FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access students" ON public.students FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access admissions" ON public.admissions FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access news_categories" ON public.news_categories FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access news" ON public.news FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access galleries" ON public.galleries FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access gallery_items" ON public.gallery_items FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access announcements" ON public.announcements FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access school_events" ON public.school_events FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access achievements" ON public.achievements FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access contact_messages" ON public.contact_messages FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access site_settings" ON public.site_settings FOR ALL USING (public.is_staff());
CREATE POLICY "Staff full access activity_logs" ON public.activity_logs FOR ALL USING (public.is_staff());

-- ============================================================================
-- STORAGE BUCKETS & POLICIES
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('school-public', 'school-public', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('ppdb-documents', 'ppdb-documents', false) ON CONFLICT DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Read school-public" ON storage.objects FOR SELECT USING (bucket_id = 'school-public');
CREATE POLICY "Staff Write school-public" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'school-public' AND public.is_staff());
CREATE POLICY "Staff Update school-public" ON storage.objects FOR UPDATE USING (bucket_id = 'school-public' AND public.is_staff());
CREATE POLICY "Staff Delete school-public" ON storage.objects FOR DELETE USING (bucket_id = 'school-public' AND public.is_staff());

CREATE POLICY "Public Upload ppdb-documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ppdb-documents');
CREATE POLICY "Staff Read ppdb-documents" ON storage.objects FOR SELECT USING (bucket_id = 'ppdb-documents' AND public.is_staff());
CREATE POLICY "Staff Delete ppdb-documents" ON storage.objects FOR DELETE USING (bucket_id = 'ppdb-documents' AND public.is_staff());

-- Seed Initial Settings Row
INSERT INTO public.site_settings (id, active_academic_year, is_ppdb_open, footer_text)
VALUES (1, '2026/2027', TRUE, '© 2026 TK Ceria Nusantara. Hak Cipta Dilindungi Undang-Undang.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.school_profile (school_name, tagline, vision, mission)
VALUES ('TK Ceria Nusantara', 'Bermain, Belajar, dan Tumbuh dengan Kasih Sayang', 'Mewujudkan generasi anak usia dini yang cerdas, ceria, berakhlak mulia, dan mandiri.', '1. Menyelenggarakan pembelajaran aktif berbasis bermain.\n2. Menanamkan nilai karakter dan budi pekerti sejak dini.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TRIGGER OTOMATIS PROVISIONING AKUN ADMIN PERTAMA (BYPASS RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INT;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    INSERT INTO public.profiles (id, full_name, email, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        CASE WHEN user_count = 0 THEN 'super_admin' ELSE 'operator' END,
        TRUE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();