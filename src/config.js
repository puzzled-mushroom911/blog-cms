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
  siteName: 'Living in St. Pete',
  siteUrl: 'https://livinginstpetefl.com',
  defaultAuthor: 'Aaron & Aubrey Chand',
  cmsTitle: 'LIT Blog CMS',
  blogPathPrefix: '/blog',       // path on the public site where posts live
  youtubeChannel: 'https://www.youtube.com/@livinginst-pete',
  pexelsApiKey: '',              // Pexels API key for stock image search
  categories: ['Neighborhoods', 'Market Update', 'Home Buying', 'Relocation', 'Lifestyle', 'How-To', 'Comparison', 'News'],
  pageTypes: [
    { value: 'moving-from', label: 'Moving From', color: 'bg-blue-50 text-blue-700' },
    { value: 'compare', label: 'Compare', color: 'bg-purple-50 text-purple-700' },
    { value: 'zip-code', label: 'Zip Code', color: 'bg-amber-50 text-amber-700' },
    { value: 'neighborhood', label: 'Neighborhood', color: 'bg-emerald-50 text-emerald-700' },
    { value: 'schools', label: 'Schools', color: 'bg-rose-50 text-rose-700' },
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
