import { useState } from 'react';
import { getConfig, saveConfig } from '../config';
import { Save, Check, RotateCcw } from 'lucide-react';

export default function Settings() {
  const [values, setValues] = useState(getConfig);
  const [saved, setSaved] = useState(false);

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveConfig(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    localStorage.removeItem('blog-cms-config');
    setValues(getConfig());
    setSaved(false);
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your brand and site details. Changes are saved to your browser.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* Site name */}
        <Field
          label="Site / Brand Name"
          description="Displayed in the sidebar and login screen"
          value={values.siteName}
          onChange={(v) => handleChange('siteName', v)}
        />

        {/* CMS title */}
        <Field
          label="CMS Title"
          description="The name shown in the header bar"
          value={values.cmsTitle}
          onChange={(v) => handleChange('cmsTitle', v)}
        />

        {/* Default author */}
        <Field
          label="Default Author"
          description="Used as the default author for new posts"
          value={values.defaultAuthor}
          onChange={(v) => handleChange('defaultAuthor', v)}
        />

        {/* Site URL */}
        <Field
          label="Website URL"
          description="Your public website where blog posts are published"
          value={values.siteUrl}
          onChange={(v) => handleChange('siteUrl', v)}
          placeholder="https://yourdomain.com"
        />

        {/* Blog path prefix */}
        <Field
          label="Blog Path Prefix"
          description="The URL path where posts live on your site (e.g. /blog)"
          value={values.blogPathPrefix}
          onChange={(v) => handleChange('blogPathPrefix', v)}
          placeholder="/blog"
        />

        {/* YouTube channel */}
        <Field
          label="YouTube Channel URL"
          description="Optional. Link to your YouTube channel for reference."
          value={values.youtubeChannel}
          onChange={(v) => handleChange('youtubeChannel', v)}
          placeholder="https://youtube.com/@yourchannel"
        />

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Current config preview */}
      <div className="mt-6">
        <details className="group">
          <summary className="text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
            View current configuration (JSON)
          </summary>
          <pre className="mt-2 bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto">
            {JSON.stringify(values, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

function Field({ label, description, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      {description && (
        <p className="text-xs text-slate-400 mb-1.5">{description}</p>
      )}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-colors"
      />
    </div>
  );
}
