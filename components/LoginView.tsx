import React, { useState } from 'react';
import Card from './common/Card';

interface LoginViewProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, name: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      if (email && password && name) {
        onRegister(email, password, name);
      } else {
        alert("Por favor, completa todos los campos para registrarte.");
      }
    } else {
      if (email && password) {
        onLogin(email, password);
      } else {
        alert("Por favor, ingresa tu email y contraseña.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                <span className="text-indigo-600">Recipe</span>Cost
            </h1>
            <p className="text-slate-500 mt-2">
              {isRegistering ? "Crea una cuenta para guardar tus datos en la nube." : "Inicia sesión para acceder a tus datos."}
            </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre o el de tu negocio"
                  className="w-full p-2 bg-white border rounded"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full p-2 bg-white border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2 bg-white border rounded"
                required
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors font-semibold"
              >
                {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginView;