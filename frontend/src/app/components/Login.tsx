import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        login(data.user);

        if (data.user.force_password_change) {
          navigate('/cambiar-password');
        } else if (data.user.rol === 'jefa') {
          navigate('/app/dashboard');
        } else {
          navigate('/app/dashboard');
        }
      } else {
        setError(data.message || 'Usuario o contraseña incorrectos');
      }
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(22, 163, 74, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
          linear-gradient(135deg, #0a1f0f 0%, #0f2a1a 50%, #1a3d2e 100%)
        `,
        backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%',
      }}
    >
      {/* Elementos decorativos tipo bar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 opacity-10 transform rotate-12">
          <svg width="60" height="120" viewBox="0 0 60 120" fill="none">
            <rect x="15" y="20" width="30" height="80" rx="15" fill="#10b981" stroke="#059669" strokeWidth="2"/>
            <rect x="20" y="10" width="20" height="15" rx="2" fill="#10b981"/>
            <circle cx="30" cy="35" r="8" fill="#065f46"/>
          </svg>
        </div>
        <div className="absolute top-40 right-16 opacity-8 transform -rotate-6">
          <svg width="40" height="80" viewBox="0 0 40 80" fill="none">
            <ellipse cx="20" cy="40" rx="15" ry="35" fill="#10b981" stroke="#059669" strokeWidth="2"/>
            <rect x="18" y="8" width="4" height="12" fill="#065f46"/>
          </svg>
        </div>
        <div className="absolute bottom-32 left-20 opacity-6 transform rotate-45">
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <path d="M25 5 L35 25 L45 25 L37 35 L40 45 L25 38 L10 45 L13 35 L5 25 L15 25 Z" fill="#10b981" stroke="#059669" strokeWidth="1"/>
          </svg>
        </div>
        <div className="absolute bottom-20 right-10 opacity-12 transform -rotate-12">
          <svg width="35" height="60" viewBox="0 0 35 60" fill="none">
            <rect x="12" y="15" width="11" height="35" rx="5" fill="#10b981" stroke="#059669" strokeWidth="1"/>
            <rect x="15" y="5" width="5" height="10" rx="2" fill="#10b981"/>
            <circle cx="17.5" cy="25" r="3" fill="#065f46"/>
          </svg>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl mb-4 shadow-[0_20px_60px_-30px_rgba(16,185,129,0.9)]">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl text-primary mb-2">Sistema Administrativo</h1>
          <p className="text-muted-foreground">Acceso exclusivo — Casa Verde</p>
        </div>

        <div className="bg-slate-950/90 border border-emerald-500/20 rounded-3xl p-8 shadow-[0_35px_60px_-35px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Usuario o CI</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border rounded-lg bg-background text-foreground"
                  placeholder="Usuario o número de CI"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border rounded-lg bg-background text-foreground"
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
