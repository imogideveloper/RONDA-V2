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
};
