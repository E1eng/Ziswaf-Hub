-- ============================================================================
-- v2 / 010 — Nominal bantuan per penerima di level program
-- ============================================================================
--
-- Masalah: sebelumnya nominal alokasi per penerima diambil dari
-- estimated_amount assessment (estimasi kebutuhan hidup mustahik), sehingga
-- untuk program sembako pun muncul angka Rp500rb–1jt yang tidak realistis
-- (sembako biasanya Rp100rb–300rb).
--
-- Solusi: nominal ditentukan oleh PROGRAM sesuai jenis bantuannya, bukan oleh
-- kebutuhan hidup generik mustahik. Kolom baru amount_per_beneficiary menjadi
-- default per penerima di wizard alokasi (tetap bisa di-override per baris).

ALTER TABLE public.programs
    ADD COLUMN IF NOT EXISTS amount_per_beneficiary NUMERIC(20,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.programs.amount_per_beneficiary IS
    'Nominal bantuan standar per penerima untuk program ini (mis. sembako 200rb). Dipakai sebagai default di wizard alokasi, bisa di-override per penerima.';
