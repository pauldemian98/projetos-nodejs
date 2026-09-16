import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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
  BarChart3,
  Filter,
  Timer,
  Tag,
  RotateCcw,
  X,
} from 'lucide-react';

export const AgenteDashboard = () => {
  const navigate = useNavigate();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isGestor = user && ['GESTOR', 'ENCARREGADO'].includes(user.papel);
  const isAssistenteOuAuxiliar = Boolean(
    user && (
      ['ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3'].includes(user.papel) ||
      user.papel?.startsWith('ASSISTENTE') ||
      user.papel === 'ESTAGIARIO' ||
      user.papel?.includes('AUXILIAR')
    )
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMeus, setFilterMeus] = useState<'ALL' | 'MEUS' | 'SEM_RESPONSAVEL' | 'MINHAS_AVALIACOES'>('ALL');
  const [showStats, setShowStats] = useState(true);
  const [showResolved, setShowResolved] = useState(true);

  // Datas para o filtro de período (padrão: sempre últimos 30 dias)
  const getInitialDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const toDateInputString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return {
      startDate: toDateInputString(start),
      endDate: toDateInputString(end),
    };
  };

  const initialDates = useMemo(() => getInitialDates(), []);
  const [dataInicio, setDataInicio] = useState<string>(initialDates.startDate);
  const [dataFim, setDataFim] = useState<string>(initialDates.endDate);
  const [presetPeriodo, setPresetPeriodo] = useState<'30d' | '15d' | '7d' | 'mes' | 'todos' | 'custom'>('30d');

  const handleSelectPreset = (preset: '30d' | '15d' | '7d' | 'mes' | 'todos') => {
    setPresetPeriodo(preset);
    const end = new Date();
    const toDateInputString = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'todos') {
      setDataInicio('');
      setDataFim('');
      return;
    }

    if (preset === 'mes') {
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      setDataInicio(toDateInputString(start));
      setDataFim(toDateInputString(end));
      return;
    }

    const start = new Date();
    const days = preset === '7d' ? 7 : preset === '15d' ? 15 : 30;
    start.setDate(end.getDate() - days);
    setDataInicio(toDateInputString(start));
    setDataFim(toDateInputString(end));
  };

  const handleCustomDateChange = (type: 'inicio' | 'fim', val: string) => {
    setPresetPeriodo('custom');
    if (type === 'inicio') setDataInicio(val);
    else setDataFim(val);
  };

  const resetToDefaultPeriod = () => {
    const { startDate, endDate } = getInitialDates();
    setDataInicio(startDate);
    setDataFim(endDate);
    setPresetPeriodo('30d');
  };

  const isDateInPeriod = (dateStr: string) => {
    if (!dataInicio && !dataFim) return true;
    if (!dateStr) return false;
    const cleanStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return false;

    if (dataInicio) {
      const start = new Date(`${dataInicio}T00:00:00`);
      if (d < start) return false;
    }
    if (dataFim) {
      const end = new Date(`${dataFim}T23:59:59.999`);
      if (d > end) return false;
    }
    return true;
  };

  const { data: chamados, isLoading } = useQuery({
    queryKey: ['chamadosAgente'],
    queryFn: async () => {
      const res = await api.get('/chamados?limit=1000');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: agentesStats } = useQuery({
    queryKey: ['agentesAvaliacao'],
    queryFn: async () => {
      const res = await api.get('/dashboard/agentes-avaliacao');
      return res.data.data;
    },
    enabled: !isAssistenteOuAuxiliar,
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

  const formatTempo = (segundosTotal: number = 0) => {
    const horas = Math.floor(segundosTotal / 3600);
    const minutos = Math.floor((segundosTotal % 3600) / 60);
    const segundos = segundosTotal % 60;

    if (horas > 0) {
      return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    }
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  };

  const getTicketTag = (chamado: any) => {
    if (!chamado.solicitante || chamado.solicitante.papel === 'EXTERNO')
      return { label: 'Normal', color: 'bg-gray-100 text-gray-700' };
    if (chamado.responsavel && chamado.solicitante.id === chamado.responsavel.id)
      return { label: 'Regularização', color: 'bg-purple-100 text-purple-800' };

    if (chamado.responsavel) {
      const assistentes = ['ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3'];
      const gestores = ['GESTOR', 'ENCARREGADO'];
      if (gestores.includes(chamado.solicitante.papel) && assistentes.includes(chamado.responsavel.papel)) {
        return { label: 'Normal', color: 'bg-gray-100 text-gray-700' };
      }
    }

    return { label: 'Alinhamento', color: 'bg-indigo-100 text-indigo-800' };
  };

  // Chamados pertencentes ao período selecionado (padrão: 30 dias)
  const chamadosNoPeriodo = useMemo(() => {
    if (!chamados) return [];
    return chamados.filter((c: any) => isDateInPeriod(c.createdAt));
  }, [chamados, dataInicio, dataFim]);

  // Quantidade de chamados ativos antes do período (alerta para não perder chamados abertos antigos)
  const chamadosAnterioresAoPeriodoCount = useMemo(() => {
    if (!chamados || !dataInicio) return 0;
    const start = new Date(`${dataInicio}T00:00:00`);
    return chamados.filter((c: any) => {
      if (c.status === 'RESOLVIDO') return false;
      const cleanStr = c.createdAt.includes('T') ? c.createdAt : c.createdAt.replace(' ', 'T');
      const d = new Date(cleanStr);
      return !isNaN(d.getTime()) && d < start;
    }).length;
  }, [chamados, dataInicio]);

  const dashboardData = useMemo(() => {
    if (!chamadosNoPeriodo) {
      return {
        statusData: [],
        priorityCounts: {} as any,
        chamadosPorAgenteData: [],
        tempoPorAgenteData: [],
        tipoChamadoData: [],
        totalChamadosNoPeriodo: 0,
      };
    }

    const formatStatus = (s: string) => {
      const map: any = {
        ABERTO: 'Aberto',
        EM_ANALISE: 'Em Análise',
        AGUARDANDO_RESPOSTA: 'Aguard. Retorno',
        AGUARDANDO_AVALIACAO: 'Aguard. Avaliação',
        RESOLVIDO: 'Concluído',
      };
      return map[s] || s;
    };

    // 1. Status
    const statusCounts = chamadosNoPeriodo.reduce((acc: any, c: any) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});
    const statusData = Object.keys(statusCounts).map((k) => ({
      name: formatStatus(k),
      value: statusCounts[k],
    }));

    // 2. Prioridades
    const priorityCounts = chamadosNoPeriodo.reduce((acc: any, c: any) => {
      const p = c.prioridade || 'MEDIA';
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});

    // 3. Normais vs. Regularização
    let countNormal = 0;
    let countRegularizacao = 0;
    let countAlinhamento = 0;

    chamadosNoPeriodo.forEach((c: any) => {
      const tag = getTicketTag(c);
      if (tag.label === 'Normal') countNormal++;
      else if (tag.label === 'Regularização') countRegularizacao++;
      else countAlinhamento++;
    });

    const tipoChamadoData = [
      { name: 'Normal', value: countNormal, color: '#018896' },
      { name: 'Regularização', value: countRegularizacao, color: '#8b5cf6' },
      ...(countAlinhamento > 0 ? [{ name: 'Alinhamento', value: countAlinhamento, color: '#6366f1' }] : []),
    ];

    // 4. Quantidade de Chamados por Agente
    const agenteChamadosMap: { [key: string]: { id: string; nome: string; quantidade: number } } = {};
    chamadosNoPeriodo.forEach((c: any) => {
      const nome = c.responsavel?.nome_completo || 'Não atribuído';
      const id = c.responsavel?.id || 'unassigned';
      if (!agenteChamadosMap[nome]) {
        agenteChamadosMap[nome] = { id, nome, quantidade: 0 };
      }
      agenteChamadosMap[nome].quantidade += 1;
    });
    const chamadosPorAgenteData = Object.values(agenteChamadosMap).sort(
      (a, b) => b.quantidade - a.quantidade
    );

    // 5. Tempo de Atendimento por Agente
    const agenteTempoMap: {
      [key: string]: {
        id: string;
        nome: string;
        totalSegundos: number;
        chamadosCount: number;
      };
    } = {};

    chamadosNoPeriodo.forEach((c: any) => {
      const nome = c.responsavel?.nome_completo || 'Não atribuído';
      const id = c.responsavel?.id || 'unassigned';
      const seg = c.tempo_gasto_total_segundos || 0;
      if (!agenteTempoMap[nome]) {
        agenteTempoMap[nome] = { id, nome, totalSegundos: 0, chamadosCount: 0 };
      }
      agenteTempoMap[nome].totalSegundos += seg;
      agenteTempoMap[nome].chamadosCount += 1;
    });

    const tempoPorAgenteData = Object.values(agenteTempoMap)
      .map((item) => {
        const minutos = Math.round(item.totalSegundos / 60);
        const horas = Number((item.totalSegundos / 3600).toFixed(2));
        const mediaSegundos =
          item.chamadosCount > 0 ? Math.round(item.totalSegundos / item.chamadosCount) : 0;
        return {
          id: item.id,
          nome: item.nome,
          totalSegundos: item.totalSegundos,
          horas,
          minutos,
          chamadosCount: item.chamadosCount,
          tempoTotalFormatado: formatTempo(item.totalSegundos),
          tempoMedioFormatado: formatTempo(mediaSegundos),
        };
      })
      .sort((a, b) => b.totalSegundos - a.totalSegundos);

    return {
      statusData,
      priorityCounts,
      chamadosPorAgenteData,
      tempoPorAgenteData,
      tipoChamadoData,
      totalChamadosNoPeriodo: chamadosNoPeriodo.length,
    };
  }, [chamadosNoPeriodo]);

  const {
    statusData,
    priorityCounts,
    chamadosPorAgenteData,
    tempoPorAgenteData,
    tipoChamadoData,
  } = dashboardData;

  const COLORS = ['#174082', '#018896', '#2563eb', '#f59e0b', '#10b981', '#4a4a49'];

  const getMediaAvaliacao = (solicitanteUser: any) => {
    if (!solicitanteUser || !solicitanteUser.avaliacoesRecebidas || solicitanteUser.avaliacoesRecebidas.length === 0)
      return null;
    let sum = 0;
    solicitanteUser.avaliacoesRecebidas.forEach((av: any) => (sum += av.nota_comunicacao + av.nota_retorno));
    const media = sum / (solicitanteUser.avaliacoesRecebidas.length * 2);
    return media.toFixed(1);
  };

  const getPriorityTag = (prioridade: string) => {
    if (prioridade === 'NORMAL') return { label: 'Normal', color: 'bg-gray-100 text-gray-600' };
    if (prioridade === 'MEDIA') return { label: 'Média', color: 'bg-yellow-100 text-yellow-800' };
    if (prioridade === 'PRIORITARIO') return { label: 'Prioritário', color: 'bg-orange-100 text-orange-800' };
    if (prioridade === 'EMERGENCIAL') return { label: 'Emergencial', color: 'bg-red-100 text-red-800' };
    return { label: 'Média', color: 'bg-yellow-100 text-yellow-800' };
  };

  // Filtragem dos chamados
  const {
    chamadosAbertos,
    chamadosEmAnalise,
    chamadosAguardando,
    chamadosAguardandoAvaliacao,
    chamadosResolvidos,
    aguardandoAvaliacaoCount,
    minhasAvaliacoesPendentesList,
    minhasAvaliacoesPendentesCount,
  } = useMemo(() => {
    if (!chamados) {
      return {
        chamadosAbertos: [],
        chamadosEmAnalise: [],
        chamadosAguardando: [],
        chamadosAguardandoAvaliacao: [],
        chamadosResolvidos: [],
        aguardandoAvaliacaoCount: 0,
        minhasAvaliacoesPendentesList: [],
        minhasAvaliacoesPendentesCount: 0,
      };
    }

    // Se estiver filtrando apenas minhas avaliações, avaliamos todos os chamados para não perder nenhum fora do período
    const baseList = filterMeus === 'MINHAS_AVALIACOES' ? chamados : (chamadosNoPeriodo || []);

    const filtered = baseList.filter((c: any) => {
      // Filtro por texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchTitle = c.titulo?.toLowerCase().includes(term);
        const matchCode = c.codigo?.toLowerCase().includes(term);
        const matchDesc = c.descricao?.toLowerCase().includes(term);
        const matchSolicitante =
          c.solicitante?.nome_completo?.toLowerCase().includes(term) ||
          c.solicitanteOriginal?.nome_completo?.toLowerCase().includes(term);
        const matchResponsavel = c.responsavel?.nome_completo?.toLowerCase().includes(term);
        if (!matchTitle && !matchCode && !matchDesc && !matchSolicitante && !matchResponsavel) {
          return false;
        }
      }

      // Filtro por responsabilidade / autoria / avaliação
      if (filterMeus === 'MEUS' && user) {
        const souResponsavel = c.responsavelId === user.id;
        const souSolicitante = c.solicitanteId === user.id || c.solicitante?.id === user.id;
        const souSolicitanteOriginal = c.solicitanteOriginalId === user.id || c.solicitanteOriginal?.id === user.id;
        if (!souResponsavel && !souSolicitante && !souSolicitanteOriginal) return false;
      } else if (filterMeus === 'MINHAS_AVALIACOES' && user) {
        // Para Agente de TI, SÓ quando for o Solicitante Original!
        const souSolicitanteOriginal = c.solicitanteOriginalId === user.id || c.solicitanteOriginal?.id === user.id;
        const pendenteAvaliacao = c.status === 'AGUARDANDO_AVALIACAO' && !c.avaliacao;
        if (!(souSolicitanteOriginal && pendenteAvaliacao)) return false;
      } else if (filterMeus === 'SEM_RESPONSAVEL') {
        if (c.responsavelId) return false;
      }

      return true;
    });

    const abertos = filtered
      .filter((c: any) => c.status === 'ABERTO')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const emAnalise = filtered
      .filter((c: any) => c.status === 'EM_ANALISE')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const aguardando = filtered
      .filter((c: any) => c.status === 'AGUARDANDO_RESPOSTA' || c.status === 'PAUSADO')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const aguardandoAvaliacao = filtered
      .filter((c: any) => c.status === 'AGUARDANDO_AVALIACAO')
      .sort(
        (a: any, b: any) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );

    const resolvidos = filtered
      .filter((c: any) => c.status === 'RESOLVIDO' || c.status === 'AGUARDANDO_AVALIACAO')
      .sort(
        (a: any, b: any) =>
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
      );

    const countAvaliacao = filtered.filter((c: any) => c.status === 'AGUARDANDO_AVALIACAO').length;

    // Chamados onde o usuário logado de TI é especificamente o Solicitante Original aguardando avaliação
    const todasMinhasAvaliacoes = (chamados || []).filter((c: any) => {
      const souSolicitanteOriginal = user && (c.solicitanteOriginalId === user.id || c.solicitanteOriginal?.id === user.id);
      return souSolicitanteOriginal && c.status === 'AGUARDANDO_AVALIACAO' && !c.avaliacao;
    });

    const minhasAvaliacoesFiltradas = todasMinhasAvaliacoes.filter((c: any) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchTitle = c.titulo?.toLowerCase().includes(term);
        const matchCode = c.codigo?.toLowerCase().includes(term);
        const matchDesc = c.descricao?.toLowerCase().includes(term);
        return matchTitle || matchCode || matchDesc;
      }
      return true;
    });

    return {
      chamadosAbertos: abertos,
      chamadosEmAnalise: emAnalise,
      chamadosAguardando: aguardando,
      chamadosAguardandoAvaliacao: aguardandoAvaliacao,
      chamadosResolvidos: resolvidos,
      aguardandoAvaliacaoCount: countAvaliacao,
      minhasAvaliacoesPendentesList: minhasAvaliacoesFiltradas,
      minhasAvaliacoesPendentesCount: todasMinhasAvaliacoes.length,
    };
  }, [chamados, chamadosNoPeriodo, searchTerm, filterMeus, user]);

  // Agrupa chamados por data de abertura
  const groupTicketsByDate = (tickets: any[]) => {
    const groups: { [key: string]: { label: string; date: Date; items: any[] } } = {};

    tickets.forEach((ticket) => {
      const cleanStr = ticket.createdAt.includes('T') ? ticket.createdAt : ticket.createdAt.replace(' ', 'T');
      const d = new Date(cleanStr);
      const dateKey = !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        : 'sem-data';

      if (!groups[dateKey]) {
        groups[dateKey] = {
          label: getDateGroupLabel(ticket.createdAt),
          date: !isNaN(d.getTime()) ? d : new Date(0),
          items: [],
        };
      }
      groups[dateKey].items.push(ticket);
    });

    return Object.entries(groups)
      .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
      .map(([, group]) => group);
  };

  // Renderiza o card do chamado ativo no Kanban
  const renderCard = (chamado: any, borderColor: string) => {
    const tag = getTicketTag(chamado);
    const pTag = getPriorityTag(chamado.prioridade || 'MEDIA');
    const solicitante = chamado.solicitanteOriginal || chamado.solicitante;
    const isAguardandoAvaliacao = chamado.status === 'AGUARDANDO_AVALIACAO';
    const isMinhaAvaliacaoPendente =
      user &&
      (chamado.solicitanteOriginalId === user.id || chamado.solicitanteOriginal?.id === user.id) &&
      isAguardandoAvaliacao &&
      !chamado.avaliacao;

    return (
      <div
        key={chamado.id}
        onClick={() => navigate(`/chamado/${chamado.id}`)}
        className={`p-4 rounded-xl border border-l-4 transition-all duration-200 group relative cursor-pointer ${
          isMinhaAvaliacaoPendente
            ? 'bg-amber-50/70 border-amber-400 border-l-amber-500 ring-2 ring-amber-300 shadow-sm hover:shadow-md'
            : `bg-white border-gray-200 ${borderColor} shadow-xs hover:shadow-md`
        }`}
      >
        {/* Banner de Destaque se for avaliação pendente do usuário logado */}
        {isMinhaAvaliacaoPendente && (
          <div className="mb-2.5 flex items-center justify-between bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">
            <span className="flex items-center gap-1.5">
              <Star size={13} className="fill-white animate-pulse" />
              Sua Avaliação Pendente!
            </span>
            <span className="bg-white text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Avaliar Agora
            </span>
          </div>
        )}

        {/* Banner informativo caso esteja aguardando avaliação de outro solicitante */}
        {isAguardandoAvaliacao && !isMinhaAvaliacaoPendente && (
          <div className="mb-2 flex items-center justify-between bg-amber-100/80 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200">
            <span className="truncate">
              Aguardando avaliação de {solicitante?.nome_completo || 'Solicitante'}
            </span>
          </div>
        )}

        {/* Cabeçalho do Card */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-1.5 items-center flex-wrap">
            {chamado.codigo && (
              <span className="text-[10px] font-bold font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                {chamado.codigo}
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${pTag.color}`}>
              {pTag.label}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${tag.color}`}>
            {tag.label}
          </span>
        </div>

        {/* Título */}
        <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {chamado.titulo}
        </h3>

        {/* Solicitante */}
        <div className="text-xs text-gray-500 mb-2 flex flex-wrap items-center gap-1">
          <span className="font-medium text-gray-400">Solicitante:</span>
          {solicitante?.id ? (
            <Link
              to={`/perfil/${solicitante.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue-600 hover:underline font-medium"
            >
              {solicitante.nome_completo || 'N/A'}
            </Link>
          ) : (
            <span className="font-medium">{solicitante?.nome_completo || 'N/A'}</span>
          )}
          {chamado.solicitanteOriginal && (
            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1 rounded font-medium ml-1">
              Orig.
            </span>
          )}
          {getMediaAvaliacao(solicitante) && (
            <span className="flex items-center text-amber-500 font-bold ml-1 text-[11px]">
              ⭐ {getMediaAvaliacao(solicitante)}
            </span>
          )}
        </div>

        {/* Informações de Data de Abertura em Destaque */}
        <div className="pt-2.5 border-t border-gray-100 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <Calendar size={13} className="text-[#018896] shrink-0" />
            <span>
              Aberto em: <strong>{formatDateTime(chamado.createdAt)}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between text-gray-500">
            <div className="flex items-center gap-1 truncate max-w-[65%]">
              <User size={12} className="text-gray-400 shrink-0" />
              <span className="truncate">
                {chamado.responsavel?.nome_completo ? (
                  <span className="text-gray-700 font-medium">{chamado.responsavel.nome_completo}</span>
                ) : (
                  <span className="text-amber-600 italic">Não atribuído</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[#018896] font-medium shrink-0">
              <Clock size={12} />
              <span>{formatTempo(chamado.tempo_gasto_total_segundos)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {isGestor ? 'Gestão de Chamados (TI & Admin)' : 'Meus Chamados (TI)'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Painel de controle com separação cronológica de chamados abertos, em análise e área dedicada para resolvidos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <BarChart3 size={16} className="text-[#018896]" />
            <span>{showStats ? 'Ocultar Estatísticas' : 'Exibir Estatísticas'}</span>
          </button>

          <div className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Tempo Real Ativo</span>
          </div>
        </div>
      </div>

      {/* PAINEL DE DESEMPENHO E ESTATÍSTICAS (EXPANSÍVEL) */}
      {showStats && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-5 transition-all space-y-4">
          {/* Cabeçalho do Painel com Filtro por Período */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-[#018896]" />
                Painel de Desempenho e Estatísticas
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Indicadores consolidados • Exibindo <strong>{dashboardData.totalChamadosNoPeriodo}</strong> chamado(s) no período
              </p>
            </div>

            {/* Controles do Filtro de Período (Padrão: 30 dias) */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('30d')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    presetPeriodo === '30d'
                      ? 'bg-[#018896] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  30 Dias (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('15d')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    presetPeriodo === '15d'
                      ? 'bg-[#018896] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  15 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('7d')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    presetPeriodo === '7d'
                      ? 'bg-[#018896] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  7 Dias
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('mes')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    presetPeriodo === 'mes'
                      ? 'bg-[#018896] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  Este Mês
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('todos')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    presetPeriodo === 'todos'
                      ? 'bg-[#018896] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-200/60'
                  }`}
                >
                  Todo Período
                </button>
              </div>

              {/* Inputs de Data Início / Fim */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xl">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span className="text-[11px] text-gray-500 font-medium">De</span>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => handleCustomDateChange('inicio', e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                />
                <span className="text-[11px] text-gray-500 font-medium">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => handleCustomDateChange('fim', e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                />
                {(presetPeriodo !== '30d' || dataInicio !== initialDates.startDate || dataFim !== initialDates.endDate) && (
                  <button
                    type="button"
                    onClick={resetToDefaultPeriod}
                    title="Restaurar padrão (30 dias)"
                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition cursor-pointer ml-1"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Aviso se houver chamados em aberto fora do período */}
          {chamadosAnterioresAoPeriodoCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-amber-600 shrink-0" />
                Atenção: existem <strong>{chamadosAnterioresAoPeriodoCount}</strong> chamado(s) em andamento abertos antes de {formatDateOnly(dataInicio)}.
              </span>
              <button
                type="button"
                onClick={() => handleSelectPreset('todos')}
                className="font-bold underline text-amber-800 hover:text-amber-950 cursor-pointer ml-2"
              >
                Exibir todo o histórico
              </button>
            </div>
          )}

          {/* GRID COM OS 6 GRÁFICOS / INDICADORES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-1">
            {/* 1. Gráfico de Pizza - Status */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                  Chamados por Status
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Volume</span>
              </div>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-xs mt-12">Sem chamados no período</p>
              )}
            </div>

            {/* 2. NOVO: Chamados Normais e Regularização */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                  Normais vs. Regularização
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Tipologia</span>
              </div>
              {tipoChamadoData.length > 0 ? (
                <div className="w-full flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={tipoChamadoData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {tipoChamadoData.map((entry: any, index: number) => (
                          <Cell key={`tipo-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number, name: string) => {
                          const total = tipoChamadoData.reduce((acc: number, cur: any) => acc + cur.value, 0);
                          const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                          return [`${val} (${pct}%)`, name];
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-2 mt-1 text-[11px] flex-wrap">
                    {tipoChamadoData.map((item: any) => (
                      <span
                        key={item.name}
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        {item.name}: <strong>{item.value}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-xs mt-12">Sem chamados no período</p>
              )}
            </div>

            {/* 3. Contagem por Prioridade */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col">
              <div className="w-full flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                  Contagem por Prioridade
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Urgência</span>
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1">
                {Object.keys(priorityCounts).map((pri) => (
                  <div
                    key={pri}
                    className="bg-white p-3 rounded-lg shadow-2xs border border-gray-100 flex flex-col justify-center items-center text-center"
                  >
                    <p className="text-[11px] text-gray-500 font-bold uppercase mb-1">{pri}</p>
                    <p className="text-xl font-bold text-gray-900">{priorityCounts[pri]}</p>
                  </div>
                ))}
                {Object.keys(priorityCounts).length === 0 && (
                  <p className="text-gray-400 text-xs col-span-2 text-center my-auto">Nenhum chamado no período.</p>
                )}
              </div>
            </div>

            {/* 4. NOVO: Quantidade de Chamados por Agente */}
            {!isAssistenteOuAuxiliar && (
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Chamados por Agente
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">Volume</span>
                </div>
                {chamadosPorAgenteData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={chamadosPorAgenteData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        width={95}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(name) => (name.length > 13 ? `${name.substring(0, 12)}...` : name)}
                      />
                      <Tooltip
                        formatter={(val: number) => [`${val} chamado(s)`, 'Total']}
                        cursor={{ fill: 'rgba(1, 136, 150, 0.05)' }}
                      />
                      <Bar dataKey="quantidade" fill="#018896" barSize={18} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-xs mt-12 text-center">Nenhum chamado no período</p>
                )}
              </div>
            )}

            {/* 5. NOVO: Tempo de Atendimento por Agente */}
            {!isAssistenteOuAuxiliar && (
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Tempo de Atendimento
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">Por Agente</span>
                </div>
                {tempoPorAgenteData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={tempoPorAgenteData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => (v >= 60 ? `${(v / 60).toFixed(1)}h` : `${v}m`)}
                      />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        width={95}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(name) => (name.length > 13 ? `${name.substring(0, 12)}...` : name)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-white p-2.5 rounded-lg shadow-md border border-gray-200 text-xs space-y-1">
                                <p className="font-bold text-gray-800">{d.nome}</p>
                                <p className="text-gray-600">
                                  Tempo Total: <span className="font-semibold text-blue-600">{d.tempoTotalFormatado}</span>
                                </p>
                                <p className="text-gray-600">
                                  Média por Chamado: <span className="font-semibold text-emerald-600">{d.tempoMedioFormatado}</span>
                                </p>
                                <p className="text-gray-500 text-[11px]">{d.chamadosCount} chamado(s) atendido(s)</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="minutos" fill="#174082" barSize={18} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-xs mt-12 text-center">Nenhum atendimento no período</p>
                )}
              </div>
            )}

            {/* 6. Gráfico de Barras - Avaliação dos Agentes */}
            {!isAssistenteOuAuxiliar && (
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                    Avaliação Média por Agente
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">Satisfação</span>
                </div>
                {agentesStats && agentesStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart
                      data={agentesStats}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        width={95}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(name) => (name.length > 13 ? `${name.substring(0, 12)}...` : name)}
                      />
                      <Tooltip cursor={{ fill: 'transparent' }} formatter={(val: number) => [val, 'Avaliação Média']} />
                      <Bar dataKey="media" fill="#EAB308" barSize={18} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-xs mt-12 text-center">Nenhuma avaliação encontrada</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerta de Avaliações Pendentes do Usuário */}
      {minhasAvaliacoesPendentesCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
              <Star size={22} className="fill-white animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                Você possui {minhasAvaliacoesPendentesCount} chamado(s) pendente(s) da sua avaliação!
                <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ação Necessária
                </span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Como solicitante ou solicitante original (regularização), sua avaliação é fundamental para concluir o chamado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterMeus(filterMeus === 'MINHAS_AVALIACOES' ? 'ALL' : 'MINHAS_AVALIACOES')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs ${
              filterMeus === 'MINHAS_AVALIACOES'
                ? 'bg-amber-950 text-white hover:bg-black'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            <Star size={14} className="fill-white" />
            <span>
              {filterMeus === 'MINHAS_AVALIACOES'
                ? 'Exibir Todos os Chamados'
                : `Filtrar Minhas Avaliações (${minhasAvaliacoesPendentesCount})`}
            </span>
          </button>
        </div>
      )}

      {/* BARRA DE PESQUISA, FILTROS E CONTADORES (MODERNO E MINIMALISTA) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-5 space-y-3.5 transition-all">
        {/* Linha Superior: Campo de Pesquisa, Filtro de Atribuição e Período */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca Principal */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar chamado por código, título, solicitante ou responsável..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50/70 hover:bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#018896]/20 focus:border-[#018896] transition shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition cursor-pointer"
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controles de Filtro e Indicador de Período */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            {/* Filtro de atribuição estilizado */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={filterMeus}
                onChange={(e: any) => setFilterMeus(e.target.value)}
                className="w-full sm:w-auto appearance-none pl-8 pr-8 py-2.5 bg-gray-50/70 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#018896]/20 focus:border-[#018896] transition cursor-pointer shadow-2xs"
              >
                <option value="ALL">Todos os Chamados</option>
                <option value="MEUS">Meus Atendimentos e Chamados</option>
                {minhasAvaliacoesPendentesCount > 0 && (
                  <option value="MINHAS_AVALIACOES">
                    ⭐ Minhas Avaliações ({minhasAvaliacoesPendentesCount})
                  </option>
                )}
                <option value="SEM_RESPONSAVEL">Sem Atendente</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Indicador de Período Ativo */}
            <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 shrink-0 shadow-2xs">
              <Calendar size={13} className="text-[#018896]" />
              <span className="text-slate-500 font-normal">Período:</span>
              <span className="font-semibold text-slate-800">
                {presetPeriodo === 'todos' || (!dataInicio && !dataFim)
                  ? 'Todo Histórico'
                  : `${formatDateOnly(dataInicio)} a ${formatDateOnly(dataFim)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Linha Inferior: Badges de Status e Métricas Minimalistas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Badge Abertos */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Abertos: <strong className="font-bold text-emerald-950">{chamadosAbertos.length}</strong></span>
            </div>

            {/* Badge Em Análise */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#018896]/10 border border-[#018896]/20 text-[#018896] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#018896]"></span>
              <span>Em Análise: <strong className="font-bold text-[#016874]">{chamadosEmAnalise.length}</strong></span>
            </div>

            {/* Badge Aguardando Retorno */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/70 border border-purple-200/70 text-purple-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>Aguard. Retorno: <strong className="font-bold text-purple-950">{chamadosAguardando.length}</strong></span>
            </div>

            {/* Badge / Botão Interativo Minhas Avaliações */}
            {minhasAvaliacoesPendentesCount > 0 && (
              <button
                type="button"
                onClick={() => setFilterMeus(filterMeus === 'MINHAS_AVALIACOES' ? 'ALL' : 'MINHAS_AVALIACOES')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  filterMeus === 'MINHAS_AVALIACOES'
                    ? 'bg-amber-500 text-white shadow-xs font-semibold'
                    : 'bg-amber-50/90 hover:bg-amber-100/90 border border-amber-300 text-amber-900'
                }`}
                title="Clique para alternar o filtro de chamados aguardando sua avaliação"
              >
                <Star
                  size={13}
                  className={filterMeus === 'MINHAS_AVALIACOES' ? 'text-white fill-white' : 'text-amber-500 fill-amber-500'}
                />
                <span>
                  Minhas Avaliações: <strong className={filterMeus === 'MINHAS_AVALIACOES' ? 'text-white font-bold' : 'text-amber-950 font-bold'}>{minhasAvaliacoesPendentesCount}</strong>
                </span>
              </button>
            )}

            {/* Badge / Botão Resolvidos */}
            <button
              type="button"
              onClick={() => {
                setShowResolved(true);
                const el = document.getElementById('secao-resolvidos');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50/90 hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium transition cursor-pointer"
              title="Clique para expandir e navegar até o histórico de chamados resolvidos"
            >
              <CheckCircle2 size={13} className="text-gray-500" />
              <span>Resolvidos: <strong className="font-bold text-gray-900">{chamadosResolvidos.length}</strong></span>
            </button>
          </div>

          {/* Botão para Limpar Filtros Ativos */}
          {(searchTerm || filterMeus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterMeus('ALL');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#018896] transition cursor-pointer font-medium self-end sm:self-auto py-1 px-2.5 rounded-lg hover:bg-gray-50"
            >
              <RotateCcw size={12} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* QUADRO DE CHAMADOS ATIVOS (KANBAN: ABERTO, EM ANÁLISE, AGUARDANDO RETORNO) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-[#018896]" />
              Quadro de Chamados em Andamento
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Chamados ativos separados por status e agrupados cronologicamente pela data de abertura.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#018896] mb-3"></div>
            <p className="text-sm font-medium">Carregando quadro de chamados...</p>
          </div>
        ) : filterMeus === 'MINHAS_AVALIACOES' ? (
          <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Star size={20} className="text-amber-500 fill-amber-500" />
                  Chamados Pendentes da Sua Avaliação (Solicitante Original)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Chamados em que você é o Solicitante Original aguardando sua avaliação de atendimento para conclusão.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFilterMeus('ALL')}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto"
              >
                Voltar ao Quadro Geral
              </button>
            </div>

            {minhasAvaliacoesPendentesList.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Star size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-600">Nenhum chamado pendente de avaliação encontrado.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Você não possui chamados como Solicitante Original aguardando avaliação no momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {minhasAvaliacoesPendentesList.map((c: any) => renderCard(c, 'border-amber-400'))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* COLUNA 1: ABERTO */}
            <div className="bg-gray-50/80 border border-emerald-100 rounded-2xl p-4 flex flex-col min-h-[520px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-emerald-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Aberto</h3>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {chamadosAbertos.length}
                </span>
              </div>

              {chamadosAbertos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-xl bg-white/60 text-gray-400">
                  <Inbox size={32} className="mb-2 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-600">Nenhum chamado aberto</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  {groupTicketsByDate(chamadosAbertos).map((group) => (
                    <div key={group.label} className="space-y-2.5">
                      {/* Divisor com a Data em que o chamado foi aberto */}
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-emerald-200 flex-1"></div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Calendar size={10} />
                          {group.label}
                        </span>
                        <div className="h-px bg-emerald-200 flex-1"></div>
                      </div>

                      {/* Lista de Chamados dessa data */}
                      <div className="space-y-2.5">
                        {group.items.map((c) => renderCard(c, 'border-emerald-500'))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUNA 2: EM ANÁLISE */}
            <div className="bg-gray-50/80 border border-[#018896]/20 rounded-2xl p-4 flex flex-col min-h-[520px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#018896]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#018896]"></div>
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Em Análise</h3>
                </div>
                <span className="bg-[#018896]/10 text-[#018896] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#018896]/30">
                  {chamadosEmAnalise.length}
                </span>
              </div>

              {chamadosEmAnalise.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-xl bg-white/60 text-gray-400">
                  <Inbox size={32} className="mb-2 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-600">Nenhum chamado em análise</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  {groupTicketsByDate(chamadosEmAnalise).map((group) => (
                    <div key={group.label} className="space-y-2.5">
                      {/* Divisor com a Data em que o chamado foi aberto */}
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-[#018896]/20 flex-1"></div>
                        <span className="text-[10px] font-bold text-[#018896] uppercase tracking-wider bg-[#018896]/10 px-2.5 py-0.5 rounded-full border border-[#018896]/30 flex items-center gap-1">
                          <Calendar size={10} />
                          {group.label}
                        </span>
                        <div className="h-px bg-[#018896]/20 flex-1"></div>
                      </div>

                      {/* Lista de Chamados dessa data */}
                      <div className="space-y-2.5">
                        {group.items.map((c) => renderCard(c, 'border-[#018896]'))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COLUNA 3: AGUARDANDO RETORNO */}
            <div className="bg-gray-50/80 border border-purple-100 rounded-2xl p-4 flex flex-col min-h-[520px]">
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-purple-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Aguard. Retorno</h3>
                </div>
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {chamadosAguardando.length}
                </span>
              </div>

              {chamadosAguardando.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-xl bg-white/60 text-gray-400">
                  <Inbox size={32} className="mb-2 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-600">Nenhum chamado aguardando retorno</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                  {groupTicketsByDate(chamadosAguardando).map((group) => (
                    <div key={group.label} className="space-y-2.5">
                      {/* Divisor com a Data em que o chamado foi aberto */}
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-purple-200 flex-1"></div>
                        <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                          <Calendar size={10} />
                          {group.label}
                        </span>
                        <div className="h-px bg-purple-200 flex-1"></div>
                      </div>

                      {/* Lista de Chamados dessa data */}
                      <div className="space-y-2.5">
                        {group.items.map((c) => renderCard(c, 'border-purple-500'))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PARTE SEPARADA: CHAMADOS RESOLVIDOS / CONCLUÍDOS */}
      {filterMeus !== 'MINHAS_AVALIACOES' && (
        <div id="secao-resolvidos" className="mt-8 pt-4 border-t-2 border-gray-200">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          {/* Cabeçalho com controle para expandir/recolher */}
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
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                    Chamados Resolvidos / Concluídos
                  </h3>
                  <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {chamadosResolvidos.length}
                  </span>
                  {aguardandoAvaliacaoCount > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {aguardandoAvaliacaoCount} aguardando avaliação
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Área dedicada e separada com o histórico de chamados finalizados, tempo gasto e avaliações.
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
                  Nenhum chamado resolvido encontrado no histórico com os filtros atuais.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chamadosResolvidos.map((c: any) => {
                    const isAguardando = c.status === 'AGUARDANDO_AVALIACAO';
                    const tag = getTicketTag(c);
                    const pTag = getPriorityTag(c.prioridade || 'MEDIA');
                    const solicitante = c.solicitanteOriginal || c.solicitante;
                    const isMinhaAvaliacao =
                      user &&
                      (c.solicitanteOriginalId === user.id || c.solicitanteOriginal?.id === user.id) &&
                      isAguardando &&
                      !c.avaliacao;

                    return (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/chamado/${c.id}`)}
                        className={`border p-4 rounded-xl shadow-2xs hover:shadow-md cursor-pointer transition-all duration-200 relative ${
                          isMinhaAvaliacao
                            ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300'
                            : isAguardando
                            ? 'bg-amber-50/60 border-amber-300'
                            : 'bg-white border-gray-200 hover:border-green-300'
                        }`}
                      >
                        {/* Status de Avaliação */}
                        {isAguardando && (
                          <div className={`mb-2.5 flex items-center justify-between text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                            isMinhaAvaliacao ? 'bg-amber-500 shadow-2xs' : 'bg-amber-600'
                          }`}>
                            <span className="flex items-center gap-1">
                              {isMinhaAvaliacao && <Star size={12} className="fill-white" />}
                              {isMinhaAvaliacao ? 'Sua Avaliação Pendente - Avaliar Agora' : 'Aguardando Avaliação do Solicitante'}
                            </span>
                          </div>
                        )}

                        {/* Topo do Card */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-1.5 items-center flex-wrap">
                            {c.codigo && (
                              <span className="text-[10px] font-mono font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                                {c.codigo}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${pTag.color}`}>
                              {pTag.label}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                              isAguardando
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {isAguardando ? 'Aguard. Avaliação' : 'Resolvido'}
                          </span>
                        </div>

                        {/* Título */}
                        <h4 className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-2">
                          {c.titulo}
                        </h4>

                        {/* Solicitante */}
                        <p className="text-xs text-gray-500 mb-2 truncate">
                          <strong>Solicitante:</strong> {solicitante?.nome_completo || 'N/A'}
                        </p>

                        {/* Datas e Detalhes */}
                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
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

                          <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[11px]">
                            <span className="text-gray-500 truncate max-w-[55%]">
                              Resp: <strong>{c.responsavel?.nome_completo || 'Nenhum'}</strong>
                            </span>

                            <div className="flex items-center gap-2">
                              <span className="text-blue-600 font-medium">
                                ⏱ {formatTempo(c.tempo_gasto_total_segundos)}
                              </span>

                              {c.avaliacao && (
                                <span className="flex items-center gap-0.5 text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  ⭐ {c.avaliacao.nota_atendimento || c.avaliacao.nota || 5}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
