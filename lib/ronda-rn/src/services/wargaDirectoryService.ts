// Port dari lib/services/warga_directory_service.dart
import { supabase } from '../config/supabase';
import { profileFromMap } from '../types/models';
import {
  WargaDirectoryEntry,
  directoryFromProfile,
  directoryFromRegistry,
} from '../types/directory';
import { normalizePhone } from '../lib/phone';

export const TEMPLATE_CSV =
  'nama_lengkap,nomor_hp,email,blok_rumah\n' +
  'Budi Santoso,081234567890,budi@email.com,Blok A No 1\n' +
  'Siti Rahayu,081987654321,siti@email.com,Blok B No 2';

export const wargaDirectoryService = {
  async getDirectory(rtId: string): Promise<WargaDirectoryEntry[]> {
    const { data: membersData } = await supabase
      .from('profiles')
      .select()
      .eq('rt_id', rtId)
      .order('role')
      .order('full_name');

    const { data: pendingData } = await supabase
      .from('rt_warga_registry')
      .select()
      .eq('rt_id', rtId)
      .filter('claimed_at', 'is', null)
      .order('full_name');

    const members = (membersData ?? []).map((e) => directoryFromProfile(profileFromMap(e)));
    const memberPhones = new Set(members.map((m) => normalizePhone(m.phone)));

    const pending = (pendingData ?? [])
      .map(directoryFromRegistry)
      .filter((p) => !memberPhones.has(normalizePhone(p.phone)));

    return [...members, ...pending];
  },

  async importFromRows(
    rows: Array<Record<string, string>>,
  ): Promise<{ inserted: number; updated: number; skipped: number }> {
    const payload = rows.map((r) => ({
      full_name: r.full_name ?? '',
      phone: r.phone ?? '',
      email: r.email ?? '',
      blok_rumah: r.blok_rumah ?? '',
    }));
    const { data, error } = await supabase.rpc('import_warga_batch', { p_rows: payload });
    if (error) throw error;
    const map = (data ?? {}) as Record<string, any>;
    return {
      inserted: Number(map.inserted ?? 0),
      updated: Number(map.updated ?? 0),
      skipped: Number(map.skipped ?? 0),
    };
  },

  async updateRegistryEntry(args: {
    id: string;
    fullName: string;
    phone: string;
    email?: string;
    blokRumah?: string;
  }): Promise<void> {
    const { error } = await supabase.rpc('ketua_update_registry_entry', {
      p_id: args.id,
      p_full_name: args.fullName,
      p_phone: args.phone,
      p_email: args.email ?? '',
      p_blok_rumah: args.blokRumah ?? '',
    });
    if (error) throw error;
  },

  async updateMemberName(memberId: string, fullName: string): Promise<void> {
    const { error } = await supabase.rpc('ketua_update_member_name', {
      p_member_id: memberId,
      p_full_name: fullName,
    });
    if (error) throw error;
  },

  async deleteRegistryEntry(id: string): Promise<void> {
    const { error } = await supabase.rpc('ketua_delete_registry_entry', { p_id: id });
    if (error) throw error;
  },

  /** try_auto_join_rt RPC — auto-gabung RT jika nomor cocok di registry import. */
  async tryAutoJoinRt(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('try_auto_join_rt');
      if (error) throw error;
      return (data as any)?.joined === true;
    } catch {
      return false;
    }
  },
};

/** Parse CSV sederhana (baris pertama = header). */
export function parseCsv(raw: string): Array<Record<string, string>> {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.every((c) => c.trim().length === 0)) continue;

    const col = (names: string[]): string => {
      for (const n of names) {
        const idx = header.indexOf(n);
        if (idx >= 0 && idx < cols.length) return cols[idx].trim();
      }
      return '';
    };

    const name = col(['nama_lengkap', 'nama', 'full_name', 'name']);
    const phone = col(['nomor_hp', 'phone', 'hp', 'telepon', 'no_hp']);
    if (name === '' && phone === '') continue;

    rows.push({
      full_name: name,
      phone,
      email: col(['email', 'e-mail']),
      blok_rumah: col(['blok_rumah', 'blok', 'alamat', 'rumah']),
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let buf = '';
  let inQuote = false;
  for (const c of line) {
    if (c === '"') inQuote = !inQuote;
    else if (c === ',' && !inQuote) {
      result.push(buf);
      buf = '';
    } else buf += c;
  }
  result.push(buf);
  return result;
}
