import React, { useState, ReactNode, useEffect, useMemo, useCallback } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onTabChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  // Update active tab when defaultTab changes
  useEffect(() => {
    if (defaultTab && defaultTab !== activeTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab) return;

    // Instant tab switching for better UX
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }, [activeTab, onTabChange]);

  // Memoize the active tab content to prevent unnecessary re-renders
  const activeTabContent = useMemo(() => {
    return tabs.find(tab => tab.id === activeTab)?.content;
  }, [tabs, activeTab]);

  // Memoize tab buttons to prevent unnecessary re-renders
  const tabButtons = useMemo(() => {
    return tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => handleTabChange(tab.id)}
        className={`
          group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
          ${activeTab === tab.id
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }
          focus:outline-none focus:text-indigo-600 focus:border-indigo-500
          transition-colors duration-150
        `}
        aria-current={activeTab === tab.id ? 'page' : undefined}
      >
        {tab.icon && (
          <span className={`
            mr-2 h-5 w-5
            ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
          `}>
            {tab.icon}
          </span>
        )}
        <span>{tab.label}</span>
        {tab.badge && (
          <span className={`
            ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${activeTab === tab.id
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-gray-100 text-gray-800'
            }
          `}>
            {tab.badge}
          </span>
        )}
      </button>
    ));
  }, [tabs, activeTab, handleTabChange]);

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabButtons}
        </nav>
      </div>

      {/* Tab Content - Instant Display */}
      <div className="mt-6">
        {activeTabContent}
      </div>
    </div>
  );
};

export default React.memo(Tabs);
