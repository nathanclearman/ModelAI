# Cloudflare R2 Troubleshooting Guide

## Quick Diagnostic

Visit this endpoint (while logged in) to test your R2 configuration:
```
GET /api/debug/r2
```

This will show you:
- Whether R2 credentials are configured
- Which credentials are missing
- Connection test results
- Specific error messages

## Common Issues & Solutions

### Issue 1: "R2 credentials not configured"

**Symptoms:**
- Error message says credentials are missing
- Images/media fall back to local storage

**Solution:**
1. Check that ALL these environment variables are set:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

2. Make sure there are no extra spaces or quotes:
   ```bash
   # ❌ WRONG
   R2_ACCOUNT_ID=" abc123 "
   R2_ACCOUNT_ID='abc123'
   
   # ✅ CORRECT
   R2_ACCOUNT_ID=abc123
   ```

3. Restart your server after setting environment variables

### Issue 2: "Access Denied" or "Forbidden" Errors

**Symptoms:**
- R2 initializes but uploads fail
- Error code: `AccessDenied` or `403`

**Solution:**
1. **Check API Token Permissions:**
   - Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
   - Your token needs **Object Read & Write** permissions
   - Make sure the token is for the correct account

2. **Verify Bucket Name:**
   - The bucket name must match exactly (case-sensitive)
   - Check in Cloudflare Dashboard → R2 → Your bucket name

3. **Check Account ID:**
   - Find your Account ID in the R2 dashboard URL or sidebar
   - It should be a 32-character hex string
   - Make sure it matches exactly

### Issue 3: Images Upload But Don't Display

**Symptoms:**
- Upload succeeds but images return 404
- Images show broken image icon

**Solution:**
1. **Enable Public Access:**
   - Go to Cloudflare Dashboard → R2 → Your bucket
   - Click **Settings** → **Public Access**
   - Enable **Allow Access** or set up a custom domain

2. **Set R2_PUBLIC_DOMAIN:**
   - If you have a custom domain: `R2_PUBLIC_DOMAIN=images.yourdomain.com`
   - If using R2 public URL: Make sure bucket is public
   - The default URL format is: `https://<account-id>.r2.dev/<bucket-name>`

3. **Check Public URL Format:**
   - Custom domain: `https://images.yourdomain.com/images/...`
   - R2 public: `https://<account-id>.r2.dev/<bucket-name>/images/...`
   - Make sure the URL matches your bucket's public access settings

### Issue 4: "Bucket Not Found" Error

**Symptoms:**
- Error: `NoSuchBucket` or `404`
- Connection works but bucket doesn't exist

**Solution:**
1. **Verify Bucket Exists:**
   - Go to Cloudflare Dashboard → R2
   - Make sure the bucket name in `R2_BUCKET_NAME` matches exactly
   - Bucket names are case-sensitive

2. **Check Account ID:**
   - Make sure `R2_ACCOUNT_ID` is correct
   - Wrong account ID = bucket won't be found

### Issue 5: "Invalid Credentials" Error

**Symptoms:**
- Error: `InvalidAccessKeyId` or `SignatureDoesNotMatch`
- Authentication fails

**Solution:**
1. **Regenerate API Token:**
   - Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
   - Delete old token
   - Create new token with **Object Read & Write** permissions
   - Copy the new Access Key ID and Secret Access Key

2. **Check for Typos:**
   - Access Key ID should be ~20 characters
   - Secret Access Key should be ~40 characters
   - Make sure you copied the full values

3. **Verify Token is Active:**
   - Check token status in Cloudflare dashboard
   - Make sure it hasn't been revoked

### Issue 6: Connection Timeout

**Symptoms:**
- Requests hang or timeout
- Network errors

**Solution:**
1. **Check Endpoint URL:**
   - Should be: `https://<account-id>.r2.cloudflarestorage.com`
   - Make sure `R2_ACCOUNT_ID` is correct

2. **Check Network/Firewall:**
   - Make sure your server can reach Cloudflare
   - Check if firewall is blocking outbound HTTPS

3. **Verify Account ID Format:**
   - Should be 32-character hex string
   - No dashes or special characters

## Step-by-Step Setup Verification

### Step 1: Get Your Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** → **Manage R2 API Tokens**
3. Click **Create API Token**
4. Set permissions: **Object Read & Write**
5. Copy:
   - **Account ID** (from dashboard URL or sidebar)
   - **Access Key ID** (from token creation)
   - **Secret Access Key** (copy immediately, can't view later!)

### Step 2: Create/Verify Bucket

1. Go to **R2** → **Buckets**
2. Create a bucket or note existing bucket name
3. Go to bucket **Settings** → **Public Access**
4. Either:
   - Enable **Allow Access** (for public bucket)
   - Or set up a custom domain (recommended)

### Step 3: Set Environment Variables

```bash
R2_ACCOUNT_ID=your-32-char-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name

# Optional: Custom domain for public access
R2_PUBLIC_DOMAIN=images.yourdomain.com
```

### Step 4: Test Connection

1. Start your server
2. Check server logs for:
   ```
   [ImageStore] ✅ R2 initialized successfully
   [ImageStore] Bucket: your-bucket-name
   [ImageStore] Public URL: https://...
   ```

3. Visit `/api/debug/r2` (while logged in) to test connection

### Step 5: Test Upload

1. Try uploading an image through your app
2. Check server logs for:
   ```
   [ImageStore] Successfully uploaded to R2: images/...
   ```

3. If error occurs, check the error message in logs

## Environment Variable Checklist

- [ ] `R2_ACCOUNT_ID` - 32-character hex string
- [ ] `R2_ACCESS_KEY_ID` - ~20 characters
- [ ] `R2_SECRET_ACCESS_KEY` - ~40 characters
- [ ] `R2_BUCKET_NAME` - Exact bucket name (case-sensitive)
- [ ] `R2_PUBLIC_DOMAIN` - Optional, but recommended

## Debugging Tips

1. **Check Server Logs:**
   - Look for `[ImageStore]` or `[MediaStore]` messages
   - Errors will show specific failure points

2. **Use Diagnostic Endpoint:**
   - Visit `/api/debug/r2` to see detailed diagnostics
   - Shows which credentials are set/missing
   - Tests actual connection to R2

3. **Test with AWS CLI (if installed):**
   ```bash
   aws s3 ls s3://your-bucket-name \
     --endpoint-url https://<account-id>.r2.cloudflarestorage.com \
     --profile r2
   ```

4. **Verify in Cloudflare Dashboard:**
   - Check bucket exists
   - Check public access settings
   - Verify API token permissions

## Still Not Working?

1. **Check the diagnostic endpoint:** `/api/debug/r2`
2. **Review server logs** for specific error messages
3. **Verify all environment variables** are set correctly
4. **Test with a new API token** (regenerate in Cloudflare)
5. **Check Cloudflare status** (rare, but possible)

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `R2_ACCOUNT_ID is missing` | Environment variable not set | Set `R2_ACCOUNT_ID` |
| `AccessDenied` | Token lacks permissions | Regenerate token with Object Read & Write |
| `NoSuchBucket` | Bucket doesn't exist | Verify bucket name matches exactly |
| `InvalidAccessKeyId` | Wrong credentials | Regenerate API token |
| `403 Forbidden` | Public access disabled | Enable public access or use custom domain |
| `Connection timeout` | Network issue | Check endpoint URL and network |

