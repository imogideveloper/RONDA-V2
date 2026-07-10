// Port dari lib/models/warga_home_data.dart
import {
  Announcement,
  IuranRecord,
  KasSummary,
  Profile,
  SuratRequest,
  emptyKasSummary,
  iuranIsAwaiting,
  iuranIsPaid,
  iuranIsUnpaid,
} from './models';

export interface WargaHomeData {
  announcements: Announcement[];
  bills: IuranRecord[];
  kas: KasSummary;
  ketua: Profile | null;
  pendingSuratCount: number;
  mySuratRequests: SuratRequest[];
}

export const emptyWargaHomeData = (): WargaHomeData => ({
  announcements: [],
  bills: [],
  kas: emptyKasSummary(),
  ketua: null,
  pendingSuratCount: 0,
  mySuratRequests: [],
});

export const totalTagihan = (d: WargaHomeData): number =>
  d.bills.filter(iuranIsUnpaid).reduce((s, b) => s + b.amount, 0);

export const bulanTertunggak = (d: WargaHomeData): number =>
  d.bills.filter(iuranIsUnpaid).length;

export const awaitingVerification = (d: WargaHomeData): IuranRecord[] =>
  d.bills.filter(iuranIsAwaiting);

export const paidCount = (d: WargaHomeData): number =>
  d.bills.filter(iuranIsPaid).length;

export const totalKontribusi = (d: WargaHomeData): number =>
  d.bills.filter(iuranIsPaid).reduce((s, b) => s + b.amount, 0);
