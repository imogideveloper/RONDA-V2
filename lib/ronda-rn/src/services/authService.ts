// Port dari lib/services/auth_service.ts
import { supabase } from '../config/supabase';
import { Profile, profileFromMap, profileHasRt } from '../types/models';
import { normalizePhone } from '../lib/phone';

export { normalizePhone, displayPhone, mapAuthError } from '../lib/phone';

let lastProfileError: string | null = null;
let pendingPhone: string | null = null;

export const authService = {
  get lastProfileError() {
    return lastProfileError;
  },
  get pendingPhone() {
    return pendingPhone;
  },

  async currentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  },

  async isLoggedIn(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return data.session != null;
  },

  // ── OTP (Nomor HP) ──────────────────────────────────────────────
  async sendOtp(phone: string): Promise<void> {
    const normalized = normalizePhone(phone);
    pendingPhone = normalized;
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    if (error) throw error;
  },

  async verifyOtp(phone: string, otp: string): Promise<void> {
    const normalized = normalizePhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp.trim(),
      type: 'sms',
    });
    if (error) throw error;
    pendingPhone = null;
    await supabase.auth.updateUser({
      data: { phone: normalized, full_name: 'Warga RT' },
    });
  },

  // ── Email (Dev) ─────────────────────────────────────────────────
  async loginWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  },

  /** @returns needsEmailConfirmation */
  async registerWithEmail(
    email: string,
    password: string,
    fullName: string,
    phone: string,
  ): Promise<boolean> {
    const normalizedPhone = phone.trim() === '' ? '' : normalizePhone(phone);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), phone: normalizedPhone, role: 'warga' },
      },
    });
    if (error) throw error;

    if (data.user != null && data.session != null) {
      await this.getProfile();
      return false;
    }
    // user ada tapi session null → perlu konfirmasi email
    return data.user != null && data.session == null;
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    pendingPhone = null;
  },

  // ── Profil ──────────────────────────────────────────────────────
  async updateMyProfile(fullName: string, phone: string, avatarUrl?: string): Promise<void> {
    const user = await this.currentUser();
    if (user == null) return;

    const payload: Record<string, any> = {
      full_name: fullName.trim(),
      phone: phone.trim(),
    };
    if (avatarUrl != null) payload.avatar_url = avatarUrl;

    await supabase.from('profiles').update(payload).eq('id', user.id);
    await supabase.auth.updateUser({ data: payload });
  },

  async getProfile(): Promise<Profile | null> {
    lastProfileError = null;
    const user = await this.currentUser();
    if (user == null) return null;

    const fromRpc = await this._fetchViaRpc();
    if (fromRpc != null) return fromRpc;

    try {
      const { data } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle();
      if (data != null) return profileFromMap(data);
    } catch (e: any) {
      lastProfileError = String(e?.message ?? e);
    }

    return this._upsertProfileFromAuth(user);
  },

  async _fetchViaRpc(): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.rpc('ensure_my_profile');
      if (error) throw error;
      if (data != null && typeof data === 'object') return profileFromMap(data as any);
    } catch (e: any) {
      lastProfileError = String(e?.message ?? e);
    }
    return null;
  },

  async _upsertProfileFromAuth(user: any): Promise<Profile | null> {
    try {
      const phone = user.phone ?? user.user_metadata?.phone ?? '';
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? 'Warga RT',
        phone,
        is_active: true,
      });
      const { data } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle();
      if (data != null) return profileFromMap(data);
      lastProfileError = 'Profil tidak terbaca setelah upsert';
    } catch (e: any) {
      lastProfileError = String(e?.message ?? e);
    }
    return null;
  },
};

export { profileHasRt };
