/**
 * Shared Supabase client + credential resolution for the CLI.
 *
 * Resolution order (first hit wins):
 *   1. process.env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *   2. .env in cwd (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *   3. throw — caller decides what to print
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

async function readDotEnv() {
  try {
    const raw = await readFile(join(process.cwd(), ".env"), "utf8");
    const out = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

export async function resolveCreds() {
  const dotenv = await readDotEnv();
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || dotenv.SUPABASE_URL || dotenv.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || dotenv.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || dotenv.SUPABASE_ANON_KEY || dotenv.VITE_SUPABASE_ANON_KEY;
  if (!url || !serviceRoleKey) {
    const missing = [!url && "SUPABASE_URL", !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
    throw new Error(
      `Missing credentials: ${missing.join(", ")}. Set them in your environment or in .env, or run 'blog-cms init' first.`
    );
  }
  return { url, serviceRoleKey, anonKey };
}

export async function adminClient() {
  const { url, serviceRoleKey } = await resolveCreds();
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function parseProjectRef(url) {
  const m = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  return m ? m[1] : null;
}
