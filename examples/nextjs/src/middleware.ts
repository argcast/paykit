import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_ID = "unsafe_user_id";
const COOKIE_NAME = "unsafe_user_name";

// GitHub-style name generator
function generateRandomName() {
  const adjectives = [
    "quick",
    "lazy",
    "happy",
    "sleepy",
    "brave",
    "shy",
    "eager",
    "clever",
    "bold",
    "calm",
  ];
  const nouns = [
    "tiger",
    "koala",
    "eagle",
    "panda",
    "dolphin",
    "otter",
    "owl",
    "fox",
    "bear",
    "lynx",
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 10000);

  return `${adj}-${noun}-${number}`;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const existingId = request.cookies.get(COOKIE_ID);
  const existingName = request.cookies.get(COOKIE_NAME);

  if (!existingId || !existingName) {
    const uuid = crypto.randomUUID();
    const randomName = generateRandomName();

    response.cookies.set(COOKIE_ID, uuid, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    response.cookies.set(COOKIE_NAME, randomName, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
