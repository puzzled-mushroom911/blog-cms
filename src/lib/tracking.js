import { HOSTED_URL, HOSTED_ANON_KEY, hasHostedCredentials } from './supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Record an anonymous CMS install event.
 * Called once when a BYO user completes the setup flow.
 * Fire-and-forget — never blocks the user experience.
 */
export async function trackInstall(projectUrl) {
  if (!hasHostedCredentials) return;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(projectUrl);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const projectHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const hosted = createClient(HOSTED_URL, HOSTED_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await hosted.from('cms_installs').insert({ project_hash: projectHash });
  } catch {
    // Silent failure — tracking is best-effort
  }
}
