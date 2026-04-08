import { cookies } from "next/headers";
import { Database } from "@/lib/database.types";

type RestMethod = "GET" | "POST" | "PATCH";

type RequestOptions = {
  method?: RestMethod;
  query?: Record<string, string>;
  body?: unknown;
  prefer?: string;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return { url, publishableKey };
}

async function getServerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("sb-access-token")?.value ?? null;
}

export async function supabaseRestRequest<T>(
  table: keyof Database["public"]["Tables"],
  options: RequestOptions = {},
): Promise<T> {
  const { url, publishableKey } = getSupabaseConfig();
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    throw new Error("You must be signed in to access CRM data.");
  }

  const queryParams = new URLSearchParams(options.query ?? {});
  const endpoint = `${url}/rest/v1/${table}${queryParams.toString() ? `?${queryParams}` : ""}`;

  const response = await fetch(endpoint, {
    method: options.method ?? "GET",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: options.prefer ?? "return=representation",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${payload}`);
  }

  if (response.status === 204) {
    return [] as T;
  }

  return (await response.json()) as T;
}
