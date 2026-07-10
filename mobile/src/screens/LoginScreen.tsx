// Port dari lib/pages/auth/login_otp_page.dart
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon, type IconName } from '../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../config/theme';
import { Card, PrimaryButton } from '../components/Card';
import { Field } from '../components/Field';
import { useToast } from '../components/Toast';
import { authService } from '../services/authService';
import { displayPhone, mapAuthError, normalizePhone, digitsOnly } from '../lib/phone';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type Tab = 'phone' | 'email';

export default function LoginScreen({ navigation }: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('phone');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  const [obscure, setObscure] = useState(true);
  const [obscureConfirm, setObscureConfirm] = useState(true);
  const [isRegisterMode, setRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const goHome = () => navigation.replace('Home');

  const switchTab = (t: Tab) => {
    setTab(t);
    setOtpSent(false);
    setRegisterMode(false);
  };

  // ── OTP ──
  async function sendOtp() {
    const normalized = normalizePhone(phone);
    if (phone.length < 9 || normalized.length < 12) {
      toast.error('Nomor HP tidak valid (min. 9 digit)');
      return;
    }
    setLoading(true);
    try {
      await authService.sendOtp(phone);
      setOtpSent(true);
      toast.success('Kode OTP dikirim (SMS/WhatsApp)');
    } catch (e: any) {
      toast.error(mapAuthError(String(e?.message ?? 'Gagal kirim OTP')));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (otp.trim().length < 4) {
      toast.error('Masukkan kode OTP');
      return;
    }
    setLoading(true);
    try {
      await authService.verifyOtp(phone, otp);
      goHome();
    } catch (e: any) {
      toast.error(mapAuthError(String(e?.message ?? 'Kode OTP salah atau kedaluwarsa')));
    } finally {
      setLoading(false);
    }
  }

  // ── Email ──
  async function loginEmail() {
    if (email.trim() === '' || password.length < 6) {
      toast.error('Email dan password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await authService.loginWithEmail(email, password);
      goHome();
    } catch (e: any) {
      toast.error(String(e?.message ?? 'Login gagal'));
    } finally {
      setLoading(false);
    }
  }

  async function registerEmail() {
    if (name.trim().length < 2) return toast.error('Nama lengkap wajib diisi');
    if (email.trim() === '' || !email.includes('@')) return toast.error('Email tidak valid');
    if (registerPhone.length < 9) return toast.error('Nomor HP wajib (min. 9 digit)');
    if (password.length < 6) return toast.error('Password minimal 6 karakter');
    if (password !== confirmPassword) return toast.error('Konfirmasi password tidak sama');

    setLoading(true);
    try {
      const needsConfirm = await authService.registerWithEmail(email, password, name, registerPhone);
      if (needsConfirm) {
        toast.success('Daftar berhasil! Cek email untuk konfirmasi, lalu masuk.');
        setRegisterMode(false);
        return;
      }
      toast.success('Selamat datang! Anda terdaftar sebagai Warga RT.');
      goHome();
    } catch (e: any) {
      toast.error(mapAuthError(String(e?.message ?? 'Pendaftaran gagal')));
    } finally {
      setLoading(false);
    }
  }

  const infoText =
    tab === 'phone'
      ? 'Nomor baru otomatis terdaftar sebagai Warga RT setelah verifikasi OTP.'
      : isRegisterMode
        ? 'Daftar sebagai Warga RT. Role warga diset otomatis di database.'
        : 'Login email untuk development. Belum punya akun? Ketuk Daftar di bawah.';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Icon name="people-circle" size={92} color={colors.emerald} />
          </View>
          <Text style={styles.appTitle}>RT OS Indonesia</Text>
          <Text style={styles.appSubtitle}>
            Kelola iuran, kas RT, dan pengumuman{'\n'}lingkungan Anda dengan mudah
          </Text>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <TabButton label="Nomor HP" active={tab === 'phone'} onPress={() => switchTab('phone')} />
            <TabButton label="Email (Dev)" active={tab === 'email'} onPress={() => switchTab('email')} />
          </View>

          {tab === 'phone' ? renderPhoneTab() : renderEmailTab()}

          <Card color={colors.emeraldMuted} style={styles.infoCard}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Icon
                name={tab === 'phone' ? 'chatbox-ellipses-outline' : 'mail-outline'}
                size={22}
                color={colors.emeraldDark}
              />
              <Text style={styles.infoText}>{infoText}</Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function renderPhoneTab() {
    if (!otpSent) {
      return (
        <View style={{ gap: 8 }}>
          <Field
            label="Nomor WhatsApp / HP"
            hint="Tidak perlu ketik +62 — cukup 08xxxxxxxxxx"
            leftIcon="phone-portrait-outline"
            prefixText="+62 "
            keyboardType="number-pad"
            placeholder="83845509841"
            value={phone}
            onChangeText={(t) => setPhone(digitsOnly(t))}
          />
          {phone.length > 0 && (
            <Text style={styles.willSend}>Akan dikirim ke: {displayPhone(phone)}</Text>
          )}
          <View style={{ height: 12 }} />
          <PrimaryButton label="Kirim Kode OTP" onPress={sendOtp} loading={loading} />
          <Text style={styles.helper}>
            Belum punya akun? Masukkan nomor HP — setelah OTP Anda terdaftar otomatis sebagai Warga RT.
          </Text>
        </View>
      );
    }
    return (
      <View style={{ gap: 8 }}>
        <Text style={styles.sentTo}>Kode dikirim ke {normalizePhone(phone)}</Text>
        <Field
          label="Masukkan Kode OTP"
          keyboardType="number-pad"
          maxLength={6}
          placeholder="• • • • • •"
          value={otp}
          onChangeText={(t) => setOtp(digitsOnly(t))}
          style={styles.otpInput}
          textAlign="center"
        />
        <View style={{ height: 12 }} />
        <PrimaryButton label="Masuk" onPress={verifyOtp} loading={loading} />
        <Pressable onPress={() => { setOtpSent(false); setOtp(''); }} style={styles.linkCenter}>
          <Text style={styles.link}>Ganti nomor HP</Text>
        </Pressable>
      </View>
    );
  }

  function renderEmailTab() {
    if (isRegisterMode) {
      return (
        <View style={{ gap: 14 }}>
          <View style={styles.registerBanner}>
            <Icon name="person-add-outline" size={22} color={colors.emeraldDark} />
            <Text style={styles.registerBannerText}>
              Daftar akun baru — otomatis menjadi Warga RT
            </Text>
          </View>
          <Field label="Nama lengkap" leftIcon="person-outline" placeholder="Contoh: Budi Santoso" autoCapitalize="words" value={name} onChangeText={setName} />
          <Field label="Nomor HP" hint="Tanpa +62 — cukup 08xxxxxxxxxx" leftIcon="phone-portrait-outline" prefixText="+62 " keyboardType="number-pad" placeholder="83845509841" value={registerPhone} onChangeText={(t) => setRegisterPhone(digitsOnly(t))} />
          <Field label="Email" leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" placeholder="nama@email.com" value={email} onChangeText={setEmail} />
          <Field label="Password" leftIcon="lock-closed-outline" placeholder="Minimal 6 karakter" secureTextEntry={obscure} rightIcon={obscure ? 'eye-outline' : 'eye-off-outline'} onRightPress={() => setObscure(!obscure)} value={password} onChangeText={setPassword} />
          <Field label="Konfirmasi password" leftIcon="lock-closed-outline" placeholder="Ulangi password" secureTextEntry={obscureConfirm} rightIcon={obscureConfirm ? 'eye-outline' : 'eye-off-outline'} onRightPress={() => setObscureConfirm(!obscureConfirm)} value={confirmPassword} onChangeText={setConfirmPassword} />
          <PrimaryButton label="Daftar sebagai Warga" onPress={registerEmail} loading={loading} />
          <Pressable onPress={() => setRegisterMode(false)} style={styles.linkCenter}>
            <Text style={styles.link}>Sudah punya akun? Masuk</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={{ gap: 14 }}>
        <Field label="Email" leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" placeholder="nama@email.com" value={email} onChangeText={setEmail} />
        <Field label="Password" leftIcon="lock-closed-outline" placeholder="Minimal 6 karakter" secureTextEntry={obscure} rightIcon={obscure ? 'eye-outline' : 'eye-off-outline'} onRightPress={() => setObscure(!obscure)} value={password} onChangeText={setPassword} />
        <PrimaryButton label="Masuk dengan Email" onPress={loginEmail} loading={loading} />
        <Pressable onPress={() => { setRegisterMode(true); setConfirmPassword(''); }} style={styles.linkCenter}>
          <Text style={styles.link}>Belum punya akun? Daftar sebagai Warga</Text>
        </Pressable>
      </View>
    );
  }
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  hero: { alignItems: 'center', marginTop: 24 },
  appTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginTop: 16 },
  appSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  tabBar: {
    flexDirection: 'row',
    marginTop: 28,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.emerald },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: colors.emerald },
  willSend: { fontSize: 12, color: colors.emerald, fontWeight: '600' },
  helper: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: 8 },
  sentTo: { fontSize: 14, color: colors.textSecondary },
  otpInput: { fontSize: 24, fontWeight: '700', letterSpacing: 8 },
  linkCenter: { alignItems: 'center', paddingVertical: 8 },
  link: { color: colors.emerald, fontSize: 14, fontWeight: '600' },
  registerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.emeraldMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  registerBannerText: { flex: 1, fontSize: 13, color: colors.emeraldDark, fontWeight: '600' },
  infoCard: { marginTop: 24 },
  infoText: { flex: 1, fontSize: 12, color: colors.emeraldDark, lineHeight: 18 },
});
