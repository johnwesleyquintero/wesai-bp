import React from 'react';
import { ActiveTab, Theme } from '../types.ts';
import { ThemeToggleButton } from './ThemeToggleButton.tsx';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  theme: Theme;
  toggleTheme: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

// Icon components (simple SVGs)
const BuilderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>;
const DocsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.57 6.57 0 0 1-.22.127c-.332.183-.582.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>;

const CollapseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m18.75 4.5-7.5 7.5 7.5 7.5m-6-15L5.25 12l7.5 7.5" /></svg>;
const ExpandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" /></svg>;


const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'builder', label: 'Builder', icon: <BuilderIcon /> },
    { id: 'documentation', label: 'Documentation', icon: <DocsIcon /> }
];

const NavButton: React.FC<{ tab: typeof TABS[0], activeTab: ActiveTab, onClick: () => void, isCollapsed: boolean }> = ({ tab, activeTab, onClick, isCollapsed }) => (
    <button
        onClick={onClick}
        title={isCollapsed ? tab.label : undefined}
        className={`w-full flex items-center p-3 rounded-lg transition-colors duration-150 ease-in-out ${isCollapsed ? 'justify-center' : 'space-x-3'} ${
            activeTab === tab.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-current={activeTab === tab.id ? 'page' : undefined}
    >
        {tab.icon}
        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{tab.label}</span>}
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onOpenSettings, theme, toggleTheme, isCollapsed, onToggle }) => {
    return (
        <aside className={`flex flex-col p-4 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <nav className="flex-grow space-y-2">
                {TABS.map((tab) => (
                    <NavButton key={tab.id} tab={tab} activeTab={activeTab} onClick={() => onTabChange(tab.id)} isCollapsed={isCollapsed}/>
                ))}
            </nav>
            <div className="mt-auto space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                 <button
                    onClick={onOpenSettings}
                    title={isCollapsed ? "Settings" : undefined}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors duration-150 ease-in-out text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                >
                    <SettingsIcon />
                    {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Settings</span>}
                </button>
                <div className="flex justify-center">
                    <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
                </div>
                <button
                    onClick={onToggle}
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors duration-150 ease-in-out text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                >
                    {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
                    {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">Collapse</span>}
                </button>
            </div>
        </aside>
    );
};
