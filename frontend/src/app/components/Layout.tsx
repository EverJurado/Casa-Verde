import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Package,
  FileText,
  LogOut,
  Menu,
  X,
  Clock
} from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isJefa = user?.rol === 'jefa';
  const displayName = user?.nombre ?? user?.username ?? '';
  const roleLabel = isJefa ? 'Jefa' : user?.rol === 'garzon' ? 'Garzón' : '';

  const menuItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', showFor: ['jefa', 'garzon'] },
    { path: '/app/garzones-admin', icon: Users, label: 'Garzones', showFor: ['jefa'] },
    { path: '/app/personal', icon: UsersRound, label: 'Personal', showFor: ['jefa','garzon'] },
    { path: '/app/productos', icon: Package, label: 'Productos', showFor: ['jefa', 'garzon'] },
    { path: '/app/servicios-extras', icon: Clock, label: 'Servicios Extras', showFor: ['jefa', 'garzon'] },
    { path: '/app/reportes', icon: FileText, label: 'Reportes', showFor: ['jefa'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.showFor.includes(user?.rol || '')
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-background border-r border-border fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-primary tracking-tight font-semibold">Casa Verde</span>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sesión activa</p>
              <p className="text-foreground font-medium">{displayName}</p>
              <p className="text-xs text-primary capitalize mt-1">{roleLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="w-3 h-3 bg-green-500 rounded-full" title="Sesión independiente por pestaña"></div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-3 py-4 space-y-1">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-border sticky bottom-0 bg-background">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <aside className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex flex-col">
          {/* Close button */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-primary tracking-tight font-semibold">Club Admin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bienvenido/a</p>
                <p className="text-foreground font-medium">{displayName}</p>
                <p className="text-xs text-primary capitalize mt-1">{roleLabel}</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="px-3 py-4 space-y-1">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Logout */}
          <div className="p-3 border-t border-border sticky bottom-0 bg-background">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top Bar Mobile */}
        <div className="lg:hidden h-16 bg-background border-b border-border flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="text-primary font-semibold">Casa Verde</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{displayName}</span>
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Sesión activa"></div>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}