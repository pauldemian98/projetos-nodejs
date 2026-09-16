import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.papel === 'EXTERNO') {
          navigate('/painel-externo', { replace: true });
        } else if (user.papel === 'GESTOR' || user.papel === 'ENCARREGADO') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/painel-agente', { replace: true });
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, senha });
      const { token, user } = res.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(`Bem-vindo, ${user.nome_completo}!`);

      // Redirecionamento Dinâmico por Papel
      if (user.papel === 'EXTERNO') {
        navigate('/painel-externo');
      } else if (user.papel === 'GESTOR' || user.papel === 'ENCARREGADO') {
        navigate('/admin');
      } else {
        navigate('/painel-agente');
      }

    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#174082]/10 via-slate-50 to-[#018896]/10 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100 border-t-4 border-t-[#018896] relative overflow-hidden">
        {/* Detalhe de fundo sutil */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#018896]/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#174082] tracking-tight">
            PIATEC
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-[#018896] mt-1">
            Suporte TI
          </p>
          <p className="text-xs text-[#4a4a49] mt-2">
            Acesse sua conta para gerenciar e abrir chamados
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a4a49] mb-1.5">
              E-mail
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@piatec.com"
              className="w-full px-3.5 py-2.5 text-sm text-[#1d1d1b] bg-white border border-gray-200 rounded-lg shadow-xs outline-none focus:border-[#018896] focus:ring-2 focus:ring-[#018896]/20 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4a4a49] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input 
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm text-[#1d1d1b] bg-white border border-gray-200 rounded-lg shadow-xs outline-none focus:border-[#018896] focus:ring-2 focus:ring-[#018896]/20 transition-all pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#018896] transition-colors cursor-pointer"
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-2 bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            Entrar
          </button>
        </form>

        <div className="mt-8 text-center text-[11px] text-[#9d9d9c]">
          Piatec &copy; {new Date().getFullYear()} &bull; Desenvolvido por colaboradores para colaboradores
        </div>
      </div>
    </div>
  );
};
