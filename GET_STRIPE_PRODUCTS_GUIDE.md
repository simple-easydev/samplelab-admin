# Get Stripe Products Edge Function

## 📋 Overview

This edge function fetches active products and their prices from your Stripe Dashboard using the Stripe API. Perfect for displaying subscription plans on your pricing page.

## 🚀 Deployment

```bash
supabase functions deploy get-stripe-products
--no-verify-jwt
```

## 🔑 Required Environment Variables

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

## 📡 API Usage

### Endpoint
```
GET https://your-project.supabase.co/functions/v1/get-stripe-products
```

### Frontend Example

```typescript
import { supabase } from '@/lib/supabase';

async function fetchProducts() {
  const { data, error } = await supabase.functions.invoke('get-stripe-products');
  
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return data.products;
}
```

### Response Format

```json
{
  "success": true,
  "count": 3,
  "products": [
    {
      "id": "prod_ABC123",
      "name": "Starter Plan",
      "description": "Perfect for individuals",
      "images": ["https://..."],
      "metadata": {
        "order": "1",
        "features": "10 downloads per month"
      },
      "prices": [
        {
          "id": "price_1ABC123",
          "currency": "usd",
          "unit_amount": 999,
          "recurring": {
            "interval": "month",
            "interval_count": 1
          },
          "type": "recurring"
        },
        {
          "id": "price_2DEF456",
          "currency": "usd",
          "unit_amount": 9990,
          "recurring": {
            "interval": "year",
            "interval_count": 1
          },
          "type": "recurring"
        }
      ]
    }
  ]
}
```

## 💻 React Component Example

### Simple Pricing Display

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Price {
  id: string;
  currency: string;
  unit_amount: number;
  recurring: {
    interval: string;
    interval_count: number;
  } | null;
  type: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  metadata: Record<string, string>;
  prices: Price[];
}

export function PricingPlans() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase.functions.invoke('get-stripe-products');
      
      if (error) throw error;
      
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatPrice(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  if (loading) return <div>Loading plans...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map((product) => (
        <div key={product.id} className="border rounded-lg p-6">
          <h3 className="text-2xl font-bold">{product.name}</h3>
          <p className="text-gray-600 mt-2">{product.description}</p>
          
          <div className="mt-4 space-y-2">
            {product.prices.map((price) => (
              <div key={price.id} className="flex justify-between items-center">
                <span className="text-3xl font-bold">
                  {formatPrice(price.unit_amount, price.currency)}
                </span>
                {price.recurring && (
                  <span className="text-gray-500">
                    / {price.recurring.interval}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={() => handleSubscribe(product.prices[0].id)}
            className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Start Free Trial
          </button>
        </div>
      ))}
    </div>
  );
}

async function handleSubscribe(priceId: string) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId,
      successUrl: `${window.location.origin}/subscription/success`,
      cancelUrl: `${window.location.origin}/pricing`,
      trialDays: 3,
    },
  });
  
  if (data?.url) {
    window.location.href = data.url;
  }
}
```

### Advanced Pricing with Billing Toggle

```typescript
import { useState } from 'react';

export function PricingTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  // Fetch products on mount...

  function getPrice(product: Product, interval: string) {
    return product.prices.find(
      (price) => price.recurring?.interval === interval
    );
  }

  return (
    <div>
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-4 py-2 rounded ${
              billingInterval === 'month' 
                ? 'bg-white shadow' 
                : 'text-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-4 py-2 rounded ${
              billingInterval === 'year' 
                ? 'bg-white shadow' 
                : 'text-gray-600'
            }`}
          >
            Yearly <span className="text-green-600">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-3 gap-6">
        {products.map((product) => {
          const price = getPrice(product, billingInterval);
          if (!price) return null;

          return (
            <div key={product.id} className="border rounded-lg p-6">
              <h3 className="text-xl font-bold">{product.name}</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${(price.unit_amount / 100).toFixed(0)}
                </span>
                <span className="text-gray-500">/{billingInterval}</span>
              </div>
              <button className="w-full mt-6 btn-primary">
                Get Started
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## 🎨 Stripe Dashboard Setup

### 1. Create Products

In your Stripe Dashboard:
1. Go to **Products** → **Add product**
2. Fill in product details:
   - **Name**: "Starter Plan"
   - **Description**: "Perfect for individuals"
   - **Image**: Upload product image (optional)

### 2. Add Prices

For each product, add prices:
1. **Monthly Price**: $9.99/month → Price ID: `price_1ABC123`
2. **Annual Price**: $99.90/year → Price ID: `price_2DEF456`

### 3. Add Metadata (Optional)

Add metadata to control display order:
1. Click product → **More** → **Metadata**
2. Add key `order` with value `1`, `2`, `3`, etc.
3. Add key `features` with value like "10 downloads, 5GB storage"

### 4. Product Sorting

Products are sorted by:
1. `metadata.order` (if exists)
2. Product name (alphabetically)

## ⚡ Features

- ✅ Fetches only active products
- ✅ Includes all active prices per product
- ✅ Supports monthly and annual pricing
- ✅ Sorts by custom order (metadata.order)
- ✅ Returns formatted data ready for frontend
- ✅ CORS enabled for browser requests
- ✅ No authentication required (public data)

## 🔒 Security Note

This endpoint is public (no authentication required) because it only returns product catalog information that you'd display on your pricing page anyway. Actual checkout and payment still require authentication via the `create-checkout-session` function.

## 🐛 Testing

```bash
# Test the function locally
curl http://localhost:54321/functions/v1/get-stripe-products

# Test in production
curl https://your-project.supabase.co/functions/v1/get-stripe-products
```

## 📊 Caching Strategy

For better performance, consider caching the products on the frontend:

```typescript
import useSWR from 'swr';

const fetcher = async () => {
  const { data, error } = await supabase.functions.invoke('get-stripe-products');
  if (error) throw error;
  return data.products;
};

export function useStripeProducts() {
  const { data, error, isLoading } = useSWR('stripe-products', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 3600000, // Refresh every hour
  });

  return {
    products: data || [],
    isLoading,
    error,
  };
}
```

## 🔗 Integration with Create Checkout Session

```typescript
// 1. Fetch products
const { data } = await supabase.functions.invoke('get-stripe-products');
const products = data.products;

// 2. User selects a plan and clicks "Subscribe"
const selectedPrice = products[0].prices[0]; // Monthly price

// 3. Create checkout session
const { data: session } = await supabase.functions.invoke('create-checkout-session', {
  body: {
    priceId: selectedPrice.id, // Use the price ID from get-stripe-products
    trialDays: 3,
  },
});

// 4. Redirect to Stripe Checkout
window.location.href = session.url;
```

## 🎯 Common Use Cases

1. **Pricing Page**: Display all available plans
2. **Plan Comparison**: Show features side-by-side
3. **Plan Selector**: Let users choose monthly vs annual
4. **Upgrade/Downgrade**: Show available plans to existing customers
5. **Admin Dashboard**: Display product catalog for management

## 📝 Notes

- Products must be marked as **Active** in Stripe Dashboard to appear
- Prices must also be marked as **Active**
- The function returns products in the order specified by `metadata.order`
- If no order is specified, products are sorted alphabetically by name
