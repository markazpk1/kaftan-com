# Supabase Storage Bucket Setup - Manual Steps

Since the SQL approach requires superuser permissions, follow these manual steps in your Supabase Dashboard:

## Step 1: Create the Storage Bucket
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on "Storage" in the left sidebar
4. Click "New Bucket" button
5. Enter bucket name: `media`
6. Check "Public bucket" checkbox
7. Click "Create bucket"

## Step 2: Set Bucket Policies (RLS)
1. Click on the "media" bucket you just created
2. Go to "Policies" tab
3. Click "New Policy"
4. Select "For SELECT" (allow public to view files)
5. Policy name: "Public Access"
6. Allowed operations: SELECT
7. Target: public
8. With CHECK expression: `true`
9. Click "Save Policy"

## Step 3: Allow Admin Uploads
1. Click "New Policy" again
2. Select "For INSERT" (allow uploads)
3. Policy name: "Admin Uploads"
4. Allowed operations: INSERT
5. Target: authenticated
6. With CHECK expression: `(select raw_user_meta_data->>'role' from auth.users where auth.users.id = auth.uid()) = 'admin'`
7. Click "Save Policy"

## Step 4: Allow Admin Deletes
1. Click "New Policy" again
2. Select "For DELETE" (allow deletions)
3. Policy name: "Admin Deletes"
4. Allowed operations: DELETE
5. Target: authenticated
6. With CHECK expression: `(select raw_user_meta_data->>'role' from auth.users where auth.users.id = auth.uid()) = 'admin'`
7. Click "Save Policy"

## Step 5: Configure File Limits (Optional)
1. Go to bucket settings
2. Set "Max file size" to 10MB (10485760 bytes)
3. Set "Allowed MIME types" to: image/png, image/jpeg, image/jpg, image/gif, image/webp, image/svg+xml

## Verification
After completing these steps, try cropping and saving an image in the Media Library. It should work without the "Bucket not found" error.

## Alternative: Simple SQL for Admin Users
If you have admin access to Supabase, you can also try this simplified SQL:

```sql
-- Create bucket (requires storage admin permissions)
SELECT storage.create_bucket('media', 'media', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);
```

Or ask your database admin to run the storage_setup.sql file for you.
