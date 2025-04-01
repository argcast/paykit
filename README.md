
# 💳 Paykit (WIP)

> A plug-and-play Stripe integration kit for modern JavaScript frameworks — starting with **Next.js**, and expanding to **Express**, **Astro**, and more.

## 🧠 Why this project exists

Stripe is powerful — but integrating it properly is often a painful mix of:
- ✅ boilerplate code
- ❓ unclear event flow
- 🤯 race conditions between webhooks and frontend state

We believe Stripe can feel simple, safe, and sane — if you abstract the hard parts correctly.

This project is **heavily inspired by [Theo’s blog post: "How I Stay Sane Implementing Stripe"](https://github.com/t3dotgg/stripe-sane-setup)**. His article lays out the clearest approach we’ve seen for managing the split-brain nature of Stripe data and your app state. **Paykit builds on that idea** to provide a fully installable, framework-ready implementation.

---

## 🚀 What Paykit does

- 🔒 Creates and syncs Stripe customers with your user IDs
- 💳 Handles checkout session creation with the proper customer binding
- 🔁 Provides a single `syncStripeDataToKV(customerId)` method to eliminate inconsistencies
- ⚡ Responds to relevant Stripe webhook events
- 🧱 Offers prebuilt route handlers and helpers tailored to each supported framework

---

## 📦 Supported Frameworks (Work in Progress)

| Framework     | Status      |
|---------------|-------------|
| Next.js       | ✅ In progress (MVP) |
| Express       | 🟡 Planned    |

---

## 🗺️ Project Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for upcoming integrations and contributions.

---

## 📜 Credits & License

This project is **inspired by** and **built on top of** the implementation described in Theo’s post  
➡️ [How I Stay Sane Implementing Stripe](https://github.com/t3dotgg/stripe-sane-setup)

We're not affiliated, but we found it too good not to build into a reusable package.

MIT Licensed.

