import React from 'react';

interface HeaderProps {
  userName: string | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onLogout }) => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            <span className="text-indigo-600">Recipe</span>Cost
          </h1>
          <p className="text-slate-500 mt-1">Tu asistente para la gestión de costos de recetas.</p>
        </div>
        {userName && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 truncate max-w-xs" title={userName}>
              {userName}
            </span>
            <button
              onClick={onLogout}
              className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-300 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;