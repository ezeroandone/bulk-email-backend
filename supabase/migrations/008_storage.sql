-- ============================================================
-- 008_storage.sql
-- Supabase Storage bucket creation and RLS policies
--
-- Buckets are created via INSERT into storage.buckets (Supabase's
-- internal catalog table).  The RLS policies are applied to
-- storage.objects which is the actual data table.
--
-- Path convention used throughout:
--   {user_id}/...      — user-scoped prefix
--
-- All policies follow the principle of least privilege:
--   - Users may only access their own files.
--   - The `avatars` bucket allows public reads.
--   - service_role bypasses RLS everywhere automatically.
-- ============================================================

-- ------------------------------------------------------------
-- Create buckets
-- ------------------------------------------------------------

-- documents: private — generated / pre-existing document files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    52428800,  -- 50 MB
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/png',
        'image/jpeg',
        'image/webp'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- templates: private — DOCX / PDF / image templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'templates',
    'templates',
    false,
    52428800,  -- 50 MB
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/png',
        'image/jpeg',
        'image/webp'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- datasets: private — CSV / XLSX spreadsheets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'datasets',
    'datasets',
    false,
    52428800,  -- 50 MB
    ARRAY[
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- avatars: public read — user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880,  -- 5 MB
    ARRAY[
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS policies on storage.objects
-- ============================================================

-- ============================================================
-- DOCUMENTS bucket
-- ============================================================
CREATE POLICY "documents: user upload own files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "documents: user read own files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "documents: user update own files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "documents: user delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- ============================================================
-- TEMPLATES bucket
-- ============================================================
CREATE POLICY "templates: user upload own files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'templates'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "templates: user read own files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'templates'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "templates: user update own files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'templates'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'templates'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "templates: user delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'templates'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- ============================================================
-- DATASETS bucket
-- ============================================================
CREATE POLICY "datasets: user upload own files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'datasets'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "datasets: user read own files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'datasets'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "datasets: user update own files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'datasets'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'datasets'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "datasets: user delete own files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'datasets'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- ============================================================
-- AVATARS bucket
-- Public read (bucket.public = true handles anonymous reads via
-- the Supabase CDN URL).  Write is still user-scoped.
-- ============================================================
CREATE POLICY "avatars: public read"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');

CREATE POLICY "avatars: user upload own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "avatars: user update own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE POLICY "avatars: user delete own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );
