# 📦 Paykit – Next.js

This example showcases how to quickly integrate **Paykit** into a minimal expression of a [Next.js](https://nextjs.org/) app boostraped with `create-next-app`with a plug-and-play setup.

## How To Use

- Run `npx paykit-cli@latest` and follow the prompts to configure Stripe and your chosen authentication provider (optional).
- You can run `npx paykit-cli@latest --dry-run` to preview the files that will be created.

### What will happen:

- Stripe integration for subscriptions and one-time payments  
- ~~Preconfigured auth (Clerk, Supabase, or NextAuth)~~ *
- Secure and idempotent Stripe webhook handling  
- Ready-to-use API routes for customer creation, billing, and checkout  
- Type-safe and DX-focused structure using TypeScript  
- `@/*` alias support out of the box  
- Optional Upstash KV integration  
- Clear logs and helpful error messages  

> [!NOTE] 
> *This feature was originally implemented, but due to the wide variety of authentication edge cases, it became too limiting for the app. It has been removed for now and may be reintroduced in a more robust form in future releases.


You can see it live [here](https://paykit-nextjs.vercel.app/).
