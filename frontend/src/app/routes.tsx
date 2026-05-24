import { createBrowserRouter, Navigate, Route } from 'react-router-dom';
import { Login } from './components/Login';
import { CambiarPassword } from './components/CambiarPassword';
import { Layout } from './components/Layout';
import { JefaDashboard } from './components/JefaDashboard';
import { GarzonPanel } from './components/GarzonPanel';
import { ChicasView } from './components/ChicasView';
import { GarzonesView } from './components/Garzones';
import { Productos } from './components/Productos';
import { Reportes } from './components/Reportes';
import { CrearUsuario } from './components/CrearUsuario';
import { ServiciosExtras } from './components/ServiciosExtras';
import { GarzonesAdmin } from './components/GarzonesAdmin';
import { JSX } from 'react';
import { AdicionarPersonal } from './components/AdicionarChicas';

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles?: string[];
}) => {
  const userStr = localStorage.getItem("usuario");

  if (!userStr) return <Navigate to="/" replace />;

  const user = JSON.parse(userStr);

  if (!user.rol) return <Navigate to="/" replace />;

  // Block access to app until garzon changes their forced-reset password
  if (user.force_password_change) return <Navigate to="/cambiar-password" replace />;

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
};

const DashboardRouter = () => {
  const userStr = localStorage.getItem("usuario");

  if (!userStr) return <Navigate to="/" replace />;

  const user = JSON.parse(userStr);

  if (!user.rol) return <Navigate to="/" replace />;

  return user.rol === "jefa" ? <JefaDashboard /> : <GarzonPanel />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/cambiar-password',
    element: <CambiarPassword />,
  },
  {
    path: '/app',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardRouter />,
      },
      {
        path: 'garzones',
        element: (
          <ProtectedRoute allowedRoles={['jefa']}>
            <GarzonesView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'garzones-admin',
        element: (
          <ProtectedRoute allowedRoles={['jefa']}>
            <GarzonesAdmin />
          </ProtectedRoute>
        ),
      },
      {
        path: 'personal',
        element: (
          <ProtectedRoute allowedRoles={['jefa', 'garzon']}>
            <ChicasView />
          </ProtectedRoute>
        ),
      },
      {
        path: 'productos',
        element: (
          <ProtectedRoute allowedRoles={['jefa', 'garzon']}>
            <Productos />
          </ProtectedRoute>
        ),
      },
      {
        path: 'servicios-extras',
        element: (
          <ProtectedRoute allowedRoles={['jefa', 'garzon']}>
            <ServiciosExtras />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reportes',
        element: (
          <ProtectedRoute allowedRoles={['jefa']}>
            <Reportes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'crear-usuario',
        element: (
          <ProtectedRoute allowedRoles={['jefa']}>
            <CrearUsuario />
          </ProtectedRoute>
        ),
      },
      {
        path: 'adicionar-personal',
        element: (
          <ProtectedRoute allowedRoles={['garzon', 'jefa']}>
            <AdicionarPersonal />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <h1>404 - Página no encontrada</h1>,
  },
]);
