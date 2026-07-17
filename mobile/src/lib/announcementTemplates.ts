// Draft pengumuman siap-pakai untuk Ketua RT.
// Judul dipilih dari dropdown; isi (narasi) terisi otomatis (masih bisa diedit).
// Placeholder di isi diganti TOKEN ({AGENDA}, {NOMINAL}, dst) yang diisi lewat `fields`
// (dropdown/multi-pilih/teks) — bukan lagi ngedit [ ... ] manual di dalam teks.
// Jam & Lokasi juga punya preset (jamOptions/lokasiOptions) yang tampil sebagai dropdown.

export type TemplateFieldType = 'select' | 'multiselect' | 'text' | 'wargaSelect';

export interface TemplateField {
  token: string; // mis. '{AGENDA}' — muncul di content
  label: string; // mis. 'Agenda Rapat'
  type: TemplateFieldType;
  options?: string[]; // untuk select / multiselect
  placeholder?: string; // untuk text
  // untuk wargaSelect: token field alamat yang diisi otomatis dari alamat warga terpilih
  autoAddressToken?: string;
}

export interface AnnouncementTemplate {
  title: string;
  content: string;
  suggestPinned?: boolean;
  jamOptions?: string[];
  lokasiOptions?: string[];
  fields?: TemplateField[];
}

export const ANNOUNCEMENT_TEMPLATES: AnnouncementTemplate[] = [
  {
    title: 'Kerja Bakti Lingkungan',
    content:
      'Assalamualaikum wr. wb. dan salam sejahtera untuk kita semua.\n\n' +
      'Dalam rangka menjaga kebersihan dan kenyamanan lingkungan, akan diadakan kerja bakti bersama. ' +
      'Kegiatan meliputi membersihkan selokan, memangkas rumput, dan merapikan fasilitas umum. ' +
      'Mohon warga membawa peralatan seadanya (sapu, cangkul, sabit).\n\n' +
      'Partisipasi seluruh warga sangat kami harapkan. Terima kasih atas kerja samanya.',
    jamOptions: ['06.00 WIB s.d. selesai', '07.00 WIB s.d. selesai', '08.00 WIB s.d. selesai'],
    lokasiOptions: ['Lapangan RT', 'Balai Warga', 'Selokan & jalan lingkungan', 'Titik kumpul depan pos ronda'],
  },
  {
    title: 'Jadwal Ronda Malam',
    content:
      'Kepada seluruh warga, dalam rangka menjaga keamanan lingkungan akan dilaksanakan ronda malam ' +
      'sesuai jadwal yang telah ditentukan.\n\n' +
      'Mohon setiap regu hadir tepat waktu sesuai giliran. Bila berhalangan, harap mencari pengganti ' +
      'dan mengabari koordinator ronda. Terima kasih.',
    jamOptions: ['21.00 s.d. 03.00 WIB', '22.00 s.d. 04.00 WIB', '23.00 s.d. 04.00 WIB'],
    lokasiOptions: ['Pos Ronda RT', 'Keliling lingkungan RT'],
  },
  {
    title: 'Rapat Warga RT',
    content:
      'Mengundang Bapak/Ibu warga untuk hadir dalam rapat rutin RT guna membahas beberapa hal penting berikut.\n\n' +
      'Agenda:\n{AGENDA}\n\n' +
      'Kehadiran Bapak/Ibu sangat penting untuk kemajuan lingkungan kita. Atas perhatiannya, terima kasih.',
    fields: [
      {
        token: '{AGENDA}',
        label: 'Agenda Rapat',
        type: 'multiselect',
        options: [
          'Program kerja RT',
          'Pembahasan iuran warga',
          'Kegiatan bersama warga',
          'Kebersihan lingkungan',
          'Keamanan lingkungan',
          'Persiapan acara / HUT RI',
          'Penggunaan kas RT',
          'Lain-lain',
        ],
      },
    ],
    jamOptions: ['16.00 WIB s.d. selesai', '19.30 WIB s.d. selesai', '20.00 WIB s.d. selesai'],
    lokasiOptions: ['Balai Warga', 'Rumah Ketua RT', 'Aula RW'],
  },
  {
    title: 'Pembayaran Iuran Bulanan',
    content:
      'Kepada seluruh warga, kami ingatkan mengenai iuran bulanan RT sebesar Rp {NOMINAL} per bulan, ' +
      'dengan jatuh tempo paling lambat tanggal {TEMPO} setiap bulan.\n\n' +
      'Pembayaran dapat dilakukan melalui aplikasi (QRIS/transfer) atau tunai ke Bendahara. ' +
      'Iuran digunakan untuk kas kebersihan, keamanan, dan kegiatan warga. ' +
      'Bagi yang sudah membayar, kami ucapkan terima kasih.',
    fields: [
      { token: '{NOMINAL}', label: 'Nominal Iuran (Rp)', type: 'text', placeholder: 'mis. 50.000' },
      { token: '{TEMPO}', label: 'Jatuh Tempo (tanggal)', type: 'select', options: ['5', '10', '15', '20', '25', 'akhir bulan'] },
    ],
  },
  {
    title: 'Peringatan Keamanan Lingkungan',
    content:
      '⚠️ HIMBAUAN KEAMANAN\n\n' +
      'Sehubungan dengan {ALASAN}, seluruh warga dihimbau untuk:\n\n' +
      '• Selalu mengunci pintu, pagar, dan kendaraan.\n' +
      '• Tidak memarkir kendaraan di luar dengan kunci tertinggal.\n' +
      '• Melapor ke petugas ronda / Ketua RT bila melihat aktivitas mencurigakan.\n' +
      '• Menyalakan lampu depan rumah pada malam hari.\n\n' +
      'Mari saling menjaga keamanan lingkungan kita. Terima kasih atas perhatian dan kerja samanya.',
    suggestPinned: true,
    fields: [
      {
        token: '{ALASAN}',
        label: 'Latar Belakang',
        type: 'select',
        options: [
          'adanya laporan kejadian di lingkungan',
          'peningkatan kewaspadaan keamanan',
          'maraknya pencurian di sekitar wilayah',
          'menjelang libur panjang',
        ],
      },
    ],
    jamOptions: ['Setiap malam', '18.00 WIB s.d. pagi', 'Berlaku sampai pemberitahuan berikutnya'],
    lokasiOptions: ['Seluruh lingkungan RT'],
  },
  {
    title: 'Peringatan HUT Kemerdekaan RI',
    content:
      '🇮🇩 Dalam rangka memperingati HUT Kemerdekaan Republik Indonesia, RT kita akan mengadakan ' +
      'berbagai kegiatan bersama.\n\n' +
      'Rangkaian acara:\n' +
      '• Lomba anak-anak & dewasa\n' +
      '• Kerja bakti & pemasangan umbul-umbul\n' +
      '• Malam ramah tamah warga\n\n' +
      'Ditunggu partisipasi dan kemeriahannya dari seluruh warga. Merdeka!',
    jamOptions: ['08.00 WIB s.d. selesai', '15.00 WIB s.d. selesai', '19.30 WIB (malam ramah tamah)'],
    lokasiOptions: ['Lapangan RT', 'Jalan lingkungan RT', 'Balai Warga'],
  },
  {
    title: 'Kegiatan Posyandu',
    content:
      'Diberitahukan kepada warga, khususnya yang memiliki balita dan ibu hamil, akan diadakan ' +
      'kegiatan Posyandu.\n\n' +
      'Layanan meliputi penimbangan, imunisasi, pemeriksaan ibu hamil, dan pemberian vitamin. ' +
      'Mohon membawa buku KIA/KMS. Terima kasih.',
    jamOptions: ['08.00 s.d. 11.00 WIB', '09.00 s.d. 12.00 WIB'],
    lokasiOptions: ['Posyandu RT', 'Balai Warga', 'Rumah Kader Posyandu'],
  },
  {
    title: 'Informasi Pemadaman Listrik/Air',
    content:
      'Diberitahukan kepada seluruh warga bahwa akan ada pemadaman {JENIS} sementara ' +
      'karena {SEBAB}.\n\n' +
      'Mohon warga mempersiapkan {PERSIAPAN} secukupnya. ' +
      'Mohon maaf atas ketidaknyamanannya.',
    fields: [
      { token: '{JENIS}', label: 'Jenis Pemadaman', type: 'select', options: ['listrik', 'air', 'listrik & air'] },
      {
        token: '{SEBAB}',
        label: 'Penyebab',
        type: 'select',
        options: ['pemeliharaan jaringan', 'perbaikan kerusakan', 'penggantian meteran', 'pekerjaan proyek'],
      },
      {
        token: '{PERSIAPAN}',
        label: 'Yang Perlu Disiapkan',
        type: 'select',
        options: ['cadangan air', 'penerangan (lampu/senter)', 'cadangan air & penerangan'],
      },
    ],
  },
  {
    title: 'Ucapan Duka Cita',
    content:
      'Innalillahi wa inna ilaihi rajiun.\n\n' +
      'Telah berpulang ke Rahmatullah, {NAMA}, warga {ALAMAT}.\n\n' +
      'Segenap warga RT turut berduka cita yang sedalam-dalamnya. Semoga almarhum/almarhumah ' +
      'husnul khatimah dan keluarga yang ditinggalkan diberi ketabahan.',
    suggestPinned: true,
    fields: [
      { token: '{NAMA}', label: 'Nama (Kepala Keluarga)', type: 'wargaSelect', autoAddressToken: '{ALAMAT}' },
      { token: '{ALAMAT}', label: 'Blok / Alamat', type: 'text', placeholder: 'Otomatis dari data warga' },
    ],
  },
];
