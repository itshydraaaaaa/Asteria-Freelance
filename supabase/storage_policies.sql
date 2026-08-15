-- ============================================================
-- Asteria Freelance — Private KYC Document Storage Policies
-- Bucket: kyc-documents (Private, public access = FALSE)
-- ============================================================

-- 1. Create the private bucket for KYC documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Allow authenticated users to upload their own KYC documents
CREATE POLICY "Users can upload their own KYC docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow users to read/generate signed URLs for only their own files
CREATE POLICY "Users can view their own KYC docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_id = auth.uid() AND users.role = 'ADMIN'
    )
  )
);

-- 4. Retention cleanup (optional): Delete files for rejected KYC after 90 days
-- SELECT cron.schedule('cleanup-rejected-kyc-storage', '0 3 * * *',
--   $$DELETE FROM storage.objects WHERE bucket_id = 'kyc-documents' AND created_at < now() - interval '90 days'$$);
