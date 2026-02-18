# Quick Deployment Reference

## 🚀 Deploy in 10 Minutes

### 1. Push to GitHub (2 min)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ai-trip-planner.git
git push -u origin main
```

### 2. Deploy Convex Production (1 min)
```bash
npx convex deploy
```
📝 **Save the production URL it gives you!**

### 3. Update Clerk (2 min)
- Go to: https://dashboard.clerk.com
- Settings → Domains → Add `*.vercel.app`
- Copy production API keys

### 4. Deploy on Vercel (3 min)
1. Go to: https://vercel.com/new
2. Import your GitHub repo
3. Add environment variables (see list below)
4. Click Deploy

### 5. Configure Services (2 min)
- **Clerk:** Add your Vercel URL to allowed domains
- **UploadThing:** Add your Vercel URL to CORS settings

---

## 📋 Environment Variables for Vercel

Copy these into Vercel's Environment Variables section:

### Required Variables:
```bash
# Clerk (from dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Convex (from npx convex deploy)
CONVEX_DEPLOYMENT=prod:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# UploadThing (from uploadthing.com)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your_app_id

# API Keys
OLA_MAPS_API_KEY=your_key
GROQ_API_KEY=gsk_...
OPENWEATHER_API_KEY=your_key
CURRENCY_API_KEY=your_key
ARCJET_KEY=ajkey_...
```

**Important:** Select ALL environments (Production, Preview, Development) for each variable!

---

## ⚠️ Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| Build fails | Check all env vars are set correctly |
| Clerk not working | Add Vercel domain to Clerk dashboard |
| Images won't upload | Add Vercel domain to UploadThing CORS |
| Convex errors | Ensure using production URL from `npx convex deploy` |

---

## ✅ Quick Test Checklist

After deployment, test these:
- [ ] Sign up/Sign in works
- [ ] Create a trip
- [ ] Upload an image
- [ ] AI chat responds
- [ ] Weather shows up
- [ ] Community features work

---

## 🔗 Useful Links

- Your Vercel Dashboard: https://vercel.com/dashboard
- Clerk Dashboard: https://dashboard.clerk.com
- Convex Dashboard: https://dashboard.convex.dev
- UploadThing: https://uploadthing.com/dashboard

---

## 📞 Getting Your Production URLs

After deploying, you'll get:
- **Vercel URL:** `https://your-app.vercel.app` (automatic)
- **Convex URL:** From `npx convex deploy` command
- **Clerk Keys:** From Clerk dashboard → API Keys (switch to production)

---

**Need detailed instructions?** See `VERCEL_DEPLOYMENT_GUIDE.md`
