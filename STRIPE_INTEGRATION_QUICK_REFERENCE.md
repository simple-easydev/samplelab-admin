# Stripe Integration Quick Reference

## 📁 Files Created

### Edge Functions
- `supabase/functions/get-stripe-products/index.ts` - Fetches products from Stripe
- `supabase/functions/create-checkout-session/index.ts` - Creates Stripe checkout sessions
- `supabase/functions/stripe-webhook/index.ts` - Handles Stripe webhooks

### Database Migration
- `supabase/migrations/20260225000001_add_stripe_fields.sql` - Adds Stripe fields to DB

### Documentation
- `STRIPE_WEBHOOK_SETUP.md` - Complete setup guide with examples

## 🚀 Deployment Commands

```bash
# 1. Apply database migration
supabase db push

# 2. Deploy edge functions
supabase functions deploy get-stripe-products
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook

# 3. Set environment secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🔑 Required Environment Variables

```bash
# Stripe (add these to your Supabase project secrets)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Supabase (should already be set)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🌐 Stripe Dashboard Setup

1. **Get Stripe Keys**: Dashboard → Developers → API keys
   - Copy "Secret key" → Set as `STRIPE_SECRET_KEY`

2. **Create Products/Prices**: Dashboard → Products → Add product
   - Create your subscription tiers (Starter, Pro, etc.)
   - Copy each Price ID (e.g., `price_1ABC123`)

3. **Configure Webhook**: Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events: 
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy "Signing secret" → Set as `STRIPE_WEBHOOK_SECRET`

## 💻 Frontend Integration
Fetch Available Products

```typescript
const { data, error } = await supabase.functions.invoke('get-stripe-products');

const products = data.products; // Array of products with prices
// Display on your pricing page
```

### 2. 
### 1. Create Checkout Session (Start Free Trial)

```typescript
const { data, error } = await supabase.functions.invoke('create-checkout-session', {
  body: {
    priceId: 'price_1ABC123',
    successUrl: `${window.location.origin}/subscription/success`,
    cancelUrl: `${window.location.origin}/subscription/cancel`,
    3rialDays: 3,
  },
});

if (data?.url) {
  window.location.href = data.url; // Redirect to Stripe Checkout
}
```

### 2. Check Subscription Status

```typescript
const { data: customer } = await supabase
  .from('customers')
  .select(`
    subscription_tier,
    subscriptions!inner(status, trial_end, current_period_end)
  `)
  .eq('user_id', userId)
  .eq('subscriptions.status', 'active')
  .maybeSingle();

const tier = customer?.subscription_tier || 'free';
```

### 4. Listen for Subscription Changes

```typescript
const channel = supabase
  .channel('subscription-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'subscriptions',
  }, () => {
    // Refetch subscription data
  })
  .subscribe();
```

## 🗄️ Database Schema

### Customers Table (New Fields)
- `stripe_customer_id` - Links to Stripe customer

### Subscriptions Table (New Fields)
- `stripe_subscription_id` - Links to Stripe subscription
- `stripe_price_id` - The price ID being charged
- `stripe_status` - Raw Stripe status
- `current_period_start` - Billing period start
- `current_period_end` - Billing period end
- `cancel_at_period_end` - Will cancel at period end?
- `trial_start` - Trial start date
- `trial_end` - Trial end date

## ⚙️ Price ID Mapping

Update `stripe-webhook/index.ts` function `mapStripePriceToTier()`:

```typescript
function mapStripePriceToTier(priceId: string | undefined): string {
  const priceMap: Record<string, string> = {
    "price_1ABC123": "starter",      // ← Your actual Stripe price IDs
    "price_2DEF456": "pro",
    "price_3GHI789": "enterprise",
  };
  return priceMap[priceId] || "free";
}
```

## 🔄 Complete Event Flow

```
1. Fetch Products
   Frontend → get-stripe-products → Returns products & prices
        ↓
2. User selects plan
   Frontend → create-checkout-session → Stripe Checkout
        ↓
3. Customer enters card
   Stripe Checkout (no charge for trial period)
        ↓
4. Checkout completed
   Stripe fires webhook → stripe-webhook function
        ↓
5. Webhook updates database
   Update subscriptions table in Supabase
        ↓
6. Frontend reflects changes
   Read subscription status from database
```

## 🧪 Testing

### Local Testing with Stripe CLI

```bash
# Forward webhooks to local function
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

### Test in Production

- Stripe Dashboard → Webhooks → Your endpoint → "Send test webhook"

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Signature verification failed | Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard |
| Customer not found | Ensure `stripe_customer_id` is stored after checkout |
| Get Products Guide: [GET_STRIPE_PRODUCTS_GUIDE.md](./GET_STRIPE_PRODUCTS_GUIDE.md)
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Stripe Products API: https://stripe.com/docs/api/productcrets list` to verify |
| Webhook not received | Check Stripe Dashboard → Webhooks → Attempts |

## 📚 Documentation Links

- Setup Guide: [STRIPE_WEBHOOK_SETUP.md](./STRIPE_WEBHOOK_SETUP.md)
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Supabase Functions: https://supabase.com/docs/guides/functions
