import { type ReactNode } from 'react';

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  children: ReactNode;
}

export const Tabs = ({ tabs, activeTab, onChange, children }: TabsProps) => {
  return (
    <div>
      <div className="border-b border-white/10">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-accent-green text-accent-green'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
};

interface TabPanelProps {
  value: string;
  activeTab: string;
  children: ReactNode;
}

export const TabPanel = ({ value, activeTab, children }: TabPanelProps) => {
  if (value !== activeTab) return null;
  return <>{children}</>;
};
