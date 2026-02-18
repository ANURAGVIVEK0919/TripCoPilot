# Deploying AI Trip Planner to Vercel

## 🚀 Step-by-Step Deployment Guide

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- All API keys from your services (see below)

---

## Step 1: Push Your Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - AI Trip Planner"
   ```

2. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name it `ai-trip-planner` (or your preferred name)
   - Don't initialize with README (your project already has one)
   - Click "Create repository"

3. **Push your code:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ai-trip-planner.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Set Up Convex for Production

1. **Deploy Convex to production:**
   ```bash
   npx convex deploy
   ```

2. **This will create a production deployment and give you:**
   - Production deployment name (e.g., `prod:your-project-123`)
   - Production URL (e.g., `https://your-project-123.convex.cloud`)

3. **Save these values - you'll need them for Vercel environment variables**

---

## Step 3: Configure Clerk for Production

1. **Go to Clerk Dashboard:** https://dashboard.clerk.com
2. **Select your application**
3. **Update Allowed Origins:**
   - Go to "Settings" → "Domains"
   - Add your Vercel domain (e.g., `your-app.vercel.app`)
   - Also add `*.vercel.app` for preview deployments

4. **Get Production API Keys:**
   - Go to "API Keys"
   - Copy your production publishable key and secret key
   - Keep these ready for Vercel

---

## Step 4: Deploy to Vercel

### Method 1: Via Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel:** https://vercel.com/new

2. **Import Your GitHub Repository:**
   - Click "Add New..." → "Project"
   - Connect your GitHub account if not already connected
   - Select your `ai-trip-planner` repository
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: **Next.js** (should auto-detect)
   - Root Directory: `./` (leave as default)
   - Build Command: `next build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables:**
   Click "Environment Variables" and add ALL of these:

   ```
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_... (from Clerk production)
   CLERK_SECRET_KEY=sk_live_... (from Clerk production)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

   # Convex Backend
   CONVEX_DEPLOYMENT=prod:your-deployment-name (from Step 2)
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud (from Step 2)

   # UploadThing
   UPLOADTHING_SECRET=sk_live_... (your UploadThing secret)
   UPLOADTHING_APP_ID=dknd5kvkrb (your UploadThing app ID)

   # API Keys
   OLA_MAPS_API_KEY=your_ola_maps_key
   GROQ_API_KEY=gsk_... (your Groq API key)
   OPENWEATHER_API_KEY=your_openweather_key
   CURRENCY_API_KEY=your_currency_key
   ARCJET_KEY=ajkey_... (your Arcjet key)
   ```

   **Important:** 
   - Select "Production", "Preview", and "Development" for all variables
   - Double-check there are no extra spaces in the values

5. **Click "Deploy"**
   - Vercel will build and deploy your app
   - Wait 2-5 minutes for deployment to complete

---

## Step 5: Post-Deployment Configuration

### Update Clerk Production Domain

1. Go back to **Clerk Dashboard**
2. Navigate to "Settings" → "Domains"
3. Add your production Vercel URL:
   - `https://your-app-name.vercel.app`
4. Update "Home URL" to your Vercel domain

### Update UploadThing CORS Settings

1. Go to **UploadThing Dashboard:** https://uploadthing.com
2. Navigate to your app settings
3. Add your Vercel domain to allowed origins:
   - `https://your-app-name.vercel.app`
   - `https://*.vercel.app` (for preview deployments)

### Update Arcjet Configuration

1. Go to **Arcjet Dashboard:** https://app.arcjet.com
2. Add your Vercel domain to allowed origins if needed

---

## Step 6: Test Your Deployment

1. **Visit your deployed app:**
   - Vercel will provide a URL like `https://ai-trip-planner-xyz.vercel.app`

2. **Test core features:**
   - ✅ User sign-up/sign-in (Clerk)
   - ✅ Create a new trip
   - ✅ Upload images (UploadThing)
   - ✅ AI chat features (Groq)
   - ✅ Weather alerts
   - ✅ Community features
   - ✅ Local insider tips

3. **Check browser console for errors:**
   - Press F12 → Console tab
   - Look for any API or CORS errors

---

## Step 7: Set Up Custom Domain (Optional)

1. **In Vercel Dashboard:**
   - Go to your project → "Settings" → "Domains"
   - Click "Add Domain"
   - Enter your custom domain (e.g., `mytripplanner.com`)

2. **Update DNS Settings:**
   - Vercel will provide DNS records
   - Add them to your domain registrar

3. **Update Clerk & UploadThing:**
   - Add your custom domain to both services' allowed origins

---

## 🔧 Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Solution: Double-check all env vars in Vercel dashboard
- Make sure no typos in variable names

**Error: TypeScript compilation errors**
- Solution: Run `npm run build` locally first to catch errors
- Fix any TypeScript errors before deploying

### Runtime Errors

**Clerk Authentication not working**
- Verify production API keys are set
- Check Clerk dashboard has correct domain
- Ensure cookies are allowed in browser

**Convex queries failing**
- Verify `NEXT_PUBLIC_CONVEX_URL` is correct
- Check Convex deployment is in production mode
- Run `npx convex deploy` if needed

**Image uploads failing**
- Check UploadThing CORS settings
- Verify `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`
- Check UploadThing dashboard for errors

**API features not working**
- Verify all API keys are set correctly
- Check API quotas/limits haven't been exceeded
- Look in Vercel logs for specific errors

---

## 📊 Monitoring & Logs

### View Deployment Logs

1. Go to your project in Vercel
2. Click "Deployments"
3. Click on any deployment
4. View "Build Logs" and "Runtime Logs"

### Real-time Function Logs

1. In Vercel project dashboard
2. Click "Logs" tab
3. Monitor real-time serverless function execution

---

## 🔄 Continuous Deployment

Once set up, Vercel automatically deploys:

- **Push to `main` branch** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

---

## 💰 Cost Considerations

### Free Tier Limits (Vercel)
- 100 GB bandwidth/month
- Serverless function execution (100 GB-hours)
- Unlimited static deployments

### Monitor Usage:
- Vercel Dashboard → "Usage"
- Convex Dashboard → "Usage"
- Check each API service's usage dashboard

---

## ✅ Deployment Checklist

Before marking deployment as complete:

- [ ] Code pushed to GitHub
- [ ] Convex deployed to production (`npx convex deploy`)
- [ ] All environment variables added to Vercel
- [ ] Vercel deployment successful
- [ ] Clerk domains configured
- [ ] UploadThing CORS configured
- [ ] Test user sign-up/sign-in
- [ ] Test trip creation
- [ ] Test image uploads
- [ ] Test AI features
- [ ] Check browser console for errors
- [ ] Set up custom domain (if applicable)
- [ ] Monitor initial usage/errors

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Convex Deployment:** https://docs.convex.dev/production
- **Clerk Production:** https://clerk.com/docs/deployments/production

---

## 🎉 Success!

Your AI Trip Planner is now live! Share your deployment URL and start helping travelers plan amazing trips!
