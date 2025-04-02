import { cookies } from "next/headers";

const COOKIE_NAME = "unsafe_user_name";
const COOKIE_ID = "unsafe_user_id";
/*
 *
 * This is a mock implementation of an user object
 * returned from an actual auth system in your app
 * this file should be removed after for your own auth.
 *
 */
export async function getUserId(): Promise<{
  name: string | null;
  id: string | null;
  email: string;
}> {
  const cookieStore = await cookies();
  const id = cookieStore.get(COOKIE_ID);
  const name = cookieStore.get(COOKIE_NAME);
  return {
    name: name?.value || null,
    id: id?.value || null,
    email: "user@email.com",
  };
}
