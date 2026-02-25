# Stripe Integration Setup Guide

This guide covers the complete Stripe subscription integration with two edge functions:
1. **create-checkout-session** - Creates Stripe checkout sessions for customers
2. **stripe-webhook** - Handles Stripe webhook events to update subscription status

## 🚀 Quick Start

### 1. Run the Database Migration

First, apply the migration to add Stripe fields to your database:

```bash
supabase db push
```

Or manually run the migration:
```bash
psql -U postgres -d postgres -f supabase/migrations/20260225000001_add_stripe_fields.sql
```

### 2. Deploy the Edge Functions

Deploy both edge functions to Supabase:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### 3. Set Environment Variables

Make sure these environment variables are set in your Supabase project:

```bash
# Set locally for testing
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# These should already be set
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Configure Stripe Webhook

1. Go to your [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with `whsec_`)
7. Update your environment variable:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_new_secret
   ```

## 📊 Database Schema Changes

The migration adds these fields to your database:

### `customers` table:
- `stripe_customer_id` (TEXT, UNIQUE) - Links to Stripe customer

### `subscriptions` table:
- `stripe_subscription_id` (TEXT, UNIQUE) - Links to Stripe subscription
- `stripe_price_id` (TEXT) - The Stripe price ID
- `stripe_status` (TEXT) - Raw Stripe status
- `current_period_start` (TIMESTAMP) - Billing period start
- `current_period_end` (TIMESTAMP) - Billing period end
- `cancel_at_period_end` (BOOLEAN) - Whether subscription will cancel
- `trial_start` (TIMESTAMP) - Trial start date
- `trial_end` (TIMESTAMP) - Trial end date

## 🔄 Webhook Event Handlers

The function handles these Stripe events:

### `checkout.session.completed`
- Triggered when a customer completes checkout
- Creates a new subscription record in the database
- Links the subscription to the customer

### `customer.subscription.created` / `customer.subscription.updated`
- Triggered when a subscription is created or modified
- Updates subscription details in the database
- Updates customer's subscription tier

### `customer.subscription.deleted`
- Triggered when a subscription is canceled
- Marks subscription as "canceled"
- Reverts customer to "free" tier

### `invoice.payment_succeeded`
- Triggered when a payment succeeds
- Updates subscription status to "active"

### `invoice.payment_failed`
- Triggered when a payment fails
- Updates subscription status to "past_due"

## 🎯 Integration Flow

```
User clicks "Start Free Trial"
        ↓supabase.functions.invoke('create-checkout-session')
        ↓
Edge function creates/retrieves Stripe customer
        ↓
Edge function returns Checkout Session URL
        ↓
Redirect user to Stripe Checkout
        ↓
Customer enters card (no charge for trial period)
        ↓
Checkout completed
        ↓
Stripe fires checkout.session.completed webhook
        ↓
stripe-webhook function receives event
        ↓
Webhook creates/updates subscription in Supabase DB
        ↓
Your app reads subscription status from database
```

## 💻 Frontend Usage Example

### Starting a Free Trial

```typescript
import { supabase } from '@/lib/supabase';

async function startFreeTrial(priceId: string) {
  try {
    // Call the edge function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: 'price_1ABC123', // Your Stripe price ID
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`,
        trialDays: 3, // 3-day free trial
      },
    });

    if (error) throw error;

    // Redirect to Stripe Checkout
    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    alert('Failed to start free trial. Please try again.');
  }
}

// Usage in your component
<button onClick={() => startFreeTrial('price_1ABC123')}>
  Start Free Trial
</button>
```

### Checking Subscription Status

```typescript
import { supabase } from '@/lib/supabase';

async function getSubscriptionStatus() {
  try {
    // Get current user's customer record
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    // Get customer and their active subscription
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        *,
        subscriptions!inner(*)
      `)
      .eq('user_id', user.id)
      .eq('subscriptions.status', 'active')
      .maybeSingle();

    if (error) throw error;

    return {
      tier: customer?.subscription_tier || 'free',
      hasActiveSubscription: !!customer?.subscriptions?.length,
      subscription: customer?.subscriptions?.[0],
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { tier: 'free', hasActiveSubscription: false };
  }
}
```

### React Hook for Subscription

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Subscription {
  tier: string;
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();

    // Subscribe to subscription changes
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      const { data: customer } = await supabase
        .from('customers')
        .select(`
          subscription_tier,
          subscriptions!inner(
            status,
            trial_end,
            current_period_end
          )
        `)
        .eq('user_id', user.id)
        .in('subscriptions.status', ['active', 'trialing'])
        .maybeSingle();

      if (customer?.subscriptions?.[0]) {
        setSubscription({
          tier: customer.subscription_tier,
          ...customer.subscriptions[0],
        });
      } else {
        setSubscription({ tier: 'free', status: 'inactive', trial_end: null, current_period_end: null });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  return { subscription, loading, refetch: fetchSubscription };
}

// Usage in component
function SubscriptionStatus() {
  const { subscription, loading } = useSubscription();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Current Plan: {subscription?.tier || 'free'}</p>
      {subscription?.trial_end && (
        <p>Trial ends: {new Date(subscription.trial_end).toLocaleDateString()}</p>
      )}
    </div>
  );
}
Your app reads subscription status from database
```

## ⚙️ Configuration

### Update Price ID Mapping

In `index.ts`, update the `mapStripePriceToTier` function with your actual Stripe price IDs:

```typescript
function mapStripePriceToTier(priceId: string | undefined): string {
  if (!priceId) return "free";

  const priceMap: Record<string, string> = {
    "price_1ABC123": "starter",        // Your actual Stripe price ID
    "price_2DEF456": "pro",            // Your actual Stripe price ID
    "price_3GHI789": "enterprise",     // Your actual Stripe price ID
  };

  return priceMap[priceId] || "free";
}
```

## 🧪 Testing

### Test Locally

1. Use Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
   ```

2. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.created
   ```

### Test in Production

Use Stripe Dashboard → Webhooks → Your webhook → "Send test webhook"

## 🔒 Security

- ✅ Webhook signature verification using `STRIPE_WEBHOOK_SECRET`
- ✅ Uses Supabase service role key (bypasses RLS for webhook updates)
- ✅ CORS headers configured
- ✅ Validates all incoming events before processing

## 📝 Automatic Stripe Customer Creation

The `create-checkout-session` function automatically handles Stripe customer creation and linking:

```typescript
// The edge function does this automatically when you invoke it:
// 1. Checks if customer has stripe_customer_id
// 2. If not, creates new Stripe customer
// 3. Stores stripe_customer_id in customers table
// 4. Creates checkout session with that customer

// You just need to call:
await supabase.functions.invoke('create-checkout-session', {
  body: { priceId: 'price_1ABC123' }
});
```

No manual Stripe customer creation needed on your part!

## 🐛 Debugging

View webhook logs in:
1. Supabase Dashboard → Edge Functions → stripe-webhook → Logs
2. Stripe Dashboard → Webhooks → Your webhook → Events

Common issues:
- **Signature verification failed**: Check `STRIPE_WEBHOOK_SECRET` is correct
- **Customer not found**: Ensure `stripe_customer_id` is stored in customers table
- **Missing environment variables**: Verify all secrets are set in Supabase

## 📚 Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe API Reference](https://stripe.com/docs/api)
