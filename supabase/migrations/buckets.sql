-- 1. Policy: Allow anyone to VIEW avatars (Public)
CREATE POLICY "Public Access Avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- 2. Policy: Allow authenticated users to UPLOAD their own avatar
CREATE POLICY "Insert own avatar avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.filename(name) LIKE (auth.uid()::text || '-avatar%'))
);

-- 3. Policy: Allow users to UPDATE (overwrite) their own avatar
CREATE POLICY "Update own avatar avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.filename(name) LIKE (auth.uid()::text || '-avatar%'))
);

-- 4. Policy: Allow users to DELETE their own avatar
CREATE POLICY "Delete own avatar avatars" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.filename(name) LIKE (auth.uid()::text || '-avatar%'))
);

-- Policies for CVS Bucket
CREATE POLICY "Public Access CVS" 
ON storage.objects FOR SELECT USING (bucket_id = 'cvs');

CREATE POLICY "Insert own CV" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'cvs' AND (storage.filename(name) LIKE (auth.uid()::text || '-cvs%')));

CREATE POLICY "Update own CV" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'cvs' AND (storage.filename(name) LIKE (auth.uid()::text || '-cvs%')));

-- Policies for TRANSCRIPTS Bucket
CREATE POLICY "Public Access Transcripts" 
ON storage.objects FOR SELECT USING (bucket_id = 'transcripts');

CREATE POLICY "Insert own Transcript" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'transcripts' AND (storage.filename(name) LIKE (auth.uid()::text || '-transcripts%')));

CREATE POLICY "Update own Transcript" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'transcripts' AND (storage.filename(name) LIKE (auth.uid()::text || '-transcripts%')));