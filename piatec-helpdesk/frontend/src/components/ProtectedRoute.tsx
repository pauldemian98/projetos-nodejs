import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  // Não logado
  if (!token || !userRaw) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  // Sem permissão de papel (RBAC)
  if (allowedRoles && !allowedRoles.includes(user.papel)) {
    // Se for externo barrado, joga pra home dele, etc.
    if (user.papel === 'EXTERNO') {
      return <Navigate to="/painel-externo" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  // Autorizado!
  return <Outlet />;
};
