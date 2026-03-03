import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createClient();

  try {
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Exchange code error:", exchangeError);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user exists in users table
    const { data: existingUser, error: queryError } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (queryError && queryError.code !== "PGRST116") {
      console.error("Query error:", queryError);
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // If user doesn't exist, create user and couple record
    if (!existingUser) {
      const userName = session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User";

      // Create user record
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          id: session.user.id,
          email: session.user.email,
          name: userName,
          avatar_url: session.user.user_metadata?.avatar_url,
        })
        .select()
        .single();

      if (userError) {
        console.error("User creation error:", userError);
        return NextResponse.redirect(new URL("/home", request.url));
      }

      // Create couple record with initial data
      const { error: coupleError } = await supabase
        .from("couples")
        .insert({
          user_id: newUser.id,
          partner_name: null,
          relationship_start_date: new Date().toISOString(),
        });

      if (coupleError) {
        console.error("Couple creation error:", coupleError);
      }
    }

    return NextResponse.redirect(new URL("/home", request.url));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
