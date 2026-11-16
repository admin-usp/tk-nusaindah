/**
 * Modul Cetak Kartu Peserta PPDB (Print / Save as PDF)
 * Sistem Informasi Manajemen Sekolah TK Terintegrasi
 */

async function printPpdbParticipantCard(regNumberOrObj) {
    try {
        if (typeof supabaseClient === 'undefined') {
            throw new Error('Koneksi database Supabase belum siap.');
        }

        const safeText = typeof sanitizeHTML === 'function' ?
            sanitizeHTML :
            (str) => String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

        let admission = null;

        if (typeof regNumberOrObj === 'string') {
            const { data, error } = await supabaseClient
                .from('admissions')
                .select('*')
                .eq('registration_number', regNumberOrObj)
                .single();

            if (error || !data) {
                throw new Error('Data pendaftaran tidak ditemukan untuk dicetak.');
            }
            admission = data;
        } else {
            admission = regNumberOrObj;
        }

        // Ambil identitas sekolah terbaru dari database
        const { data: school } = await supabaseClient
            .from('school_profile')
            .select('school_name, address, phone, whatsapp, email, principal_name')
            .limit(1)
            .single();

        const schoolName = school ? .school_name || 'TK CERIA NUSANTARA';
        const schoolAddress = school ? .address || 'Jl. Pendidikan Anak Usia Dini No. 12';
        const schoolContact = `Telp/WA: ${school?.whatsapp || school?.phone || '-'} | Email: ${school?.email || '-'}`;
        const photoUrl = admission.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(admission.child_full_name)}&background=e0f2fe&color=0284c7&size=200`;
        const regDate = admission.created_at ?
            new Date(admission.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) :
            new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

        const statusBadgeColor =
            admission.status === 'Diterima' ? '#16a34a' :
            admission.status === 'Ditolak' ? '#dc2626' :
            admission.status === 'Verifikasi' ? '#0284c7' : '#d97706';

        const cardHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kartu Peserta PPDB - ${safeText(admission.registration_number)}</title>
    <style>
        @page {
            size: A5 landscape;
            margin: 10mm;
        }
        * {
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            margin: 0;
            padding: 15px;
            background: #f1f5f9;
            color: #1e293b;
        }
        .card-wrapper {
            max-width: 760px;
            margin: 0 auto;
            background: #ffffff;
            border: 2px solid #0284c7;
            border-radius: 14px;
            padding: 20px 26px;
            position: relative;
            box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px double #0284c7;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .logo-box {
            width: 54px;
            height: 54px;
            background: #facc15;
            color: #0f172a;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 22px;
        }
        .school-info h1 {
            margin: 0;
            font-size: 18px;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .school-info p {
            margin: 2px 0 0;
            font-size: 11px;
            color: #475569;
        }
        .doc-title {
            text-align: right;
        }
        .doc-title span {
            background: #e0f2fe;
            color: #0369a1;
            font-weight: 700;
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 20px;
            display: inline-block;
        }
        .doc-title h2 {
            margin: 5px 0 0;
            font-size: 14px;
            color: #0f172a;
        }
        .content-grid {
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }
        .photo-col {
            width: 130px;
            text-align: center;
            flex-shrink: 0;
        }
        .photo-col img {
            width: 120px;
            height: 150px;
            object-fit: cover;
            border: 2px solid #cbd5e1;
            border-radius: 8px;
            background: #f8fafc;
        }
        .reg-box {
            margin-top: 8px;
            background: #f8fafc;
            border: 1px dashed #0284c7;
            padding: 6px;
            border-radius: 6px;
        }
        .reg-box small {
            display: block;
            font-size: 9px;
            color: #64748b;
        }
        .reg-box strong {
            font-size: 12px;
            color: #0284c7;
        }
        .data-col {
            flex-grow: 1;
        }
        table.bio-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12.5px;
        }
        table.bio-table td {
            padding: 4px 6px;
            vertical-align: top;
        }
        table.bio-table td.label {
            width: 165px;
            color: #475569;
            font-weight: 600;
        }
        .status-pill {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            color: #fff;
            font-weight: 700;
            font-size: 11px;
            background: ${statusBadgeColor};
        }
        .footer-grid {
            margin-top: 18px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 11px;
        }
        .notes {
            max-width: 62%;
            color: #475569;
            line-height: 1.45;
        }
        .signature {
            text-align: center;
            min-width: 180px;
        }
        .signature .space {
            height: 45px;
        }
        .no-print-bar {
            text-align: center;
            margin-bottom: 14px;
        }
        .btn-print {
            background: #0284c7;
            color: #fff;
            border: none;
            padding: 10px 22px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            font-size: 13px;
        }
        @media print {
            body { background: #fff; padding: 0; }
            .card-wrapper { box-shadow: none; border-width: 1.5px; }
            .no-print-bar { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print-bar">
        <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan Sebagai PDF</button>
    </div>

    <div class="card-wrapper">
        <div class="header">
            <div class="header-left">
                <div class="logo-box">TK</div>
                <div class="school-info">
                    <h1>${safeText(schoolName)}</h1>
                    <p>${safeText(schoolAddress)}</p>
                    <p>${safeText(schoolContact)}</p>
                </div>
            </div>
            <div class="doc-title">
                <span>TAHUN AJARAN ${safeText(admission.academic_year || '2026/2027')}</span>
                <h2>KARTU PESERTA PPDB</h2>
            </div>
        </div>

        <div class="content-grid">
            <div class="photo-col">
                <img src="${photoUrl}" alt="Foto Peserta">
                <div class="reg-box">
                    <small>NO. REGISTRASI</small>
                    <strong>${safeText(admission.registration_number)}</strong>
                </div>
            </div>

            <div class="data-col">
                <table class="bio-table">
                    <tr>
                        <td class="label">Nama Lengkap Anak</td>
                        <td>: <strong>${safeText(admission.child_full_name)}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">NIK Anak</td>
                        <td>: ${safeText(admission.child_nik || '-')}</td>
                    </tr>
                    <tr>
                        <td class="label">Tempat, Tanggal Lahir</td>
                        <td>: ${safeText(admission.birth_place)}, ${safeText(admission.birth_date)}</td>
                    </tr>
                    <tr>
                        <td class="label">Jenis Kelamin</td>
                        <td>: ${safeText(admission.gender)}</td>
                    </tr>
                    <tr>
                        <td class="label">Kelompok Belajar</td>
                        <td>: <strong>${safeText(admission.target_group)}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Nama Orang Tua (Ayah/Ibu)</td>
                        <td>: ${safeText(admission.father_name)} / ${safeText(admission.mother_name)}</td>
                    </tr>
                    <tr>
                        <td class="label">No. WhatsApp Orang Tua</td>
                        <td>: ${safeText(admission.parent_whatsapp)}</td>
                    </tr>
                    <tr>
                        <td class="label">Alamat</td>
                        <td>: ${safeText(admission.address)}</td>
                    </tr>
                    <tr>
                        <td class="label">Status Pendaftaran</td>
                        <td>: <span class="status-pill">${safeText((admission.status || 'Menunggu').toUpperCase())}</span></td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="footer-grid">
            <div class="notes">
                <strong>Catatan Penting:</strong><br>
                1. Kartu ini merupakan bukti sah pendaftaran PPDB Online.<br>
                2. Harap membawa kartu ini beserta dokumen asli (Akta Kelahiran & KK) saat verifikasi tatap muka / daftar ulang di sekolah.
            </div>
            <div class="signature">
                <div>Dicetak pada: ${regDate}</div>
                <div>Panitia PPDB Sekolah,</div>
                <div class="space"></div>
                <strong>( _______________________ )</strong>
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            setTimeout(() => window.print(), 400);
        };
    <\/script>
</body>
</html>`;

        const printWin = window.open('', '_blank', 'width=860,height=620');
        if (!printWin) {
            throw new Error('Pop-up diblokir browser. Harap izinkan pop-up untuk mencetak kartu PDF.');
        }
        printWin.document.open();
        printWin.document.write(cardHtml);
        printWin.document.close();
    } catch (err) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Gagal Mencetak Kartu', err.message, 'error');
        } else {
            console.error('Gagal Mencetak Kartu:', err.message);
        }
    }
}