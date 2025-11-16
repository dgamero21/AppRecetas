import React from 'react';
import Tooltip from './common/Tooltip';

interface HeaderProps {
  userName: string | null;
  onLogout: () => void;
  onMenuClick: () => void;
}

const GastronomIAIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 text-amber-600 animate-chef-jump">
        <path d="M6 18H18V14C18 13.4477 17.5523 13 17 13H7C6.44772 13 6 13.4477 6 14V18Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 13C4.5 13 3.5 11 4 9C4.5 7 6.5 6 8.5 6C10.5 6 11.5 4 12.5 3C13.5 4 14.5 6 16.5 6C18.5 6 20.5 7 21 9C21.5 11 20.5 13 18.5 13H6.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

const Header: React.FC<HeaderProps> = ({ userName, onLogout, onMenuClick }) => {
  const displayName = userName ? userName.split('@')[0] : '';

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
            <Tooltip text="Abrir menú">
                <button 
                    onClick={onMenuClick}
                    className="p-2 rounded-full hover:bg-gray-100 mr-2 lg:hidden"
                    aria-label="Abrir menú de navegación"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </Tooltip>
          <div className="flex items-center">
              <GastronomIAIcon />
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
              Gastronom<span className="text-amber-600">IA</span>
              </h1>
          </div>
        </div>
        {userName && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700 hidden md:inline" title={userName}>
              {displayName}
            </span>
            <Tooltip text="Cerrar sesión">
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors duration-150"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;