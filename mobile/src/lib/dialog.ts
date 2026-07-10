import { Alert, Platform } from 'react-native';

// Dialog lintas-platform. Alert dari react-native TIDAK jalan di web
// (react-native-web) — di web kita fallback ke window.confirm / window.alert.

/** Konfirmasi ya/tidak. onConfirm dipanggil jika user setuju. */
export function confirmDialog(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'OK',
) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Batal', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Info satu tombol. onClose (opsional) dipanggil setelah ditutup. */
export function alertDialog(title: string, message?: string, onClose?: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    onClose?.();
    return;
  }
  Alert.alert(title, message, onClose ? [{ text: 'OK', onPress: onClose }] : undefined);
}
