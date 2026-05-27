import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

/* Routes accessible without a session. /auth/* covers callback + sign-out.
   /api/* is excluded so route handlers can return 401 JSON instead of an
   HTML redirect that breaks fetch() callers. */
const PUBLIC_PREFIXES = ["/login", "/auth", "/api", "/preview"];

export async function proxy(request: NextRequest) {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  // If env vars are missing the page route will surface a clear error;
  // don't crash the middleware.
  if (!url || !key) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (user && path === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /* Skip Next internals, static files, and the PWA manifest/icons. */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png|illustrations/.*|.*\\.svg).*)",
  ],
};
