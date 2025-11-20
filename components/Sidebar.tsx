
import React from 'react';
import { View } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ label, isActive, onClick, icon }) => (
  <li>
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 text-base font-semibold rounded-lg transition-colors duration-200 group ${
        isActive 
          ? 'bg-amber-100 text-amber-700' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className={isActive ? 'text-amber-600' : 'text-gray-500 group-hover:text-gray-800'}>
        {icon}
      </span>
      <span className="ml-3">{label}</span>
    </button>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, setCurrentView }) => {
  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: 'home', label: 'Inicio', icon: <HomeIcon /> },
    { view: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { view: 'inventory', label: 'Inventario', icon: <InventoryIcon /> },
    { view: 'sales', label: 'Ventas', icon: <SalesIcon /> },
    { view: 'fixedCosts', label: 'Costos', icon: <FixedCostIcon /> },
    { view: 'help', label: 'Ayuda', icon: <HelpIcon /> },
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ease-in-out bg-white shadow-lg border-r border-gray-200 
                   ${isOpen ? 'transform-none' : '-translate-x-full'}`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center pl-2.5 mb-5 h-[40px]">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 text-amber-600 animate-chef-jump">
                <path d="M6 18H18V14C18 13.4477 17.5523 13 17 13H7C6.44772 13 6 13.4477 6 14V18Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 13C4.5 13 3.5 11 4 9C4.5 7 6.5 6 8.5 6C10.5 6 11.5 4 12.5 3C13.5 4 14.5 6 16.5 6C18.5 6 20.5 7 21 9C21.5 11 20.5 13 18.5 13H6.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
                Gastronom<span className="text-amber-600">IA</span>
            </h1>
          </div>
          <ul className="space-y-2">
            {navItems.map(item => (
              <NavButton
                key={item.view}
                label={item.label}
                isActive={currentView === item.view}
                onClick={() => setCurrentView(item.view)}
                icon={item.icon}
              />
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

// Icons
const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);
const InventoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
);
const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);
const SalesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);
const FixedCostIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M12 17h.01M15 17h.01M15 14h.01M18 21H6a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2z" />
    </svg>
);
const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default Sidebar;
