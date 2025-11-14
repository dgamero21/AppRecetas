
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          <span className="text-indigo-600">Recipe</span>Cost
        </h1>
        <p className="text-slate-500 mt-1">Tu asistente para la gestión de costos de recetas.</p>
      </div>
    </header>
  );
};

export default Header;
