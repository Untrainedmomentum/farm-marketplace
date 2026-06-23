# MY FARM EXPRESS — COMPLETE PROJECT HANDOFF

## PROJECT INFO
- App Name: My Farm Express
- Tagline: Fresh From The Farm
- Location: C:\Users\jenbr\farm-marketplace
- GitHub: https://github.com/Untrainedmomentum/farm-marketplace
- Supabase URL: (See .env.local or Vercel environment variables)
- Supabase Anon Key: (See .env.local or Vercel environment variables)

## STACK
- Next.js 16.2.9 (App Router, Turbopack)
- React 19
- Supabase (auth, database, storage)
- Stripe (payments - NOT YET INTEGRATED)
- Tailwind CSS v4
- TypeScript
- Hosted: GitHub Pages (planned)

## TO START DEV SERVER
Open PowerShell (NOT ISE - use regular PowerShell for npm):
  cd C:\Users\jenbr\farm-marketplace
  npm run dev
Then open http://localhost:3000

## IMPORTANT NOTES FOR CLAUDE
- Use PowerShell ISE for writing files
- Use regular PowerShell window for npm commands (npm blocks ISE)
- Always use [System.IO.File]::WriteAllText() with UTF8 encoding to write files
- Always use -LiteralPath when using Set-Content with paths containing brackets like [slug]
- Project is at C:\Users\jenbr\farm-marketplace (NOT Desktop)
- GitHub Desktop is installed and synced to github.com/Untrainedmomentum/farm-marketplace
- To push: git add . && git commit -m "message" && git push origin master
- If git push fails run: Remove-Item -Recurse -Force .git then reinit

## FILE STRUCTURE
farm-marketplace/
  app/
    page.tsx                    -- Home page
    layout.tsx                  -- Root layout with Header
    globals.css                 -- Farm theme CSS
    auth/
      login/page.tsx            -- Login page
      signup/page.tsx           -- Signup page
    marketplace/page.tsx        -- Browse all farms
    farm/[slug]/page.tsx        -- Individual farm storefront
    cart/page.tsx               -- Shopping cart
    dashboard/page.tsx          -- Farmer dashboard
  components/
    Header.tsx                  -- Barn logo header with nav
    AddToCartButton.tsx         -- Client component for adding to cart
  lib/
    supabase.ts                 -- Supabase client
    server.ts                   -- Supabase server client
  .env.local                    -- Environment variables

## SUPABASE TABLES
profiles:
  id (uuid, FK to auth.users)
  email (text)
  role (enum: farmer/customer)
  created_at

farms:
  id (uuid)
  owner_id (uuid, FK to profiles.id)
  name (text)
  slug (text, unique)
  logo_url (text)
  color_theme (text)
  cash_enabled (boolean)
  subscription_active (boolean)
  created_at

products:
  id (uuid)
  farm_id (uuid, FK to farms.id)
  name (text)
  price (numeric)
  description (text)
  quantity (integer)
  is_shippable (boolean)
  needs_cold_storage (boolean)
  active (boolean)
  created_at

cart_items:
  id (uuid)
  user_id (uuid)
  product_id (uuid)
  farm_id (uuid)
  quantity (integer)
  created_at

orders:
  id (uuid)
  buyer_id (uuid)
  total (numeric)
  platform_fee (numeric)
  status (enum)
  stripe_payment_intent_id (text)
  created_at

order_items:
  id (uuid)
  order_id (uuid)
  product_id (uuid)
  farm_id (uuid)
  quantity (integer)
  price (numeric)

subscriptions:
  id (uuid)
  user_id (uuid)
  type (text)
  status (enum)
  stripe_subscription_id (text)
  created_at

## SUPABASE RLS POLICIES ALREADY CREATED
- farms: "Anyone can read farms" FOR SELECT USING (true)
- farms: "Farmers can insert their own farm" FOR INSERT WITH CHECK (auth.uid() = owner_id)
- farms: "Farmers can read their own farm" FOR SELECT USING (auth.uid() = owner_id)
- products: "Anyone can read products" FOR SELECT USING (true)
- cart_items: "Users can manage their own cart" FOR ALL USING (auth.uid() = user_id)

## BUSINESS RULES (not yet implemented in code)
- Free farmers: max 5 products, $3 platform fee per order
- Paid farmers: $15/month subscription, unlimited products, cash payments enabled
- Platform fee: $3/order if farmer has no subscription, $0 if subscribed

## DESIGN THEME
- App Name: My Farm Express
- Style: Old farm country / rustic
- Colors:
  --barn-red: #8B1A1A (primary, header background)
  --cream: #FFFDF5 (page background)
  --wheat: #F5E6C8 (secondary background)
  --green: #5D8A3C (accent)
  --gold: #F0C040 (highlight)
  --brown: #8B6914 (tertiary)
- Font: Georgia, serif
- Header: Barn SVG logo + "My Farm Express" + "FRESH FROM THE FARM" tagline

## WHAT IS DONE
- Home page with welcome message and 3 CTA buttons
- Header with barn SVG, app name, nav links (Marketplace, Cart, Dashboard, Login)
- Auth: login and signup pages using Supabase email auth
  - Email confirmation is TURNED OFF in Supabase settings
- Farmer dashboard:
  - Shows create farm form if no farm exists
  - Auto-generates slug from farm name
  - Shows URL preview as farmer types
  - After farm created: shows add product form and product list
  - Logout button
- Farm storefront (/farm/[slug]):
  - Loads farm by slug from Supabase
  - Shows all active products
  - Add to Cart button on each product (client component)
  - params is awaited (Next.js 16 requirement)
- Marketplace (/marketplace):
  - Lists all farms as cards with hover effect
  - Links to each farm storefront
- Cart (/cart):
  - Loads cart items with product and farm details
  - Groups items by farm
  - +/- quantity buttons
  - Remove button
  - Shows total
  - "Proceed to Checkout" button (NOT YET WIRED TO STRIPE)
- AddToCartButton component:
  - Checks if user is logged in
  - If product already in cart, increments quantity
  - If not, inserts new cart item
  - Shows "Added to cart!" confirmation

## WHAT IS NOT DONE (TODO IN ORDER)
1. Stripe checkout integration
   - Cart -> Stripe Checkout Session -> Success page -> Order stored in Supabase
   - Need to add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local
   - Need Stripe webhook to confirm orders
2. Orders page (/orders) for buyers to see past orders
3. Farmer orders view in dashboard
4. Shopper profile page
   - Location/zip code
   - Preferred radius
   - Preferred farms
5. Product search and filters on marketplace
6. Image uploads for products and farm profiles
7. Subscription system for farmers ($15/month via Stripe)
8. Mobile responsive design
9. Login/logout toggle in header (currently always shows Login)
10. Duplicate product name validation
11. Product edit/delete in dashboard
12. Farm profile editing (colors, logo)

## TEST DATA
- Test farmer account: jen.brynelsen@gmail.com
- Test farm: "Test Farm" with slug "test-farm"
- Test product: "Milk" $2.29 qty:1 desc:"Per quart"
- Farm URL: http://localhost:3000/farm/test-farm

## KNOWN ISSUES
- When new farmer signs up they need a profile row inserted manually or via trigger
  Current workaround: manually insert into profiles table in Supabase SQL editor:
  INSERT INTO profiles (id, email, role)
  VALUES ('[user-uuid]', '[email]', 'farmer')
  ON CONFLICT (id) DO NOTHING;
- No Supabase trigger yet to auto-create profile on signup (should be added)
- Login button in header does not change to Logout when user is logged in