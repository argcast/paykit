#!/usr/bin/env node

import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import { execSync } from "child_process";

const isDryRun = process.argv.includes("--dry-run");
const isHelp = process.argv.includes("--help") || process.argv.includes("-h");

if (isHelp) {
  console.log(`
Paykit CLI - Setup Stripe + Upstash KV integration

Usage:
  npx paykit-cli         Run interactive setup
  npx paykit-cli --dry-run  Preview file generation without writing

Options:
  --dry-run     Show what would be done without writing files
  --help, -h    Show help menu
`);
  process.exit(0);
}
async function main() {
  console.log(
    `🛠️  Welcome to the Paykit Setup CLI${isDryRun ? " (dry run)" : ""}`,
  );
  // Language check
  const { language } = await inquirer.prompt([
    {
      type: "list",
      name: "language",
      message: "Are you using TypeScript or JavaScript?",
      choices: ["TypeScript", "JavaScript"],
    },
  ]);

  if (language === "JavaScript") {
    console.log("🤨 Wrong answer. You should only use Typescript.");
    // Continue execution anyway
  }
  const { provider } = await inquirer.prompt([
    {
      type: "list",
      name: "provider",
      message: "Which payment provider do you want to integrate?",
      choices: ["Stripe"],
    },
  ]);

  const pkgPath = path.join(process.cwd(), "package.json");
  let framework: string | null = null;

  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps["next"]) framework = "Next.js";
    else if (deps["express"]) framework = "Express";
  }

  if (!framework) {
    const { selected } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message: "No framework detected. Please select one:",
        choices: ["Next.js", "Express", "Other"],
      },
    ]);
    framework = selected;
  }

  const { confirmFramework } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmFramework",
      message: `Detected framework: ${framework}. Is this correct?`,
    },
  ]);

  if (!confirmFramework) {
    console.log(
      "❌ Exiting setup. Please rerun and choose the correct framework.",
    );
    process.exit(1);
  }

  const { isLocal } = await inquirer.prompt([
    {
      type: "confirm",
      name: "isLocal",
      message: "Is this app running locally (http://localhost:3000)?",
    },
  ]);

  let domain = "http://localhost:3000";
  if (!isLocal) {
    const { customDomain } = await inquirer.prompt([
      {
        type: "input",
        name: "customDomain",
        message: "Enter your production domain (e.g., https://myapp.com):",
        validate: (input) => input.startsWith("http") || "Must be a valid URL",
      },
    ]);
    domain = customDomain;
  }

  const { installDeps } = await inquirer.prompt([
    {
      type: "confirm",
      name: "installDeps",
      message: "Do you want to install Stripe and @vercel/kv dependencies now?",
      default: true,
    },
  ]);

  if (installDeps && !isDryRun) {
    console.log("📦 Installing dependencies: stripe, @vercel/kv...");
    const packageManager = detectPackageManager();
    execSync(`${packageManager} add stripe @vercel/kv`, { stdio: "inherit" });
  } else if (!installDeps) {
    console.log("⚠️ Skipped dependency installation.");
  }

  const frameworkKey = normalizeFrameworkKey(framework!);
  const templateRoot = path.join(__dirname, "..", "templates", frameworkKey);

  const checkoutTemplate = path.join(
    templateRoot,
    "generate-stripe-checkout.ts",
  );
  const checkoutTarget = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "generate-stripe-checkout",
    "route.ts",
  );
  copyAndReplaceDomain(checkoutTemplate, checkoutTarget, domain);

  const libBase = path.join(process.cwd(), "lib");
  const filesToCopy = [
    {
      from: path.join(templateRoot, "try-catch.ts"),
      to: path.join(libBase, "try-catch.ts"),
    },
    {
      from: path.join(templateRoot, "client.ts"),
      to: path.join(libBase, "stripe", "client.ts"),
    },
    {
      from: path.join(templateRoot, "syncStripeDataToKV.ts"),
      to: path.join(libBase, "stripe", "syncStripeDataToKV.ts"),
    },
  ];
  for (const { from, to } of filesToCopy) {
    copyFile(from, to);
  }

  const successRoute = path.join(templateRoot, "success.ts");
  const cancelRoute = path.join(templateRoot, "cancel.ts");
  const webhookRoute = path.join(templateRoot, "stripe-webhook.ts");

  const successTarget = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "stripe",
    "success",
    "route.ts",
  );
  const cancelTarget = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "stripe",
    "cancel",
    "route.ts",
  );
  const webhookTarget = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "stripe",
    "route.ts",
  );

  copyFile(successRoute, successTarget);
  copyFile(cancelRoute, cancelTarget);
  copyFile(webhookRoute, webhookTarget);

  // Auth detection
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  let detectedAuth: "clerk" | "supabase" | "nextauth" | null = null;

  if (allDeps["@clerk/nextjs"]) detectedAuth = "clerk";
  else if (allDeps["@supabase/auth-helpers-nextjs"]) detectedAuth = "supabase";
  else if (allDeps["next-auth"]) detectedAuth = "nextauth";

  if (!detectedAuth) {
    const { selectedAuth } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedAuth",
        message: "Which auth provider are you using?",
        choices: [
          { name: "Clerk", value: "clerk" },
          { name: "Supabase", value: "supabase" },
          { name: "NextAuth (Auth.js)", value: "nextauth" },
          { name: "None / I will do it manually", value: "none" },
        ],
      },
    ]);
    if (selectedAuth !== "none") {
      detectedAuth = selectedAuth;
    }
  }

  if (detectedAuth) {
    injectAuthLogic(successTarget, detectedAuth);
    injectAuthLogic(checkoutTarget, detectedAuth);
  }

  updateEnvFile();

  console.log("✅ Stripe integration setup complete!");
}

function copyFile(from: string, to: string) {
  if (!fs.existsSync(from)) {
    console.error(`❌ Template not found: ${from}`);
    return;
  }

  const dir = path.dirname(to);
  if (!fs.existsSync(dir) && !isDryRun) fs.mkdirSync(dir, { recursive: true });

  const content = fs.readFileSync(from, "utf-8");
  if (isDryRun) {
    console.log(`🧪 Would write to ${to}:\n\n${content}\n`);
  } else {
    fs.writeFileSync(to, content, "utf-8");
    console.log(`✅ Created: ${path.relative(process.cwd(), to)}`);
  }
}

function copyAndReplaceDomain(from: string, to: string, domain: string) {
  if (!fs.existsSync(from)) {
    console.error(`❌ Template not found: ${from}`);
    return;
  }

  const dir = path.dirname(to);
  if (!fs.existsSync(dir) && !isDryRun) fs.mkdirSync(dir, { recursive: true });

  const content = fs.readFileSync(from, "utf-8").replace(/{{DOMAIN}}/g, domain);
  if (isDryRun) {
    console.log(`🧪 Would write to ${to}:\n\n${content}\n`);
  } else {
    fs.writeFileSync(to, content, "utf-8");
    console.log(`✅ Created with domain: ${path.relative(process.cwd(), to)}`);
  }
}

function injectAuthLogic(
  filePath: string,
  provider: "clerk" | "supabase" | "nextauth",
) {
  let content = fs.readFileSync(filePath, "utf-8");

  const userBlockRegex =
    /[\t ]*\/\/ TODO: 🔐 Replace with your own auth system\n[\t ]*\/\/ Example: const user = await getUserId\(\);\n?/;

  if (!userBlockRegex.test(content)) {
    console.warn(`⚠️ No auth placeholder block found in ${filePath}`);
    return;
  }

  let importStatements = "";
  let userLogic = "";

  if (provider === "clerk") {
    importStatements = `import { auth, currentUser } from "@clerk/nextjs";`;
    userLogic = `const { userId } = auth();\n  const user = await currentUser();`;
  } else if (provider === "supabase") {
    importStatements = `import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";`;
    userLogic = `const supabase = createServerComponentClient();\n  const { data: { user } } = await supabase.auth.getUser();`;
  } else if (provider === "nextauth") {
    importStatements = `import { getServerSession } from "next-auth";\nimport { authOptions } from "@/lib/auth";`;
    userLogic = `const session = await getServerSession(authOptions);\n  const user = session?.user;`;
  }

  // Insert import
  const lines = content.split("\n");
  const lastImportIndex = lines.reduce(
    (last, line, idx) => (line.startsWith("import ") ? idx : last),
    -1,
  );
  lines.splice(lastImportIndex + 1, 0, importStatements);

  // Replace user logic block
  const updatedContent = lines
    .join("\n")
    .replace(userBlockRegex, `${userLogic}\n`);

  if (isDryRun) {
    console.log(`🧪 Would inject into ${filePath}:\n\n${updatedContent}\n`);
  } else {
    fs.writeFileSync(filePath, updatedContent, "utf-8");
    console.log(
      `✨ Injected auth logic for ${provider} into: ${path.relative(process.cwd(), filePath)}`,
    );
  }
}

function updateEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  const required = [
    "STRIPE_SECRET_KEY=sk_test_...",
    "STRIPE_WEBHOOK_SECRET=whsec_...",
    "PRICE_ID=price_...",
    "KV_REST_API_URL=",
    "KV_REST_API_TOKEN=",
  ];

  const existing = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf-8")
    : "";
  const missing = required.filter(
    (line) => !existing.includes(line.split("=")[0]),
  );

  if (missing.length === 0) return;

  if (isDryRun) {
    console.log(`🧪 Would update .env.local with:\n${missing.join("\n")}\n`);
    return;
  }

  fs.appendFileSync(
    envPath,
    `\n# Added by Paykit CLI\n${missing.join("\n")}\n`,
  );
  console.log("✅ .env.local updated with missing Stripe & KV variables.");
}

function detectPackageManager(): "pnpm" | "yarn" | "npm" {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

function normalizeFrameworkKey(input: string): string {
  return input.toLowerCase().replace(/[^a-z]/g, "");
}

main();
