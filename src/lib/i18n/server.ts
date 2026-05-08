import { cookies, headers } from "next/headers";
import { DEFAULT_LANG, type Lang, tFor } from "./dict";

const COOKIE_NAME = "dela.lang";

/** Resolve current language from cookie. If absent, sniff Accept-Language
    and bias toward English when the user's browser asked for it. */
export async function getLang(): Promise<Lang> {
  const c = await cookies();
  const fromCookie = c.get(COOKIE_NAME)?.value;
  if (fromCookie === "ru" || fromCookie === "en") return fromCookie;

  const h = await headers();
  const accept = h.get("accept-language") ?? "";
  // Coarse: if Russian appears anywhere → ru; else if English does → en.
  if (/\bru\b/i.test(accept)) return "ru";
  if (/\ben\b/i.test(accept)) return "en";
  return DEFAULT_LANG;
}

/** Returns a translator bound to the current cookie/Accept-Language pick. */
export async function getT() {
  const lang = await getLang();
  return { lang, t: tFor(lang) };
}
