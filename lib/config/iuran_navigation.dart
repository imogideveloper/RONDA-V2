/// Mode tampilan tab Iuran saat dibuka dari dashboard Ketua RT.
enum IuranKetuaMode {
  /// Semua tagihan (default tab Iuran).
  semua,

  /// Tagih warga — kartu expandable + mention WhatsApp.
  tagih,

  /// Verifikasi pembayaran — kartu expandable + approve.
  verifikasi,
}

typedef ShellNavigateCallback = void Function(int tabIndex, {IuranKetuaMode? iuranMode});
