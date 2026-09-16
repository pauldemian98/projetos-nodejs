import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// Páginas Importadas (Mockadas temporariamente caso não existam)
import { HomeExterno } from './pages/HomeExterno';
import { AgenteDashboard } from './pages/AgenteDashboard';
import { AvaliacaoPublica } from './pages/AvaliacaoPublica';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { EditUser } from './pages/EditUser';
import { CreateUser } from './pages/CreateUser';
import { ChamadoDetalhe } from './pages/ChamadoDetalhe';
import { PerfilUsuario } from './pages/PerfilUsuario';

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  if (!token || !userRaw) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userRaw);
    if (user.papel === 'EXTERNO') {
      return <Navigate to="/painel-externo" replace />;
    } else if (user.papel === 'GESTOR' || user.papel === 'ENCARREGADO') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/painel-agente" replace />;
    }
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

const FallbackRoute = () => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');

  if (!token || !userRaw) {
    return <Navigate to="/login" replace />;
  }

  return <div className="p-10 text-red-600 font-bold">Página não encontrada 404 (Rota não bateu)</div>;
};

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota Raiz - Redireciona para o painel se logado, ou /login se não logado */}
        <Route path="/" element={<RootRedirect />} />

        {/* Rota Pública - Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rota Pública - Avaliação do Solicitante via Link do E-mail */}
        <Route path="/avaliacao/:id" element={<AvaliacaoPublica />} />

        {/* Bloqueado! */}
        <Route path="/unauthorized" element={<div className="p-10 text-red-600 font-bold">Acesso Negado</div>} />

        {/* Todas as Rotas Protegidas com Layout (Header) */}
        <Route element={<Layout />}>
          
          {/* Rotas Protegidas para Todos (Agentes e Externos) */}
          <Route element={<ProtectedRoute allowedRoles={['EXTERNO', 'GESTOR', 'ENCARREGADO', 'ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3']} />}>
            <Route path="/chamado/:id" element={<ChamadoDetalhe />} />
            <Route path="/perfil/:id" element={<PerfilUsuario />} />
          </Route>

          {/* Rotas Protegidas - Usuário EXTERNO */}
          <Route element={<ProtectedRoute allowedRoles={['EXTERNO', 'GESTOR', 'ENCARREGADO', 'ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3']} />}>
            <Route path="/painel-externo" element={<HomeExterno />} />
          </Route>

          {/* Rotas Protegidas - Agentes de TI */}
          <Route element={<ProtectedRoute allowedRoles={['GESTOR', 'ENCARREGADO', 'ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3']} />}>
            <Route path="/painel-agente" element={<AgenteDashboard />} />
          </Route>

          {/* Rotas Protegidas - Admin Panel (Gestor, Encarregado, Assistentes, Estagiário) */}
          <Route element={<ProtectedRoute allowedRoles={['GESTOR', 'ENCARREGADO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3', 'ESTAGIARIO']} />}>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/users/new" element={<CreateUser />} />
          </Route>

          {/* Rotas Protegidas - Gerencial (Gestor / Encarregado) - Somente eles editam usuários */}
          <Route element={<ProtectedRoute allowedRoles={['GESTOR', 'ENCARREGADO']} />}>
            <Route path="/admin/users/edit/:id" element={<EditUser />} />
          </Route>
        </Route>

        {/* Fallback - Redireciona para /login se não autenticado, ou exibe 404 se logado */}
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

