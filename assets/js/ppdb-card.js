/**
 * Modul Cetak Kartu Peserta PPDB (Pratinjau Modal + Print / Save as PDF)
 * Bebas blokir Pop-up Browser & kompatibel di HP maupun Desktop
 */

async function printPpdbParticipantCard(regNumberOrObj) {
    try {
        if (typeof supabaseClient === 'undefined') {
            throw new Error('Koneksi database Supabase belum siap.');
        }

        const safeText = typeof sanitizeHTML === 'function'
            ? sanitizeHTML
            : (str) => String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Menyiapkan Kartu Peserta...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
        }

        let admission = null;
        if (typeof regNumberOrObj === 'string') {
            const { data, error } = await supabaseClient
                .from('admissions')
                .select('*')
                .eq('registration_number', regNumberOrObj)
                .maybeSingle();

            if (error) throw error;
            if (!data) throw new Error(`Data pendaftaran ${regNumberOrObj} tidak ditemukan.`);
            admission = data;
        } else {
            admission = regNumberOrObj;
        }

        // Ambil identitas sekolah (gunakan maybeSingle agar tidak error jika tabel masih kosong)
        const { data: school } = await supabaseClient
            .from('school_profile')
            .select('school_name, address, phone, whatsapp, email, principal_name')
            .limit(1)
            .maybeSingle();

        const schoolName = school?.school_name || 'TK NUSA INDAH';
        const schoolAddress = school?.address || 'Jl. Pendidikan Anak Usia Dini No. 12';
        const schoolContact = `Telp/WA: ${school?.whatsapp || school?.phone || '-'} | Email: ${school?.email || '-'}`;
        const photoUrl = admission.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(admission.child_full_name || 'Siswa')}&background=e0f2fe&color=0284c7&size=200`;
        const regDate = admission.created_at
            ? new Date(admission.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

        const statusBadgeColor =
            admission.status === 'Diterima' ? '#16a34a' :
            admission.status === 'Ditolak' ? '#dc2626' :
            admission.status === 'Verifikasi' ? '#0284c7' : '#d97706';

        // Hapus overlay lama jika ada
        const existingModal = document.getElementById('ppdbPrintOverlayModal');
        if (existingModal) existingModal.remove();

        const overlay = document.createElement('div');
        overlay.id = 'ppdbPrintOverlayModal';
        overlay.innerHTML = `
            <style>
                #ppdbPrintOverlayModal {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.78);
                    z-index: 99999;
                    overflow-y: auto;
                    padding: 20px 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .ppdb-toolbar {
                    width: 100%;
                    max-width: 780px;
                    background: #1e293b;
                    color: #fff;
                    padding: 12px 18px;
                    border-radius: 12px;
                    margin-bottom: 14px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .ppdb-btn-action {
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 13px;
                }
                .ppdb-btn-print { background: #facc15; color: #0f172a; }
                .ppdb-btn-close { background: #ef4444; color: #fff; }
                #ppdbPrintableArea {
                    width: 100%;
                    max-width: 780px;
                    background: #ffffff;
                    border: 2.5px solid #0284c7;
                    border-radius: 14px;
                    padding: 24px 28px;
                    color: #1e293b;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    box-shadow: 0 12px 35px rgba(0,0,0,0.25);
                }
                .ppdb-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px double #0284c7;
                    padding-bottom: 12px;
                    margin-bottom: 18px;
                    gap: 12px;
                }
                .ppdb-logo-badge {
                    width: 52px;
                    height: 52px;
                    background: #facc15;
                    color: #0f172a;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .ppdb-card-body {
                    display: flex;
                    gap: 20px;
                    align-items: flex-start;
                    flex-wrap: wrap;
                }
                .ppdb-photo-box {
                    width: 125px;
                    text-align: center;
                    flex-shrink: 0;
                }
                .ppdb-photo-box img {
                    width: 115px;
                    height: 145px;
                    object-fit: cover;
                    border: 2px solid #cbd5e1;
                    border-radius: 8px;
                }
                .ppdb-reg-tag {
                    margin-top: 8px;
                    background: #f0f9ff;
                    border: 1px dashed #0284c7;
                    padding: 5px;
                    border-radius: 6px;
                    font-size: 11px;
                }
                .ppdb-bio-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .ppdb-bio-table td {
                    padding: 4px 6px;
                    vertical-align: top;
                }
                .ppdb-bio-table td.lbl {
                    width: 165px;
                    font-weight: 600;
                    color: #475569;
                }
                .ppdb-card-footer {
                    margin-top: 18px;
                    padding-top: 12px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    font-size: 11.5px;
                    gap: 12px;
                }
                @media print {
                    body * { visibility: hidden !important; }
                    #ppdbPrintOverlayModal, #ppdbPrintableArea, #ppdbPrintableArea * {
                        visibility: visible !important;
                    }
                    #ppdbPrintOverlayModal {
                        position: absolute;
                        left: 0;
                        top: 0;
                        background: #fff !important;
                        padding: 0 !important;
                    }
                    .ppdb-toolbar { display: none !important; }
                    #ppdbPrintableArea {
                        box-shadow: none !important;
                        max-width: 100% !important;
                        border: 2px solid #0284c7 !important;
                    }
                }
            </style>

            <div class="ppdb-toolbar">
                <div style="font-weight: 700; font-size: 14px;">
                    <i class="fas fa-id-card mr-1"></i> Pratinjau Kartu Peserta PPDB — ${safeText(admission.registration_number)}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="ppdb-btn-action ppdb-btn-print" onclick="window.print()">
                        🖨️ Cetak / Simpan PDF
                    </button>
                    <button type="button" class="ppdb-btn-action ppdb-btn-close" onclick="document.getElementById('ppdbPrintOverlayModal').remove()">
                        ✕ Tutup
                    </button>
                </div>
            </div>

            <div id="ppdbPrintableArea">
                <div class="ppdb-card-header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="ppdb-logo-badge">TK</div>
                        <div>
                            <h3 style="margin: 0; font-size: 18px; color: #0284c7; font-weight: 800; text-transform: uppercase;">${safeText(schoolName)}</h3>
                            <div style="font-size: 11px; color: #475569;">${safeText(schoolAddress)}</div>
                            <div style="font-size: 11px; color: #475569;">${safeText(schoolContact)}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 11px; padding: 3px 10px; border-radius: 20px;">
                            TAHUN AJARAN ${safeText(admission.academic_year || '2026/2027')}
                        </span>
                        <div style="font-weight: 800; font-size: 14px; margin-top: 4px; color: #0f172a;">KARTU PESERTA PPDB</div>
                    </div>
                </div>

                <div class="ppdb-card-body">
                    <div class="ppdb-photo-box">
                        <img src="${photoUrl}" alt="Foto Calon Siswa">
                        <div class="ppdb-reg-tag">
                            <div style="font-size: 9px; color: #64748b;">NO. REGISTRASI</div>
                            <strong style="color: #0284c7; font-size: 12px;">${safeText(admission.registration_number)}</strong>
                        </div>
                    </div>

                    <div style="flex: 1; min-width: 260px;">
                        <table class="ppdb-bio-table">
                            <tr><td class="lbl">Nama Lengkap Anak</td><td>: <strong>${safeText(admission.child_full_name)}</strong></td></tr>
                            <tr><td class="lbl">NIK Anak</td><td>: ${safeText(admission.child_nik || '-')}</td></tr>
                            <tr><td class="lbl">Tempat, Tanggal Lahir</td><td>: ${safeText(admission.birth_place)}, ${safeText(admission.birth_date)}</td></tr>
                            <tr><td class="lbl">Jenis Kelamin</td><td>: ${safeText(admission.gender)}</td></tr>
                            <tr><td class="lbl">Kelompok Belajar</td><td>: <strong>${safeText(admission.target_group)}</strong></td></tr>
                            <tr><td class="lbl">Nama Ayah / Ibu</td><td>: ${safeText(admission.father_name)} / ${safeText(admission.mother_name)}</td></tr>
                            <tr><td class="lbl">No. WhatsApp Ortu</td><td>: ${safeText(admission.parent_whatsapp)}</td></tr>
                            <tr><td class="lbl">Alamat</td><td>: ${safeText(admission.address)}</td></tr>
                            <tr>
                                <td class="lbl">Status Pendaftaran</td>
                                <td>: <span style="background: ${statusBadgeColor}; color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;">${safeText((admission.status || 'Menunggu').toUpperCase())}</span></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="ppdb-card-footer">
                    <div style="max-width: 62%; color: #475569; line-height: 1.4;">
                        <strong>Catatan Penting:</strong><br>
                        1. Kartu ini adalah bukti sah pendaftaran PPDB Online.<br>
                        2. Harap membawa kartu ini beserta dokumen asli (Akta Kelahiran & KK) saat verifikasi di sekolah.
                    </div>
                    <div style="text-align: center; min-width: 170px;">
                        <div>Tanggal Daftar: ${regDate}</div>
                        <div>Panitia PPDB Sekolah,</div>
                        <div style="height: 44px;"></div>
                        <strong>( _____________________ )</strong>
                    </div>
                </div>
            </div>
        `;

        if (typeof Swal !== 'undefined') Swal.close();
        document.body.appendChild(overlay);
    } catch (err) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Gagal Menampilkan Kartu', err.message, 'error');
        } else {
            console.error('Gagal Menampilkan Kartu:', err.message);
        }
    }
}
window.printPpdbParticipantCard = printPpdbParticipantCard;
