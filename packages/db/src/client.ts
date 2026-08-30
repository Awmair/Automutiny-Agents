import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type DatabaseEnvironment = Record<string, string | undefined>;

export function readDatabaseEnvironment(environment: DatabaseEnvironment = process.env) {
  const url = environment.SUPABASE_URL;
  const serviceRoleKey = environment.SUPABASE_SECRET_KEY ?? environment.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY are required in server code. SUPABASE_SERVICE_ROLE_KEY remains supported for existing projects.",
    );
  }

  return { serviceRoleKey, url };
}

export function createServerDatabaseClient(
  environment: DatabaseEnvironment = process.env,
): SupabaseClient {
  const { serviceRoleKey, url } = readDatabaseEnvironment(environment);

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
