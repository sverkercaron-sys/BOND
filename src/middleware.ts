import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Allow public auth routes
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname === "/" || pathname.startsWith("/auth")) {
    return response;
  }

  // Protect app routes
  if (pathname.startsWith("/home") || pathname.startsWith("/streak") || pathname.startsWith("/pulse") || pathname.startsWith("/history") || pathname.startsWith("/settings")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check user role (optional - add role checking if needed)
    // const { data: user } = await supabase
    //   .from("users")
    //   .select("role")
    //   .eq("id", session.user.id)
    //   .single();
    //
    // if (user?.role !== "admin") {
    //   return NextResponse.redirect(new URL("/home", request.url));
    // }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
};
