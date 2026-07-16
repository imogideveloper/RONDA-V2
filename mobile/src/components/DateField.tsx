// Input tanggal reusable — membuka KALENDER custom di dalam app (bukan picker browser).
// Konsisten di web & native, selalu di dalam frame app.
// Nilai (value/onChange) dalam format Indonesia: "12 Mei 1990".
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { colors, wargaColors } from '../config/theme';
import { indoToISO } from '../lib/dateInput';

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface Props {
  value: string; // format Indonesia
  onChange: (indo: string) => void;
  placeholder?: string;
}

export function DateField({ value, onChange, placeholder = 'Pilih tanggal' }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.fieldText, !value && { color: colors.textHint }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Icon name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>
      <CalendarModal
        visible={open}
        selectedISO={indoToISO(value)}
        onClose={() => setOpen(false)}
        onPick={(indo) => {
          onChange(indo);
          setOpen(false);
        }}
        onClear={() => {
          onChange('');
          setOpen(false);
        }}
      />
    </>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function CalendarModal({
  visible,
  selectedISO,
  onClose,
  onPick,
  onClear,
}: {
  visible: boolean;
  selectedISO: string; // 'yyyy-mm-dd' atau ''
  onClose: () => void;
  onPick: (indo: string) => void;
  onClear: () => void;
}) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });

  useEffect(() => {
    if (!visible) return;
    if (selectedISO) {
      const d = new Date(`${selectedISO}T00:00:00`);
      if (!isNaN(d.getTime())) {
        setView({ y: d.getFullYear(), m: d.getMonth() });
        return;
      }
    }
    setView({ y: today.getFullYear(), m: today.getMonth() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, selectedISO]);

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const startWeekday = new Date(view.y, view.m, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const todayISO = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const prevMonth = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const nextMonth = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const pick = (d: number) => onPick(`${d} ${BULAN[view.m]} ${view.y}`);
  const pickToday = () => onPick(`${today.getDate()} ${BULAN[today.getMonth()]} ${today.getFullYear()}`);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.head}>
            <Pressable onPress={prevMonth} hitSlop={8} style={styles.navBtn}>
              <Icon name="chevron-back" size={18} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headTitle}>{BULAN[view.m]} {view.y}</Text>
            <Pressable onPress={nextMonth} hitSlop={8} style={styles.navBtn}>
              <Icon name="chevron-forward" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {HARI_PENDEK.map((h) => (
              <Text key={h} style={styles.weekCell}>{h}</Text>
            ))}
          </View>

          {rows.map((row, ri) => (
            <View key={ri} style={styles.weekRow}>
              {row.map((d, ci) => {
                if (d == null) return <View key={ci} style={styles.dayCell} />;
                const iso = `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
                const isSelected = iso === selectedISO;
                const isToday = iso === todayISO;
                return (
                  <Pressable key={ci} style={styles.dayCell} onPress={() => pick(d)}>
                    <View style={[styles.dayInner, isSelected && styles.daySelected, !isSelected && isToday && styles.dayToday]}>
                      <Text style={[styles.dayText, isSelected && styles.daySelectedText]}>{d}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={styles.footer}>
            <Pressable onPress={onClear} hitSlop={8}>
              <Text style={styles.footerClear}>Hapus</Text>
            </Pressable>
            <Pressable onPress={pickToday} hitSlop={8}>
              <Text style={styles.footerToday}>Hari Ini</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  fieldText: { flex: 1, fontSize: 15, color: colors.textPrimary },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, backgroundColor: colors.surface, borderRadius: 18, padding: 16 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  navBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  weekRow: { flexDirection: 'row' },
  weekCell: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textSecondary, paddingVertical: 6 },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: wargaColors.primaryGreen },
  dayToday: { borderWidth: 1, borderColor: wargaColors.primaryGreen },
  dayText: { fontSize: 13, color: colors.textPrimary },
  daySelectedText: { color: '#fff', fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footerClear: { fontSize: 13, fontWeight: '600', color: wargaColors.dangerRed },
  footerToday: { fontSize: 13, fontWeight: '600', color: wargaColors.primaryGreen },
});
