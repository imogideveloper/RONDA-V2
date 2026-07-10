// Port ringan dari lib/config/app_toast.dart — toast sukses/error mengambang.
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, softShadow } from '../config/theme';

type ToastKind = 'success' | 'error';
interface ToastState {
  msg: string;
  kind: ToastKind;
}

interface ToastApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
}

const ToastContext = createContext<ToastApi>({ success: () => {}, error: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string, kind: ToastKind) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ msg, kind });
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(
          () => setToast(null),
        );
      }, 2600);
    },
    [opacity],
  );

  const api: ToastApi = {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <Animated.View style={[styles.wrap, { opacity }]} pointerEvents="none">
          <View
            style={[
              styles.toast,
              { backgroundColor: toast.kind === 'error' ? colors.danger : colors.emeraldDark },
            ]}
          >
            <Ionicons
              name={toast.kind === 'error' ? 'alert-circle' : 'checkmark-circle'}
              size={20}
              color="#fff"
            />
            <Text style={styles.text}>{toast.msg}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 40,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    maxWidth: '100%',
    ...softShadow,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600', flexShrink: 1 },
});
