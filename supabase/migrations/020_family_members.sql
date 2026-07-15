-- ============================================================
-- Anggota keluarga per warga (kepala keluarga = head_user_id).
-- Hanya Ketua RT / Bendahara yang boleh menambah/ubah/hapus.
-- Warga hanya bisa MEMBACA anggota keluarganya sendiri (untuk surat).
-- Jalankan di Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.family_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rt_id          UUID NOT NULL REFERENCES public.rt_units(id) ON DELETE CASCADE,
  head_user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  relation       TEXT,
  nik            TEXT,
  birth_place    TEXT,
  birth_date     TEXT,
  gender         TEXT,
  religion       TEXT,
  marital_status TEXT,
  occupation     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_head ON public.family_members(head_user_id);
CREATE INDEX IF NOT EXISTS idx_family_rt ON public.family_members(rt_id);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Baca: warga baca keluarganya sendiri; Ketua/Bendahara baca semua di RT-nya.
DROP POLICY IF EXISTS "family_select" ON public.family_members;
CREATE POLICY "family_select" ON public.family_members
  FOR SELECT USING (
    head_user_id = auth.uid()
    OR (
      rt_id = public.current_user_rt_id()
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('ketua_rt', 'bendahara')
      )
    )
  );

-- Tulis (insert/update/delete): hanya Ketua/Bendahara di RT tsb.
DROP POLICY IF EXISTS "family_write_officer" ON public.family_members;
CREATE POLICY "family_write_officer" ON public.family_members
  FOR ALL USING (
    rt_id = public.current_user_rt_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ketua_rt', 'bendahara')
    )
  ) WITH CHECK (
    rt_id = public.current_user_rt_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('ketua_rt', 'bendahara')
    )
  );
