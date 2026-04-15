import { useState } from 'react';
import { BookOpen, Rocket, FileText, Database, RefreshCw, Globe, Palette, FileCode2 } from 'lucide-react';
import GettingStarted from './docs/GettingStarted';
import PromptsWorkflows from './docs/PromptsWorkflows';
import DatabaseSetup from './docs/DatabaseSetup';
import FeedbackLoop from './docs/FeedbackLoop';
import ConnectWebsite from './docs/ConnectWebsite';
import Customization from './docs/Customization';
import ApiReference from './docs/ApiReference';

const TABS = [
  { id: 'getting-started', label: 'Getting Started', icon: Rocket, component: GettingStarted },
  { id: 'prompts', label: 'Prompts & Workflows', icon: FileText, component: PromptsWorkflows },
  { id: 'database', label: 'Database Setup', icon: Database, component: DatabaseSetup },
  { id: 'feedback', label: 'Feedback Loop', icon: RefreshCw, component: FeedbackLoop },
  { id: 'connect', label: 'Connect Website', icon: Globe, component: ConnectWebsite },
  { id: 'customization', label: 'Customization', icon: Palette, component: Customization },
  { id: 'api', label: 'API Reference', icon: FileCode2, component: ApiReference },
];

export default function Docs() {
  const [activeTab, setActiveTab] = useState('getting-started');

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || GettingStarted;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <BookOpen className="w-6 h-6" />
          Documentation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Everything you need to set up, customize, and connect your CMS.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="mb-8 border-b border-slate-200">
        <nav className="flex gap-1 overflow-x-auto pb-px -mb-px" aria-label="Documentation sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active section */}
      <ActiveComponent />
    </div>
  );
}
