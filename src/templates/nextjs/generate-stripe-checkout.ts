import { stripe } from "@/lib/stripe/client";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";

export async function GET() {
  // TODO: 🔐 Replace with your own auth system
  // Example: const user = await getUserId();

  // Get the stripeCustomerId from your KV store
  let stripeCustomerId = await kv.get<string>(`stripe:user:${user.id}`);

  // Create a new Stripe customer if this user doesn't have one
  if (!stripeCustomerId) {
    const newCustomer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id, // DO NOT FORGET THIS
      },
    });

    // Store the relation between userId and stripeCustomerId in your KV
    await kv.set(`stripe:user:${user.id}`, newCustomer.id);
    stripeCustomerId = newCustomer.id;
  }

  // Create a checkout session
  const checkout = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription", // or "subscription" if you're selling recurring items
    line_items: [
      {
        price: process.env.PRICE_ID, // Replace with your actual price ID
        quantity: 1,
      },
    ],
    success_url: "{{DOMAIN}}/api/stripe/success",
    cancel_url: "{{DOMAIN}}/api/stripe/cancel",
  });

  if (!checkout.url) {
    redirect("/");
  }

  return redirect(checkout.url);
}
