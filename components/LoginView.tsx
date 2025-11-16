import React, { useState } from 'react';
import Card from './common/Card';
import Tooltip from './common/Tooltip';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

const GastronomIAIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2 text-amber-600 animate-chef-jump">
        <path d="M6 18H18V14C18 13.4477 17.5523 13 17 13H7C6.44772 13 6 13.4477 6 14V18Z" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 13C4.5 13 3.5 11 4 9C4.5 7 6.5 6 8.5 6C10.5 6 11.5 4 12.5 3C13.5 4 14.5 6 16.5 6C18.5 6 20.5 7 21 9C21.5 11 20.5 13 18.5 13H6.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Por favor, ingresa tu usuario y contraseña.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await onLogin(username, password);
      // On success, the App component will unmount this view.
    } catch (e: any) {
      setError(e.message || "Ocurrió un error inesperado.");
      setIsLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => !prev);
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null);
    setUsername(e.target.value);
  }
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) setError(null);
    setPassword(e.target.value);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-6">
            <GastronomIAIcon />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-800">
                Gastronom<span className="text-amber-600">IA</span>
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Inicia sesión para gestionar tu negocio.
            </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="tu.usuario"
                className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600 text-gray-900"
                required
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600 text-gray-900"
                    required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Tooltip text={isPasswordVisible ? 'Ocultar' : 'Mostrar'} position="top">
                        <button 
                            type="button" 
                            onClick={togglePasswordVisibility}
                            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {isPasswordVisible ? (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.122 2.122" />
                              </svg>
                            ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542 7z" />
                              </svg>
                            )}
                        </button>
                    </Tooltip>
                </div>
              </div>
            </div>
             {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm" role="alert">
                <p>{error}</p>
              </div>
            )}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 text-white px-4 py-2.5 rounded-lg shadow-sm hover:bg-amber-700 transition-all duration-150 font-semibold disabled:bg-amber-400 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]"
              >
                {isLoading && (
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>
        </Card>
         <div className="mt-6 text-center text-xs text-gray-500">
            <p>Solo el administrador puede crear nuevas cuentas.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;