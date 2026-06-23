# Deployment Guide

## ⚠️ URGENT: Rotate Your Exposed Credentials

Your API keys were exposed in HANDOFF.md (now fixed). **You must rotate these immediately:**

1. **Stripe**: Go to https://dashboard.stripe.com/apikeys and regenerate your API keys
2. **Supabase**: Go to https://app.supabase.com → Project Settings → API → Regenerate Keys

Then use the new keys in Vercel environment variables (never commit them).

## Step-by-Step Deployment

### 1. Create Vercel Account & Project
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel
```

### 2. Set Environment Variables in Vercel Dashboard
After initial deploy, go to:
**Vercel Dashboard → Project Settings → Environment Variables**

Add these (use your NEW rotated keys):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY (use sk_live_xxxx for production)
STRIPE_WEBHOOK_SECRET
```

### 3. Update Stripe Webhook Endpoint
- Go to https://dashboard.stripe.com/webhooks
- Update webhook URL to: `https://your-vercel-domain.vercel.app/api/webhooks/stripe`
- Update the webhook secret in Vercel env variables

### 4. Test Production Build Locally
```bash
npm run build
npm run start
# Open http://localhost:3000 and test checkout flow
```

### 5. Deploy to Production
```bash
vercel --prod
```

## Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Build succeeds without errors
- [ ] Stripe test charge works end-to-end
- [ ] Webhooks are configured correctly
- [ ] Git history cleaned (remove old keys)
- [ ] Custom domain configured (optional)

## Monitoring & Logging

Consider adding:
- **Sentry** for error tracking: `npm install @sentry/nextjs`
- **Vercel Analytics** for performance monitoring
- **Stripe Dashboard** for transaction monitoring

## Rollback Plan

If issues occur, Vercel keeps deployment history:
```bash
vercel --prod  # View recent deployments
vercel rollback  # Rollback to previous version
```
