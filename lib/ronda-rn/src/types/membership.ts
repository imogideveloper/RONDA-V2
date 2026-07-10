// Port dari lib/models/rt_membership_model.dart
type Row = Record<string, any>;

export interface RtMembership {
  rtId: string;
  rtName: string;
  rtNumber: string;
  rwNumber: string | null;
  address: string | null;
  role: string;
  joinedAt: Date;
  isActive: boolean;
}

export function rtMembershipFromMap(map: Row): RtMembership {
  const joinedRaw = map.joined_at;
  return {
    rtId: map.rt_id as string,
    rtName: (map.rt_name as string) ?? 'RT',
    rtNumber: (map.rt_number as string) ?? '',
    rwNumber: (map.rw_number as string) ?? null,
    address: (map.address as string) ?? null,
    role: (map.role as string) ?? 'warga',
    joinedAt: joinedRaw ? new Date(joinedRaw) : new Date(),
    isActive: (map.is_active as boolean) ?? false,
  };
}

export function membershipDisplayLabel(m: RtMembership): string {
  const rw = m.rwNumber && m.rwNumber.length > 0 ? ` / RW ${m.rwNumber}` : '';
  return `RT ${m.rtNumber}${rw}`;
}

export function membershipLocationLine(m: RtMembership): string {
  if (m.address && m.address.trim().length > 0) return `${m.rtName} · ${m.address}`;
  return m.rtName;
}

// ── Ringkasan iuran RT ─────────────────────────────────────────────
export interface IuranRtSummary {
  periodKey: string;
  totalWarga: number;
  paidCount: number;
  unpaidCount: number;
}

export function iuranRtSummaryFromMap(map: Row): IuranRtSummary {
  return {
    periodKey: (map.period_key as string) ?? '',
    totalWarga: Number(map.total_warga ?? 0),
    paidCount: Number(map.paid_count ?? 0),
    unpaidCount: Number(map.unpaid_count ?? 0),
  };
}

export function iuranRtPaidRatio(s: IuranRtSummary): number {
  if (s.totalWarga <= 0) return 0;
  return Math.min(1, Math.max(0, s.paidCount / s.totalWarga));
}

export interface WargaActivityItem {
  title: string;
  dateLabel: string;
  color: string;
}
