// Anggota keluarga per warga. Input/kelola: Ketua RT / Bendahara (dijaga RLS).
// Warga hanya bisa membaca keluarganya sendiri (listMine).
import { supabase } from '../config/supabase';
import { FamilyMember, familyMemberFromMap } from '../types/models';

export interface FamilyMemberInput {
  name: string;
  relation?: string | null;
  nik?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  religion?: string | null;
  maritalStatus?: string | null;
  occupation?: string | null;
}

const clean = (s?: string | null) => (s && s.trim() !== '' ? s.trim() : null);

function toPayload(input: FamilyMemberInput): Record<string, any> {
  return {
    name: input.name.trim(),
    relation: clean(input.relation),
    nik: clean(input.nik),
    birth_place: clean(input.birthPlace),
    birth_date: clean(input.birthDate),
    gender: clean(input.gender),
    religion: clean(input.religion),
    marital_status: clean(input.maritalStatus),
    occupation: clean(input.occupation),
  };
}

export const familyService = {
  /** Anggota keluarga milik warga tertentu (dipakai Ketua saat mengelola). */
  async listForHead(headUserId: string): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select()
      .eq('head_user_id', headUserId)
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map(familyMemberFromMap);
  },

  /** Anggota keluarga milik user yang sedang login (dipakai warga di form surat). */
  async listMine(): Promise<FamilyMember[]> {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return [];
    const { data, error } = await supabase
      .from('family_members')
      .select()
      .eq('head_user_id', uid)
      .order('created_at');
    if (error) throw error;
    return (data ?? []).map(familyMemberFromMap);
  },

  /** Jumlah total anggota keluarga (jiwa tambahan) di sebuah RT. */
  async countInRt(rtId: string): Promise<number> {
    const { count, error } = await supabase
      .from('family_members')
      .select('id', { count: 'exact', head: true })
      .eq('rt_id', rtId);
    if (error) return 0;
    return count ?? 0;
  },

  /** Jumlah anggota keluarga per kepala keluarga di sebuah RT (untuk hitung jiwa/KK). */
  async countByHeadInRt(rtId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('family_members')
      .select('head_user_id')
      .eq('rt_id', rtId);
    if (error) return {};
    const map: Record<string, number> = {};
    for (const row of data ?? []) {
      const h = (row as any).head_user_id as string | null;
      if (h) map[h] = (map[h] ?? 0) + 1;
    }
    return map;
  },

  async addMember(rtId: string, headUserId: string, input: FamilyMemberInput): Promise<void> {
    const { error } = await supabase
      .from('family_members')
      .insert({ rt_id: rtId, head_user_id: headUserId, ...toPayload(input) });
    if (error) throw error;
  },

  async updateMember(id: string, input: FamilyMemberInput): Promise<void> {
    const { error } = await supabase.from('family_members').update(toPayload(input)).eq('id', id);
    if (error) throw error;
  },

  async deleteMember(id: string): Promise<void> {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) throw error;
  },

  /** Ketua/Bendahara menyetel alamat rumah seorang warga (mis. dari hasil scan KK). */
  async setMemberAddress(memberId: string, address: string): Promise<void> {
    const { error } = await supabase.rpc('ketua_update_member_address', {
      p_member_id: memberId,
      p_address: address,
    });
    if (error) throw error;
  },
};
