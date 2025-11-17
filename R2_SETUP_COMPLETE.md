# Cloudflare R2 Setup - Your Configuration

## ✅ Credentials Configured

Your R2 credentials have been added to `start-local.ps1`:

- **Account ID**: `ba4351dab80e771fd255ee03454a83a2`
- **Access Key ID**: `38dbfb4b8848ae2aed739214d63fe303`
- **Secret Access Key**: `8776e0e44fe716951bb0ac45350a0776223caf1f3ef153527ae36ea915b4a59a`
- **Bucket Name**: `modelai-images` (default - change if different)

## ⚠️ Important: Verify Your Bucket Name

The script uses `modelai-images` as the bucket name. **You need to verify this matches your actual bucket name in Cloudflare R2.**

### To Check/Set Your Bucket Name:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2**
2. Check your bucket name (or create one if you haven't)
3. If it's different from `modelai-images`, update `R2_BUCKET_NAME` in `start-local.ps1`

## 🔧 Next Steps

### 1. Create/Verify R2 Bucket

1. Go to Cloudflare Dashboard → **R2** → **Buckets**
2. If no bucket exists, click **Create bucket**
3. Name it (e.g., `modelai-images`)
4. Note the exact name (case-sensitive!)

### 2. Enable Public Access (Required for Images to Display)

**Option A: Enable Public Access on Bucket**
1. Go to your bucket → **Settings** → **Public Access**
2. Enable **Allow Access**
3. This allows public URLs like: `https://<account-id>.r2.dev/<bucket-name>/...`

**Option B: Use Custom Domain (Recommended)**
1. Go to bucket → **Settings** → **Public Access** → **Custom Domain**
2. Add custom domain: `images.modelai.info`
3. Add DNS CNAME record in Cloudflare:
   - **Name**: `images`
   - **Target**: (provided by Cloudflare)
4. Uncomment and set in `start-local.ps1`:
   ```powershell
   $env:R2_PUBLIC_DOMAIN = "images.modelai.info"
   ```

### 3. Test the Connection

1. Start your server:
   ```powershell
   .\start-local.ps1
   ```

2. Look for these log messages:
   ```
   [ImageStore] ✅ R2 initialized successfully
   [ImageStore] Bucket: modelai-images
   [ImageStore] Public URL: https://...
   ```

3. Test the diagnostic endpoint (while logged in):
   ```
   http://localhost:5000/api/debug/r2
   ```

4. Try uploading an image to test the full flow

## 📋 For Production Deployment

When deploying to production (Railway, Render, etc.), add these environment variables:

```bash
R2_ACCOUNT_ID=ba4351dab80e771fd255ee03454a83a2
R2_ACCESS_KEY_ID=38dbfb4b8848ae2aed739214d63fe303
R2_SECRET_ACCESS_KEY=8776e0e44fe716951bb0ac45350a0776223caf1f3ef153527ae36ea915b4a59a
R2_BUCKET_NAME=modelai-images
R2_PUBLIC_DOMAIN=images.modelai.info  # If using custom domain
```

## 🐛 Troubleshooting

### If R2 doesn't initialize:

1. **Check bucket name matches exactly** (case-sensitive)
2. **Verify API token permissions** - needs "Object Read & Write"
3. **Check server logs** for specific error messages
4. **Use diagnostic endpoint**: `/api/debug/r2`

### If images upload but don't display:

1. **Enable public access** on the bucket, OR
2. **Set up custom domain** and configure `R2_PUBLIC_DOMAIN`

### Common Errors:

- `NoSuchBucket` → Bucket name is wrong
- `AccessDenied` → API token lacks permissions
- `403 Forbidden` → Public access not enabled

## 🔒 Security Note

⚠️ **Important**: The credentials in `start-local.ps1` are for local development only.

For production:
- Never commit credentials to Git
- Use environment variables in your hosting platform
- Consider rotating API tokens regularly

