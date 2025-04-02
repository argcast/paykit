import { stripe } from "@/lib/stripe/client";
import { tryCatch } from "../try-catch"; // or import { kv } from "@vercel/kv";
import { kv } from "@vercel/kv";

export async function syncStripeDataToKV(customerId: string) {
  // Handling tryCatch with error
  // Check we have access to kv first of all

  const { data: subscriptions, error: subscriptionError } = await tryCatch(
    stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method"],
    }),
  );

  // Early catch to exit the code
  if (subscriptionError) {
    return { error: subscriptionError };
  }

  if (subscriptions.data.length === 0) {
    const subData = { status: "none" };
    await kv.set(`stripe:customer:${customerId}`, subData);
    return subData;
  }

  const subscription = subscriptions.data[0];

  const subData = {
    subscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0].price.id,
    currentPeriodEnd: subscription.current_period_end,
    currentPeriodStart: subscription.current_period_start,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    paymentMethod:
      subscription.default_payment_method &&
      typeof subscription.default_payment_method !== "string"
        ? {
            brand: subscription.default_payment_method.card?.brand ?? null,
            last4: subscription.default_payment_method.card?.last4 ?? null,
          }
        : null,
  };

  await kv.set(`stripe:customer:${customerId}`, subData);

  return subData;
}
