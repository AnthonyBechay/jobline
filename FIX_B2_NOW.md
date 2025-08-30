# 🚨 URGENT: Fix Backblaze B2 Configuration on Render

## The Problem
Your Backblaze credentials are incorrectly configured. The error "Malformed Access Key Id" with a 403 status indicates authentication failure.

## Immediate Fix Required

### Step 1: Get Your CORRECT Backblaze Credentials

1. **Login to Backblaze B2**
2. Go to **"App Keys"** section
3. Create a new Application Key (or use existing)
4. You should see:
   - **keyID**: Should look like `0026aeee819e83` (12-13 characters, starts with "00")
   - **applicationKey**: Should look like `K003c802de1edc88d4c4f76f7dfdf55ea95137ec46a` (31 characters, starts with "K00")

### Step 2: Update Render Environment Variables

Go to your Render Dashboard → Your Service → Environment

Update these EXACTLY (no quotes, no spaces):

```bash
B2_KEY_ID=0026aeee819e83
B2_APPLICATION_KEY=K003c802de1edc88d4c4f76f7dfdf55ea95137ec46a
B2_BUCKET_NAME=jobline
B2_BUCKET_ID=d2765acefe9ee8b1998e0813
B2_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
B2_REGION=eu-central-003
```

### ⚠️ CRITICAL POINTS:

1. **Key ID Format:**
   - Must be 12-13 characters
   - Should start with "00"
   - Your current key `26aeee819e83` is missing the "00" prefix
   - Correct format: `0026aeee819e83`

2. **Application Key Format:**
   - Must be 31 characters
   - Should start with "K00"
   - Example: `K003c802de1edc88d4c4f76f7dfdf55ea95137ec46a`

3. **Bucket Name:**
   - Your actual bucket is `jobline` NOT `jobline-files`
   - Make sure `B2_BUCKET_NAME=jobline`

### Step 3: Verify in Backblaze

1. Go to your Backblaze B2 dashboard
2. Check your bucket name - it should be `jobline`
3. Check bucket permissions - should allow your app key to:
   - List files
   - Read files
   - Write files
   - Delete files

### Step 4: Restart Render Service

After updating environment variables:
1. Go to Render Dashboard
2. Manual Deploy → "Deploy latest commit"
3. Or just restart the service

## What the Code Now Does

I've updated the code to:
1. **Auto-fix missing "00" prefix** on Key IDs
2. **Use correct bucket name** (`jobline` instead of `jobline-files`)
3. **Better error messages** to identify the exact issue
4. **Clean credentials** of any extra characters

## Testing After Fix

Once you update the credentials, the logs should show:
```
B2 Configuration Check: {
  keyIdLength: 12,
  keyIdPrefix: '0026',  // Should start with '00'
  keyIdSuffix: '83',
  hasAppKey: true,
  appKeyLength: 31,     // Should be 31
  endpoint: 'https://s3.eu-central-003.backblazeb2.com',
  bucket: 'jobline'     // Correct bucket name
}
```

## If Still Not Working

1. **Create NEW Application Key in Backblaze:**
   - Name: "jobline-render"
   - Type: "Master Application Key" or with full permissions
   - Bucket: Select "jobline" specifically

2. **Double-check in Render:**
   - NO quotes around values
   - NO spaces before or after values
   - Copy-paste directly from Backblaze

3. **Check Bucket Settings:**
   - Bucket Type: Private
   - Lifecycle Settings: Keep all versions
   - CORS Rules: Not needed for S3 API

## Contact Support If:
- Key ID doesn't start with "00" in Backblaze
- Application Key doesn't start with "K00"
- Bucket name is different than "jobline"

---

**Date:** August 30, 2025
**Priority:** CRITICAL - Uploads won't work until fixed
