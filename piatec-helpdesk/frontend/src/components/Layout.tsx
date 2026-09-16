import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useTimerStore } from '../store/timerStore';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { WizardChatbot } from '../pages/WizardChatbot';
import { LogOut, User as UserIcon, Menu, LayoutDashboard, Settings, MessageSquare, X, Key } from 'lucide-react';
import { toast } from 'sonner';

export const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const userRaw = localStorage.getItem('user');
  const isAgent = userRaw ? JSON.parse(userRaw).papel !== 'EXTERNO' : false;
  const isActive = useTimerStore(state => state.isActive);
  const secondsElapsed = useTimerStore(state => state.secondsElapsed);
  const baseSeconds = useTimerStore(state => state.baseSeconds);
  const tick = useTimerStore(state => state.tick);

  useEffect(() => {
    if (isAgent) {
      api.get('/trabalho/ativo').then(res => {
        if (res.data.data) {
          const apontamento = res.data.data;
          const seconds = Math.floor((new Date().getTime() - new Date(apontamento.inicio).getTime()) / 1000);
          const baseSecs = (apontamento.chamado?.tempo_gasto_total_segundos || 0) + (apontamento.tarefa?.tempo_gasto_total_segundos || 0);
          useTimerStore.setState({ isActive: true, secondsElapsed: seconds, baseSeconds: baseSecs, activeChamadoId: apontamento.chamadoId, activeTarefaId: apontamento.tarefaId });
        }
      }).catch(() => {});
    }
  }, [isAgent]);

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => tick(), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, tick]);
  const user = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error('Digite a nova senha.');
      return;
    }
    if (!user || !user.id) return;
    
    try {
      setIsResetting(true);
      await api.put(`/users/${user.id}`, { senha: newPassword });
      toast.success('Senha atualizada com sucesso!');
      setIsResetPasswordOpen(false);
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao alterar senha.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!user) return null;

  const isGestor = user.papel === 'GESTOR' || user.papel === 'ENCARREGADO';
  const isAssistenteOrAuxiliar = user.papel.startsWith('ASSISTENTE') || user.papel === 'ESTAGIARIO';
  const canViewAdmin = isGestor || isAssistenteOrAuxiliar;

  const NavLink = ({ to, icon: Icon, children }: { to: string, icon: any, children: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-[#018896]/10 text-[#018896] font-bold border-l-4 border-[#018896]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'}`}
      >
        <Icon size={20} className={isActive ? 'text-[#018896]' : 'text-gray-500'} />
        <span className="whitespace-nowrap">{children}</span>
      </Link>
    );
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden font-sans">
      {/* Header Institucional Piatec */}
      <header className="bg-gradient-to-r from-[#174082] via-[#12366f] to-[#018896] text-white shadow-md z-20 flex-shrink-0 relative">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              title="Alternar Menu"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Título centralizado com tipografia Exo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span className="font-extrabold tracking-normal">PIATEC</span>
              <span className="font-light text-white/80">|</span>
              <span className="font-medium text-sm text-teal-100 uppercase tracking-wider">Suporte TI</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <div className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-full mr-2 shadow-lg animate-pulse">
                <span className="font-bold text-sm">
                  Trabalhando: {String(Math.floor((secondsElapsed + baseSeconds) / 60)).padStart(2, '0')}:{String((secondsElapsed + baseSeconds) % 60).padStart(2, '0')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm bg-black/20 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/10">
              <UserIcon size={16} className="text-teal-200" />
              <span className="font-medium">{user.nome_completo} <span className="text-white/75 font-normal ml-1">({user.papel})</span></span>
              
              <button 
                onClick={() => setIsResetPasswordOpen(true)}
                className="ml-2 bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors cursor-pointer"
                title="Redefinir Senha"
              >
                <Key size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 flex flex-col overflow-hidden ${isSidebarOpen ? 'w-64' : 'w-0 !border-r-0'}`}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-64 p-4 flex flex-col gap-1">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Menu Principal</div>
            
            {canViewAdmin && (
              <NavLink to="/admin" icon={Settings}>Painel do TI</NavLink>
            )}

            {isGestor && (
              <NavLink to="/painel-agente" icon={LayoutDashboard}>Gestão de Chamados</NavLink>
            )}
            
            {isAssistenteOrAuxiliar && (
              <NavLink to="/painel-agente" icon={LayoutDashboard}>Meus Chamados</NavLink>
            )}
            
            {user.papel === 'EXTERNO' && (
              <NavLink to="/painel-externo" icon={LayoutDashboard}>Meus chamados</NavLink>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 w-64 bg-gray-50 flex-shrink-0">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <LogOut size={20} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
          <div className="max-w-7xl mx-auto w-full pb-8">
            <Outlet />
          </div>
        </main>
        {/* Floating Chatbot Button */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {isChatbotOpen && (
            <div className="mb-4 bg-white rounded-xl shadow-2xl overflow-hidden w-96 max-h-[80vh] flex flex-col border border-gray-200">
              <div className="bg-gradient-to-r from-[#174082] to-[#018896] p-3.5 flex justify-between items-center text-white">
                <span className="font-bold text-sm tracking-wide">Assistente Virtual Piatec</span>
                <button onClick={() => setIsChatbotOpen(false)} className="hover:bg-white/20 p-1 rounded-md transition cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-50px)]">
                <WizardChatbot />
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsChatbotOpen(!isChatbotOpen)}
            className="bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13356e] hover:to-[#017682] text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer"
            title="Abrir Assistente Virtual"
          >
            <MessageSquare size={26} />
          </button>
        </div>
      </div>

      {/* Modal Redefinir Senha */}
      {isResetPasswordOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Key size={18} className="text-teal-600" />
                Redefinir Senha
              </h3>
              <button onClick={() => setIsResetPasswordOpen(false)} className="text-gray-400 hover:text-red-500 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Digite a nova senha..."
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsResetPasswordOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={isResetting} className="px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md cursor-pointer disabled:opacity-70">
                  {isResetting ? 'Salvando...' : 'Salvar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


