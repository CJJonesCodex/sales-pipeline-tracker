import { NextResponse, type NextRequest } from "next/server";
import {
  clearMiddlewareSession,
  getMiddlewareUser,
} from "@/lib/supabase/auth-helpers";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const user = await getMiddlewareUser(request);

  if (!user) {
    clearMiddlewareSession(response);
  }

  return { response, user };
}
