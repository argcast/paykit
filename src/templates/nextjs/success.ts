import { syncStripeDataToKV } from "@/lib/stripe/syncStripeDataToKV";
import { tryCatch } from "@/lib/try-catch";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";

export async function GET() {
  // TODO: 🔐 Replace with your own auth system
  // Example: const user = await getUserId();
  const { data: stripeCustomerId } = await tryCatch(
    kv.get(`stripe:user:${user.id}`),
  );

  if (!stripeCustomerId) {
    return redirect("/");
  }

  await syncStripeDataToKV(stripeCustomerId as string);
  return redirect("/");
}
