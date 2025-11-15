import React, { useState } from 'react';
import Card from './common/Card';
import Tooltip from './common/Tooltip';

interface LoginViewProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Gastronom<span className="text-indigo-600">IA</span>
            </h1>
            <p className="text-slate-500 mt-2">
              Inicia sesión para acceder a tus datos.
            </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="nombre.usuario"
                className="w-full p-2 bg-white border rounded text-slate-900"
                required
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    className="w-full p-2 bg-white border rounded text-slate-900"
                    required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Tooltip text={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} position="top">
                        <button 
                            type="button" 
                            onClick={togglePasswordVisibility}
                            className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                            aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {isPasswordVisible ? (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.742L2.303 6.546A10.048 10.048 0 01.458 10c1.274 4.057 5.022 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                              </svg>
                            ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
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
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-all duration-150 font-semibold disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center active:scale-[0.98]"
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
         <div className="mt-6 text-center text-xs text-slate-500">
            <p>El administrador es el único que puede crear nuevas cuentas.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
