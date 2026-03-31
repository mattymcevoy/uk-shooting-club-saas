# UK Shooting Club SaaS

A comprehensive, vibrant, and fully responsive management platform for UK shooting clubs. This Next.js application manages memberships, handles subscriptions via Stripe, and coordinates facility capacities and digital bookings.

## Features Built
- **Membership & Financials**: Recurring Stripe billing subscriptions, member tracking, invoice history, and an overarching Admin revenue dashboard.
- **Facility Bookings**: Self-service member booking portal mapped to dynamic facility capacities, member pricing rates, and time-slot scheduling.
- **Admin Security & RBAC**: Organization-scoped admin API authorization with role-gated access controls for sensitive operations.
- **Event Waitlist**: Automatic and manual waitlist support when events are full.
- **Operations Modules**: Recurring templates, scoring endpoints, coaching sessions, compliance documents, incidents, campaigns, and analytics overview APIs.
- **Data Protection & GDPR**: Privacy policy pages plus user export and privacy-request APIs for access/erasure workflows.
- **Premium Design**: Vanilla CSS utilizing deep emerald gradients, modern glassmorphism, and responsive interactivity.

## Deployment Instructions

### 1. Database Configuration
You will need a PostgreSQL database (e.g., Supabase, Vercel Postgres, Render, or local).
Ensure your deployment environment has the following variable set:
- `DATABASE_URL`: Connection string to your PostgreSQL instance.

### 2. Stripe Configuration
You must create a Stripe account and configure the following:
- **Products & Prices**: Set up your recurring membership tiers in Stripe.
- **Webhook Endpoint**: Register your deployment's webhook URL (e.g. `https://your-domain.com/api/webhooks/stripe`) in the Stripe Dashboard.
Set the resulting API keys in your environment variables:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: From Stripe API Keys.
- `STRIPE_SECRET_KEY`: From Stripe API Keys.
- `STRIPE_WEBHOOK_SECRET`: From the Webhook endpoint configuration.

### 3. Vercel Deployment
This project is configured for Vercel. 
1. Connect this Git repository to Vercel.
2. In the Vercel project settings, supply the environment variables listed above.
3. The `postinstall: prisma generate` hook is already configured in `package.json` to handle ORM generation during the Vercel Build Step.

### Local Development
To run the server locally:
```bash
# Provide dummy environment variables for setup testing
touch .env.local

# Run Prisma DB Push to align the database
npx prisma db push

# Run the dev server
npm run dev
```
