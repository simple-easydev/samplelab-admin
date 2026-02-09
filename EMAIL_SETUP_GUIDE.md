# Email Setup Guide for Admin Invites

This guide explains how to set up email sending for admin invitations.

## Overview

The invite system uses:
- **Supabase Edge Function**: `send-invite-email` - Handles email sending logic
- **Resend**: Email delivery service (free tier: 100 emails/day, 3,000/month)

## Setup Steps

### 1. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their testing domain for development)
3. Get your API key from the dashboard

### 2. Add Environment Variable to Supabase

#### Via Supabase Dashboard:
1. Go to your project at [supabase.com](https://supabase.com)
2. Navigate to **Project Settings** → **Edge Functions**
3. Under **Secrets**, add:
   - Key: `RESEND_API_KEY`
   - Value: Your Resend API key (starts with `re_`)

#### Via CLI:
```bash
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### 3. Update Email "From" Address

Edit `supabase/functions/send-invite-email/index.ts` line 45:

```typescript
from: "The Sample Lab <noreply@samplelab.com>", // Replace with your verified domain
```

Options:
- **Development**: Use `onboarding@resend.dev` (no verification needed)
- **Production**: Use your verified domain (e.g., `noreply@yourdomain.com`)

### 4. Deploy the Edge Function

```bash
# Deploy the function
npx supabase functions deploy send-invite-email

# Or deploy all functions
npx supabase functions deploy
```

### 5. Test the Email

1. Go to Admin & Roles page
2. Click "Invite Admin"
3. Fill in the form and submit
4. Check the invitee's email inbox

## Email Template Customization

The email template is in `supabase/functions/send-invite-email/index.ts` starting at line 47.

You can customize:
- **Subject line** (line 46)
- **HTML content** (lines 47-133)
- **Branding colors**
- **Logo** (add your logo URL)
- **Footer text**

## Resend Dashboard

Access your Resend dashboard to:
- View email delivery logs
- Monitor bounce/spam rates
- Manage domains
- Check API usage

## Alternative Email Services

If you prefer a different email service, you can modify the Edge Function to use:

### SendGrid
```typescript
import sgMail from "npm:@sendgrid/mail@7.7.0";
sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY")!);
await sgMail.send({ to: email, from: "...", subject: "...", html: "..." });
```

### AWS SES
```typescript
import { SESClient, SendEmailCommand } from "npm:@aws-sdk/client-ses@3";
const client = new SESClient({ region: "us-east-1" });
// Configure and send...
```

### Postmark
```typescript
import postmark from "npm:postmark@3.0.15";
const client = new postmark.ServerClient(Deno.env.get("POSTMARK_API_KEY")!);
await client.sendEmail({ From: "...", To: email, Subject: "...", HtmlBody: "..." });
```

## Troubleshooting

### Email not sending
1. Check Edge Function logs: `npx supabase functions logs send-invite-email`
2. Verify `RESEND_API_KEY` is set correctly
3. Check Resend dashboard for errors
4. Ensure "from" address is verified

### Email goes to spam
1. Verify your domain in Resend
2. Set up SPF, DKIM, and DMARC records
3. Use a professional email address (not noreply@gmail.com)

### Testing locally
```bash
# Start local development with Edge Functions
npx supabase functions serve send-invite-email --env-file ./supabase/.env.local

# Create .env.local file with:
RESEND_API_KEY=re_your_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Production Checklist

- [ ] Resend API key added to Supabase secrets
- [ ] Domain verified in Resend
- [ ] "From" email address updated
- [ ] Edge Function deployed
- [ ] Test email sent and received
- [ ] Email template reviewed and branded
- [ ] SPF/DKIM/DMARC records configured

## Cost

**Resend Pricing:**
- Free: 3,000 emails/month, 100/day
- Pro: $20/month for 50,000 emails
- Enterprise: Custom pricing

For most admin panels, the free tier is sufficient.

## Security Notes

- API keys are stored as Supabase secrets (not in code)
- Edge Function runs server-side (API key never exposed to client)
- CORS configured to only allow your domain
- Rate limiting handled by Supabase

## Support

- Resend Docs: https://resend.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
