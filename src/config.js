/**
 * Site configuration
 *
 * Edit the defaults below, or override them at runtime from the
 * Settings page (values are saved to localStorage).
 *
 * Every component reads config through getConfig() so overrides
 * take effect immediately without redeploying.
 */

// ---- EDIT THESE FOR YOUR BRAND ----
const defaults = {
  siteName: 'Your Brand Name',
  siteUrl: 'https://yourdomain.com',
  defaultAuthor: 'Your Name',
  cmsTitle: 'Blog CMS',
  blogPathPrefix: '/blog',       // path on the public site where posts live
  youtubeChannel: '',            // your YouTube channel URL (optional)
  pexelsApiKey: '',              // Pexels API key for stock image search
  categories: ['General', 'How-To', 'Guide', 'Review', 'News', 'Tips', 'Case Study', 'Comparison'],
  pageTypes: [
    { value: 'landing', label: 'Landing Page', color: 'bg-blue-50 text-blue-700' },
    { value: 'comparison', label: 'Comparison', color: 'bg-purple-50 text-purple-700' },
    { value: 'location', label: 'Location', color: 'bg-amber-50 text-amber-700' },
    { value: 'guide', label: 'Guide', color: 'bg-emerald-50 text-emerald-700' },
    { value: 'faq', label: 'FAQ', color: 'bg-rose-50 text-rose-700' },
  ],
};

const STORAGE_KEY = 'blog-cms-config';

/**
 * Returns the merged config: defaults overridden by anything
 * the user saved in localStorage via the Settings page.
 */
export function getConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
}

/**
 * Persist user overrides to localStorage.
 * Only saves keys that differ from defaults so the object stays small.
 */
export function saveConfig(values) {
  const overrides = {};
  for (const key of Object.keys(defaults)) {
    if (values[key] !== undefined && values[key] !== defaults[key]) {
      overrides[key] = values[key];
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

// For backward-compat: default export returns the live config object
export default getConfig();
