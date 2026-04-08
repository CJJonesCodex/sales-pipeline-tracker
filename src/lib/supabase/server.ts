import {
  clearServerSession,
  getServerUser,
  signInAnonymously,
  setServerSession,
  signInWithPassword,
} from "@/lib/supabase/auth-helpers";

export async function createClient() {
  return {
    auth: {
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const { session, error } = await signInWithPassword(email, password);

        if (!session || error) {
          return { error: { message: error ?? "Sign in failed." } };
        }

        await setServerSession(session);
        return { error: null };
      },
      async signInAnonymously() {
        const { session, error } = await signInAnonymously();

        if (!session || error) {
          return { error: { message: error ?? "Anonymous sign in failed." } };
        }

        await setServerSession(session);
        return { error: null };
      },
      async signOut() {
        await clearServerSession();
      },
      async getUser() {
        const user = await getServerUser();
        return { data: { user } };
      },
    },
  };
}
