import React from 'react';
import Tooltip from './common/Tooltip';

interface HeaderProps {
  userName: string | null;
  onLogout: () => void;
}

const GastronomIAIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 shrink-0">
      <path d="M19.68 9.32999C19.68 9.32999 22 10.15 22 12.41C22 14.67 19.55 15.52 19.55 15.52" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.4502 15.52C4.4502 15.52 2.0002 14.67 2.0002 12.41C2.0002 10.15 4.3202 9.32999 4.3202 9.32999" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 4.43C16 4.43 16.56 2 12 2C7.44 2 8 4.43 8 4.43" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12.41V22" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.81 12.41C18.81 12.41 19.68 12.41 20.26 11.83C21.4 10.69 20.84 8.79999 19.1 8.21999C17.36 7.63999 16 8.77999 16 10.15C16 11.52 17.36 12.41 18.81 12.41Z" fill="#A5B4FC" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.19001 12.41C5.19001 12.41 4.32001 12.41 3.74001 11.83C2.60001 10.69 3.16001 8.79999 4.90001 8.21999C6.64001 7.63999 8.00001 8.77999 8.00001 10.15C8.00001 11.52 6.64001 12.41 5.19001 12.41Z" fill="#A5B4FC" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 14.07C14.21 14.07 16 12.28 16 10.07C16 7.85999 14.21 6.06999 12 6.06999C9.79 6.06999 8 7.85999 8 10.07C8 12.28 9.79 14.07 12 14.07Z" fill="#818CF8" stroke="#4338CA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

const Header: React.FC<HeaderProps> = ({ userName, onLogout }) => {
  // Extract username from email for display purposes
  const displayName = userName ? userName.split('@')[0] : '';

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div>
          <div className="flex items-center">
            <GastronomIAIcon />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Gastronom<span className="text-indigo-600">IA</span>
            </h1>
          </div>
          <p className="text-slate-500 mt-1">Tu asistente IA para la gestión de costos gastronómicos.</p>
        </div>
        {userName && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600" title={userName}>
              {displayName}
            </span>
            <Tooltip text="Cerrar sesión de forma segura">
              <button
                onClick={onLogout}
                className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-all duration-150 ease-in-out active:scale-95"
              >
                Cerrar Sesión
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
