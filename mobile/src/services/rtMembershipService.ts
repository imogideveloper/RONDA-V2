// Port dari lib/services/rt_membership_service.dart
import { supabase } from '../config/supabase';
import { RtMembership, rtMembershipFromMap } from '../types/membership';

export const rtMembershipService = {
  async listMyMemberships(): Promise<RtMembership[]> {
    try {
      const { data, error } = await supabase.rpc('list_my_rt_memberships');
      if (error) throw error;
      if (!data) return [];
      return (data as any[]).map(rtMembershipFromMap);
    } catch {
      return fallbackSingleMembership();
    }
  },

  async switchActiveRt(rtId: string): Promise<void> {
    const { error } = await supabase.rpc('switch_active_rt', { p_rt_id: rtId });
    if (error) throw error;
  },

  async joinRtByCode(code: string): Promise<Record<string, any>> {
    const { data, error } = await supabase.rpc('join_rt_by_code', {
      p_invite_code: code.trim(),
    });
    if (error) throw error;
    return (data ?? {}) as Record<string, any>;
  },
};

async function fallbackSingleMembership(): Promise<RtMembership[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userId == null) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('rt_id, role')
    .eq('id', userId)
    .maybeSingle();
  const rtId = profile?.rt_id as string | undefined;
  if (rtId == null) return [];

  const { data: rt } = await supabase.from('rt_units').select().eq('id', rtId).maybeSingle();
  if (rt == null) return [];

  return [
    {
      rtId,
      rtName: (rt.name as string) ?? 'RT',
      rtNumber: (rt.rt_number as string) ?? '',
      rwNumber: (rt.rw_number as string) ?? null,
      address: (rt.address as string) ?? null,
      role: (profile?.role as string) ?? 'warga',
      joinedAt: new Date(),
      isActive: true,
    },
  ];
}
