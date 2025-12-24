# Vercel Payment Integration Setup Guide

## Overview
We've moved from Firebase Functions to Vercel API for faster payment debugging (10-30s vs 3-4min deployment time).

## Architecture
```
Frontend → Vercel API → Flitt Payment Gateway
```

## Files Created/Modified

### New Vercel API Endpoints
- `/api/payment/create.ts` - Creates Flitt payments
- `/api/payment/callback.ts` - Handles payment callbacks from Flitt

### Updated Frontend Files
- `src/services/paymentService.ts` - New service pointing to Vercel API
- `src/types/index.ts` - Updated payment request interface
- `src/pages/CheckoutPage.tsx` - Updated to use new payment service

## Deployment Steps

### 1. Environment Variables in Vercel
Go to: **Vercel Project Settings > Environment Variables**

Add these variables:
```
FLITT_MERCHANT_ID = 4055351
FLITT_SECRET_KEY = hP3gV40vV3yhKM2EUeRK1lOrEoTvvhwu
```

### 2. Update Flitt Merchant Portal
**CRITICAL**: Update callback URL in Flitt merchant dashboard:

```
Old: https://europe-west1-lifestore-5d2b7.cloudfunctions.net/paymentCallback
New: https://lifestore.ge/api/payment/callback
```

### 3. Deploy to Vercel
```bash
# Deploy the updated code
git add .
git commit -m "Move payment integration to Vercel API"
git push

# Or deploy directly with Vercel CLI
vercel --prod
```

## Testing

### Local Testing (Optional)
1. Install Vercel CLI: `npm i -g vercel`
2. Create `.env.local` with the environment variables
3. Run: `vercel dev`
4. Test on `http://localhost:3000`

### Production Testing
1. Deploy to Vercel
2. Set environment variables in Vercel dashboard
3. Update Flitt callback URL
4. Test payment flow on lifestore.ge

## Benefits of This Approach
- ✅ **10-30 second deployments** vs 3-4 minutes with Firebase
- ✅ **Real-time logs** in Vercel dashboard
- ✅ **Local development** with `vercel dev`
- ✅ **Easy environment management** with Vercel dashboard
- ✅ **Instant rollbacks** if needed

## Debug Information
Payment creation logs will now show in Vercel Functions dashboard with:
- 💰 Payment request details
- 🔐 Signature string and generation
- 🚀 Request sent to Flitt
- 📩 Response from Flitt

## Architecture Cleanup
- Firebase Functions now only handle payment callbacks (minimal code)
- All payment creation logic moved to Vercel for faster iteration
- Frontend seamlessly switched to new API endpoints