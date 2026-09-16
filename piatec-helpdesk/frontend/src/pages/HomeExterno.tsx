import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Inbox,
  Search,
  User,
  Star,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface Chamado {
  id: string;
  codigo?: string;
  titulo: string;
  descricao: string;
  prioridade?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  solicitanteId?: string;
  solicitanteOriginalId?: string | null;
  solicitante?: {
    id: string;
    nome_completo: string;
  } | null;
  solicitanteOriginal?: {
    id: string;
    nome_completo: string;
  } | null;
  responsavel?: {
    id: string;
    nome_completo: string;
  } | null;
  categoria?: {
    nome: string;
  };
  subcategoria?: {
    nome: string;
  };
  avaliacao?: {
    nota_atendimento?: number;
    nota?: number;
    comentario?: string;
  } | null;
}

export const HomeExterno = () => {
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const [searchTerm, setSearchTerm] = useState('');
  const [showResolved, setShowResolved] = useState(true);

  const { data: chamados, isLoading } = useQuery<Chamado[]>({
    queryKey: ['chamadosExterno'],
    queryFn: async () => {
      const res = await api.get('/chamados?limit=100');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Funções utilitárias de data
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'Data não informada';
    const cleanStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return dateStr;

    return `${date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })} às ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const formatDateOnly = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDateGroupLabel = (dateStr: string) => {
    if (!dateStr) return 'Data não informada';
    const cleanStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return 'Outras datas';

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();

    if (isSameDay(date, today)) return 'Abertos Hoje';
    if (isSameDay(date, yesterday)) return 'Abertos Ontem';

    return `Abertos em ${date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })}`;
  };

  const getPriorityBadge = (prioridade?: string) => {
    switch (prioridade) {
      case 'EMERGENCIAL':
        return { label: 'Emergencial', bg: 'bg-red-100 text-red-700 border-red-200' };
      case 'PRIORITARIO':
        return { label: 'Prioritário', bg: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'NORMAL':
        return { label: 'Normal', bg: 'bg-gray-100 text-gray-700 border-gray-200' };
      default:
        return { label: 'Média', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ABERTO':
        return { label: 'Em Aberto', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'EM_ANALISE':
        return { label: 'Em Análise', bg: 'bg-[#018896]/10 text-[#018896] border-[#018896]/30 font-medium' };
      case 'AGUARDANDO_RESPOSTA':
        return { label: 'Aguardando Retorno', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'AGUARDANDO_AVALIACAO':
        return { label: 'Aguardando Avaliação', bg: 'bg-orange-50 text-orange-700 border-orange-300' };
      case 'RESOLVIDO':
        return { label: 'Resolvido', bg: 'bg-green-50 text-green-700 border-green-200' };
      case 'PAUSADO':
        return { label: 'Pausado', bg: 'bg-gray-100 text-gray-700 border-gray-200' };
      default:
        return { label: status.replace(/_/g, ' '), bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  // Filtragem e separação dos chamados
  const {
    chamadosAbertos,
    chamadosEmAnalise,
    chamadosAguardandoAvaliacao,
    chamadosResolvidos,
    aguardandoAvaliacaoCount,
  } = useMemo(() => {
    if (!chamados) {
      return {
        chamadosAbertos: [],
        chamadosEmAnalise: [],
        chamadosAguardandoAvaliacao: [],
        chamadosResolvidos: [],
        aguardandoAvaliacaoCount: 0,
      };
    }

    const filtered = chamados.filter((c) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.titulo?.toLowerCase().includes(term) ||
        c.codigo?.toLowerCase().includes(term) ||
        c.descricao?.toLowerCase().includes(term) ||
        c.categoria?.nome?.toLowerCase().includes(term) ||
        c.subcategoria?.nome?.toLowerCase().includes(term)
      );
    });

    const abertos = filtered
      .filter((c) => c.status === 'ABERTO')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const emAnalise = filtered
      .filter((c) => c.status === 'EM_ANALISE' || c.status === 'AGUARDANDO_RESPOSTA' || c.status === 'PAUSADO')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const aguardandoAvaliacao = filtered
      .filter((c) => c.status === 'AGUARDANDO_AVALIACAO')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    const resolvidos = filtered
      .filter((c) => c.status === 'RESOLVIDO')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    return {
      chamadosAbertos: abertos,
      chamadosEmAnalise: emAnalise,
      chamadosAguardandoAvaliacao: aguardandoAvaliacao,
      chamadosResolvidos: resolvidos,
      aguardandoAvaliacaoCount: aguardandoAvaliacao.length,
    };
  }, [chamados, searchTerm]);

  // Agrupa chamados por data de abertura
  const groupTicketsByDate = (tickets: Chamado[]) => {
    const groups: { [key: string]: { label: string; date: Date; items: Chamado[] } } = {};

    tickets.forEach((ticket) => {
      const cleanStr = ticket.createdAt.includes('T') ? ticket.createdAt : ticket.createdAt.replace(' ', 'T');
      const d = new Date(cleanStr);
      const dateKey = !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : 'sem-data';

      if (!groups[dateKey]) {
        groups[dateKey] = {
          label: getDateGroupLabel(ticket.createdAt),
          date: d,
          items: [],
        };
      }
      groups[dateKey].items.push(ticket);
    });

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  // Renderiza um cartão de chamado ativo ou aguardando avaliação
  const renderCard = (c: Chamado, statusType: 'ABERTO' | 'EM_ANALISE' | 'AGUARDANDO_AVALIACAO') => {
    const priority = getPriorityBadge(c.prioridade);
    const status = getStatusBadge(c.status);
    const isAguardando = c.status === 'AGUARDANDO_AVALIACAO';
    const isRegularizacao = !!(c.solicitanteOriginalId && user && c.solicitanteOriginalId === user.id && c.solicitanteId !== user.id);

    return (
      <Link
        key={c.id}
        to={`/chamado/${c.id}`}
        className={`block rounded-xl p-4 transition-all duration-200 group relative ${
          isAguardando
            ? 'bg-amber-50/50 border-2 border-amber-300 shadow-xs hover:shadow-md hover:border-amber-400 hover:bg-amber-50/80'
            : 'bg-white border border-gray-200 shadow-xs hover:shadow-md hover:border-[#018896]/40'
        }`}
      >
        {/* Banner de Ação para Chamados que requerem Avaliação */}
        {isAguardando && (
          <div className="mb-2.5 flex items-center justify-between bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs animate-pulse">
            <span className="flex items-center gap-1.5">
              <Star size={12} className="fill-white" />
              {isRegularizacao ? 'Regularização da TI: Avalie!' : 'Avalie este Atendimento!'}
            </span>
            <span className="text-[10px] underline lowercase">avaliar agora &rarr;</span>
          </div>
        )}

        {/* Cabeçalho do Card: Código, Prioridade e Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {c.codigo && (
              <span className="text-xs font-mono font-bold text-[#174082] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {c.codigo}
              </span>
            )}
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${priority.bg}`}>
              {priority.label}
            </span>
            {isRegularizacao && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
                Regularização
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${status.bg}`}>
            {status.label}
          </span>
        </div>

        {/* Título do Chamado */}
        <h4 className={`font-semibold text-sm mb-1.5 line-clamp-2 transition-colors ${
          isAguardando ? 'text-gray-900 group-hover:text-amber-800' : 'text-gray-900 group-hover:text-[#018896]'
        }`}>
          {c.titulo}
        </h4>

        {/* Descrição resumida */}
        {c.descricao && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {c.descricao}
          </p>
        )}

        {/* Informações de Data de Abertura em Destaque */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <Calendar size={14} className={isAguardando ? 'text-amber-600 shrink-0' : 'text-[#018896] shrink-0'} />
            <span className="font-medium">
              Aberto em:{' '}
              <span className="text-gray-900 font-semibold">{formatDateTime(c.createdAt)}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <User size={12} className="text-gray-400" />
              <span>
                {c.responsavel?.nome_completo ? (
                  <span className="text-gray-700 font-medium">{c.responsavel.nome_completo}</span>
                ) : (
                  <span className="text-amber-600 italic">Aguardando atribuição</span>
                )}
              </span>
            </div>

            <div className={`flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform ${
              isAguardando ? 'text-amber-700' : 'text-[#018896]'
            }`}>
              <span>{isAguardando ? 'Avaliar Chamado' : 'Acessar'}</span>
              <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen space-y-6">
      {/* Banner de Boas-Vindas Institucional Piatec */}
      <div className="bg-gradient-to-r from-[#174082] via-[#12366f] to-[#018896] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <Sparkles size={260} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-200 bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-xs">
              Portal do Solicitante
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Central de Ajuda & Atendimento
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Acompanhe em tempo real seus chamados em andamento e consulte o histórico de chamados resolvidos.
            Para abrir uma nova solicitação, utilize o assistente virtual no canto inferior direito.
          </p>
        </div>
      </div>

      {/* Alerta de Avaliação Pendente (se houver) */}
      {aguardandoAvaliacaoCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2 rounded-lg shrink-0">
              <Star size={20} className="fill-amber-100" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm sm:text-base">
                Você possui {aguardandoAvaliacaoCount} chamado{aguardandoAvaliacaoCount > 1 ? 's' : ''} resolvido{aguardandoAvaliacaoCount > 1 ? 's' : ''} aguardando sua avaliação!
              </h3>
              <p className="text-xs text-amber-700">
                Sua nota nos ajuda a melhorar a agilidade e o atendimento de nossos especialistas.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowResolved(true);
              const el = document.getElementById('secao-resolvidos');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Avaliar Agora
          </button>
        </div>
      )}

      {/* Barra de Busca e Métricas Resumidas */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Campo de Busca */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, título ou assunto..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#018896] focus:border-[#018896] shadow-xs transition"
          />
        </div>

        {/* Resumo Quantitativo */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end text-xs">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Em Aberto: <strong>{chamadosAbertos.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#018896]/10 text-[#018896] border border-[#018896]/25 px-3 py-1.5 rounded-lg font-medium">
            <span className="w-2 h-2 rounded-full bg-[#018896]"></span>
            <span>Em Análise: <strong>{chamadosEmAnalise.length}</strong></span>
          </div>
          <div className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg font-medium transition-colors ${
            chamadosAguardandoAvaliacao.length > 0 
              ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold' 
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
            <Star size={13} className={chamadosAguardandoAvaliacao.length > 0 ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-gray-400'} />
            <span>Aguardando Avaliação: <strong>{chamadosAguardandoAvaliacao.length}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg font-medium">
            <CheckCircle2 size={13} className="text-gray-500" />
            <span>Resolvidos: <strong>{chamadosResolvidos.length}</strong></span>
          </div>
        </div>
      </div>

      {/* QUADRO DE CHAMADOS ATIVOS (EM ABERTO, EM ANÁLISE E AGUARDANDO SUA AVALIAÇÃO) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Clock size={20} className="text-[#018896]" />
              Quadro de Chamados em Andamento
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chamados separados por status e organizados cronologicamente pela data de abertura.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#018896] mb-3"></div>
            <p className="text-sm font-medium">Carregando seus chamados...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* COLUNA 1: CHAMADOS EM ABERTO */}
            <div className="bg-gray-50/70 border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <h3 className="font-bold text-gray-800 text-base">Em Aberto</h3>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {chamadosAbertos.length} {chamadosAbertos.length === 1 ? 'chamado' : 'chamados'}
                </span>
              </div>

              {chamadosAbertos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 rounded-xl bg-white/60 text-gray-400">
                  <Inbox size={36} className="mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">Nenhum chamado em aberto</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Quando você abrir novas solicitações que ainda não foram para análise, elas aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                  {groupTicketsByDate(chamadosAbertos).map((group) => (
                    <div key={group.label} className="space-y-3">
                      {/* Divisor com a Data em que o chamado foi aberto */}
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-emerald-200 flex-1"></div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Calendar size={11} />
                          {group.label}
                        </span>
                        <div className="h-px bg-emerald-200 flex-1"></div>
                      </div>

                      {/* Lista de Chamados dessa data */}
                      <div className="space-y-3">
                        {group.items.map((c) => renderCard(c, 'ABERTO'))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUNA 2: CHAMADOS EM ANÁLISE */}
            <div className="bg-gray-50/70 border border-[#018896]/20 rounded-2xl p-4 sm:p-5 flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#018896]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#018896]"></div>
                  <h3 className="font-bold text-gray-800 text-base">Em Análise</h3>
                </div>
                <span className="bg-[#018896]/10 text-[#018896] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#018896]/30">
                  {chamadosEmAnalise.length} {chamadosEmAnalise.length === 1 ? 'chamado' : 'chamados'}
                </span>
              </div>

              {chamadosEmAnalise.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 rounded-xl bg-white/60 text-gray-400">
                  <Inbox size={36} className="mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">Nenhum chamado em análise</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Chamados que foram atribuídos a um técnico e estão sendo tratados aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                  {groupTicketsByDate(chamadosEmAnalise).map((group) => (
                    <div key={group.label} className="space-y-3">
                      {/* Divisor com a Data em que o chamado foi aberto */}
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-[#018896]/20 flex-1"></div>
                        <span className="text-[11px] font-bold text-[#018896] uppercase tracking-wider bg-[#018896]/10 px-2.5 py-0.5 rounded-full border border-[#018896]/30 flex items-center gap-1">
                          <Calendar size={11} />
                          {group.label}
                        </span>
                        <div className="h-px bg-[#018896]/20 flex-1"></div>
                      </div>

                      {/* Lista de Chamados dessa data */}
                      <div className="space-y-3">
                        {group.items.map((c) => renderCard(c, 'EM_ANALISE'))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUNA 3: AGUARDANDO SUA AVALIAÇÃO */}
            <div className="bg-amber-50/40 border-2 border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col min-h-[480px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-amber-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                  <h3 className="font-bold text-gray-800 text-base flex items-center gap-1.5">
                    <span>Aguardando Avaliação</span>
                    <Star size={16} className="text-amber-500 fill-amber-500" />
                  </h3>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  {chamadosAguardandoAvaliacao.length} {chamadosAguardandoAvaliacao.length === 1 ? 'chamado' : 'chamados'}
                </span>
              </div>

              {chamadosAguardandoAvaliacao.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-amber-200 rounded-xl bg-white/70 text-gray-400">
                  <div className="w-12 h-12 rounded-full bg-amber-100/60 text-amber-500 flex items-center justify-center mb-2 mx-auto">
                    <Star size={24} className="fill-amber-400 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Nenhum chamado pendente de avaliação</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Quando a equipe técnica concluir um atendimento, ele ficará disponível aqui para você dar sua nota.
                  </p>
                </div>
              ) : (
                <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                  {groupTicketsByDate(chamadosAguardandoAvaliacao).map((group) => (
                    <div key={group.label} className="space-y-3">
                      {/* Divisor com a Data em que o chamado foi aberto */}
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-amber-200 flex-1"></div>
                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <Calendar size={11} />
                          {group.label}
                        </span>
                        <div className="h-px bg-amber-200 flex-1"></div>
                      </div>

                      {/* Lista de Chamados aguardando avaliação */}
                      <div className="space-y-3">
                        {group.items.map((c) => renderCard(c, 'AGUARDANDO_AVALIACAO'))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PARTE SEPARADA: CHAMADOS RESOLVIDOS */}
      <div id="secao-resolvidos" className="mt-8 pt-4 border-t-2 border-gray-200">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          {/* Cabeçalho com botão para expandir/recolher */}
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="w-full flex items-center justify-between text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-700 p-2.5 rounded-xl">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                    Chamados Resolvidos
                  </h3>
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {chamadosResolvidos.length}
                  </span>
                  {aguardandoAvaliacaoCount > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {aguardandoAvaliacaoCount} pendente{aguardandoAvaliacaoCount > 1 ? 's' : ''} de avaliação
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Área separada com o histórico de chamados concluídos e suas respectivas avaliações.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 group-hover:text-gray-800">
              <span>{showResolved ? 'Recolher histórico' : 'Expandir histórico'}</span>
              {showResolved ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {/* Conteúdo dos Resolvidos */}
          {showResolved && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              {chamadosResolvidos.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">
                  Nenhum chamado resolvido no histórico até o momento.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chamadosResolvidos.map((c) => {
                    const isAguardando = c.status === 'AGUARDANDO_AVALIACAO';
                    const priority = getPriorityBadge(c.prioridade);

                    return (
                      <Link
                        key={c.id}
                        to={`/chamado/${c.id}`}
                        className={`block border p-5 rounded-xl shadow-2xs hover:shadow-md transition-all duration-200 relative ${
                          isAguardando
                            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-200'
                            : 'bg-white border-gray-200 hover:border-green-300'
                        }`}
                      >
                        {/* Banner se precisa de avaliação */}
                        {isAguardando && (
                          <div className="mb-3 flex items-center justify-between bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Star size={12} className="fill-white" />
                              Avalie este atendimento!
                            </span>
                            <span className="text-[10px] underline lowercase">clique aqui</span>
                          </div>
                        )}

                        {/* Topo do Card */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {c.codigo && (
                              <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                                {c.codigo}
                              </span>
                            )}
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${priority.bg}`}>
                              {priority.label}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isAguardando
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            {isAguardando ? 'Aguard. Avaliação' : 'Resolvido'}
                          </span>
                        </div>

                        {/* Título */}
                        <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                          {c.titulo}
                        </h4>

                        {/* Datas: Abertura e Conclusão */}
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span>
                              Aberto em: <strong>{formatDateTime(c.createdAt)}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-gray-500">
                            <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                            <span>
                              Finalizado em: <strong>{formatDateOnly(c.updatedAt || c.createdAt)}</strong>
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-gray-500">
                              Atendido por: <strong>{c.responsavel?.nome_completo || 'Nenhum'}</strong>
                            </span>

                            {c.avaliacao && (
                              <span className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                ⭐ {c.avaliacao.nota_atendimento || c.avaliacao.nota || 5}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
