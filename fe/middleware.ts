import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { normalizeLang } from "./src/i18n/config";

function shouldSkip(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/_next/webpack-hmr") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api")
  );
}

export function middleware(request: NextRequest) {
  const { nextUrl } = request;

  if (shouldSkip(nextUrl.pathname)) {
    return NextResponse.next();
  }

  const urlLangRaw = nextUrl.searchParams.get("lang");
  const cookieLangRaw = request.cookies.get("ui_lang")?.value;

  if (!urlLangRaw) {
    const resolved = normalizeLang(cookieLangRaw);

    const url = nextUrl.clone();
    url.searchParams.set("lang", resolved);

    const response = NextResponse.redirect(url);
    response.cookies.set("ui_lang", resolved, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  }

  const urlLang = normalizeLang(urlLangRaw);

  if (urlLang !== urlLangRaw) {
    const url = nextUrl.clone();
    url.searchParams.set("lang", urlLang);

    const response = NextResponse.redirect(url);
    response.cookies.set("ui_lang", urlLang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  }

  const method = request.method.toUpperCase();
  const shouldRedirectForCookieSync = method === "GET" || method === "HEAD";

  if (shouldRedirectForCookieSync && cookieLangRaw !== urlLang) {
    const response = NextResponse.redirect(nextUrl);
    response.cookies.set("ui_lang", urlLang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ui-lang", urlLang);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set("ui_lang", urlLang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
