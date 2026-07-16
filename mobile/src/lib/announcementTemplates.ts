// Draft pengumuman siap-pakai untuk Ketua RT.
// Judul dipilih dari dropdown; isi (narasi) terisi otomatis (masih bisa diedit).
// Jam & Lokasi juga punya preset (jamOptions/lokasiOptions) yang tampil sebagai dropdown.
// Bagian [dalam kurung siku] adalah placeholder untuk disesuaikan Ketua RT.

export interface AnnouncementTemplate {
  title: string;
  content: string;
  suggestPinned?: boolean;
  jamOptions?: string[];
  lokasiOptions?: string[];
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
      'sesuai jadwal berikut.\n\n' +
      'Pembagian regu:\n' +
      '• Malam Senin: [nama-nama]\n' +
      '• Malam Selasa: [nama-nama]\n' +
      '• Malam Rabu: [nama-nama]\n\n' +
      'Mohon setiap regu hadir sesuai jadwal. Bila berhalangan, harap mencari pengganti dan mengabari koordinator. Terima kasih.',
    jamOptions: ['21.00 s.d. 03.00 WIB', '22.00 s.d. 04.00 WIB', '23.00 s.d. 04.00 WIB'],
    lokasiOptions: ['Pos Ronda RT', 'Keliling lingkungan RT'],
  },
  {
    title: 'Rapat Warga RT',
    content:
      'Mengundang Bapak/Ibu warga untuk hadir dalam rapat rutin RT guna membahas ' +
      '[agenda: program kerja / iuran / kegiatan bersama].\n\n' +
      'Agenda:\n' +
      '1. [poin pertama]\n' +
      '2. [poin kedua]\n' +
      '3. Lain-lain\n\n' +
      'Kehadiran Bapak/Ibu sangat penting untuk kemajuan lingkungan kita. Atas perhatiannya, terima kasih.',
    jamOptions: ['16.00 WIB s.d. selesai', '19.30 WIB s.d. selesai', '20.00 WIB s.d. selesai'],
    lokasiOptions: ['Balai Warga', 'Rumah Ketua RT', 'Aula RW'],
  },
  {
    title: 'Pembayaran Iuran Bulanan',
    content:
      'Kepada seluruh warga, kami ingatkan mengenai iuran bulanan RT sebesar Rp [50.000] per bulan, ' +
      'dengan jatuh tempo paling lambat tanggal [10] setiap bulan.\n\n' +
      'Pembayaran dapat dilakukan melalui aplikasi (QRIS/transfer) atau tunai ke Bendahara. ' +
      'Iuran digunakan untuk kas kebersihan, keamanan, dan kegiatan warga. ' +
      'Bagi yang sudah membayar, kami ucapkan terima kasih.',
    jamOptions: ['Jam kerja (08.00–17.00 WIB)', 'Setiap saat via aplikasi'],
    lokasiOptions: ['Rumah Bendahara RT', 'Via aplikasi (QRIS/transfer)'],
  },
  {
    title: 'Peringatan Keamanan Lingkungan',
    content:
      '⚠️ HIMBAUAN KEAMANAN\n\n' +
      'Sehubungan dengan [adanya laporan kejadian / peningkatan kewaspadaan], seluruh warga dihimbau untuk:\n\n' +
      '• Selalu mengunci pintu, pagar, dan kendaraan.\n' +
      '• Tidak memarkir kendaraan di luar dengan kunci tertinggal.\n' +
      '• Melapor ke petugas ronda / Ketua RT bila melihat aktivitas mencurigakan.\n' +
      '• Menyalakan lampu depan rumah pada malam hari.\n\n' +
      'Mari saling menjaga keamanan lingkungan kita. Terima kasih atas perhatian dan kerja samanya.',
    suggestPinned: true,
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
      'Diberitahukan kepada seluruh warga bahwa akan ada pemadaman [listrik/air] sementara ' +
      'karena [pemeliharaan jaringan / perbaikan].\n\n' +
      'Mohon warga mempersiapkan [cadangan air / penerangan] secukupnya. ' +
      'Mohon maaf atas ketidaknyamanannya.',
    jamOptions: ['09.00 s.d. 15.00 WIB', '10.00 s.d. 14.00 WIB', 'Sepanjang hari'],
    lokasiOptions: ['Seluruh wilayah RT', 'Sebagian blok RT'],
  },
  {
    title: 'Ucapan Duka Cita',
    content:
      'Innalillahi wa inna ilaihi rajiun.\n\n' +
      'Telah berpulang ke Rahmatullah, [Nama Almarhum/Almarhumah], warga [blok/alamat].\n\n' +
      'Segenap warga RT turut berduka cita yang sedalam-dalamnya. Semoga almarhum/almarhumah ' +
      'husnul khatimah dan keluarga yang ditinggalkan diberi ketabahan.',
    suggestPinned: true,
    jamOptions: ['Menyusul', 'Ba’da Dzuhur', 'Ba’da Ashar'],
    lokasiOptions: ['Rumah duka', 'Masjid setempat', 'TPU setempat'],
  },
];
