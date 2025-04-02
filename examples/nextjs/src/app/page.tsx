import { getUserId } from "@/lib/stripe/getUserId";
import { kv } from "@vercel/kv";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">


      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">

        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2 tracking-[-.01em]">
            This is a working POC of <strong>Paykit</strong>, the all-in-one Stripe integration utility for Next.js.
          </li>
          <li className="mb-2 tracking-[-.01em]">
            To get started in your own project, run
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              npx paykit@latest
            </code>
          </li>
          <li className="mb-2 tracking-[-.01em]">
            The CLI will generate all the necessary API routes and Stripe integration logic automatically.
          </li>
          <li className="mb-2 tracking-[-.01em]">
            Add your <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">STRIPE_SECRET_KEY
            </code> key to your <code>.env</code> file

          </li>
          <li className="tracking-[-.01em]">
            Click below to simulate a Stripe subscription using the prebuilt integration.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="/api/generate-stripe-checkout"
            rel="noopener noreferrer"
          >
            Simulate Stripe subscription
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://github.com/argcast/paykit"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>

        <UserSubscriptionStatus />
        <footer className="flex w-full items-center justify-center h-12 border-t dark:border-neutral-800 text-sm text-gray-500 font-mono">
          <p>
            Built by{" "}
            <a
              href="https://github.com/argcast"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-black dark:hover:text-white"
            >
              @argcast
            </a>
          </p>
        </footer>

      </main>
    </div>
  );
}

async function UserSubscriptionStatus() {
  const user = await getUserId()
  const kvData = await kv.get(`stripe:user:${user.id}`)
  const userData = await kv.get(`stripe:customer:${kvData}`)

  return (
    <div className="px-2 text-xs font-mono flex gap-4 justify-between w-full">
      <div>
        <ol>
          <li className="font-bold">User Data</li>
          <li>name: {user.name}</li>
          <li>id: {user.id}</li>
        </ol>

      </div>
      <div>
        <ol>
          <li className="mt-2 font-bold">Stripe Data</li>
          <li>
            <p
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(userData, null, 2).replace(/,/g, ',<br />'),
              }}
            />
          </li>
        </ol>
      </div>
    </div>
  )
}
