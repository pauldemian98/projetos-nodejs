import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'sonner';
import { useTimerStore } from '../store/timerStore';
import { PlayCircle, PauseCircle, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react';

export const ChamadoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [comentarioTexto, setComentarioTexto] = useState('');
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [isAvaliacaoModalOpen, setIsAvaliacaoModalOpen] = useState(false);
  const [notaComunicacao, setNotaComunicacao] = useState(0);
  const [notaRetorno, setNotaRetorno] = useState(0);
  const [comentario, setComentario] = useState('');
  const [avaliacaoComentario, setAvaliacaoComentario] = useState('');
  const [avaliacaoNota, setAvaliacaoNota] = useState(0);
  const [problemaResolvido, setProblemaResolvido] = useState<boolean | null>(null);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAgent = user && user.papel !== 'EXTERNO';
  const isGestor = user && ['GESTOR', 'ENCARREGADO'].includes(user.papel);

  const { data: chamado, isLoading, error } = useQuery({
    queryKey: ['chamado', id],
    queryFn: async () => {
      const res = await api.get(`/chamados/${id}`);
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const { data: usuariosLista } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data;
    },
    enabled: isAgent,
  });

  const agentesTI = (usuariosLista || []).filter((u: any) => u.papel !== 'EXTERNO' && u.ativo);

  const atribuirResponsavelMutation = useMutation({
    mutationFn: async (novoResponsavelId: string | null) => {
      await api.put(`/chamados/${id}/responsavel`, { novoResponsavelId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
      queryClient.invalidateQueries({ queryKey: ['chamadosAgente'] });
      toast.success('Responsável atualizado com sucesso!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao atribuir responsável');
    }
  });

  const updateSolicitanteOriginalMutation = useMutation({
    mutationFn: async (solicitanteOriginalId: string) => {
      await api.put(`/chamados/${id}/solicitante-original`, { solicitanteOriginalId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
      queryClient.invalidateQueries({ queryKey: ['chamadosAgente'] });
      toast.success('Solicitante Original atualizado');
    }
  });

  const isActive = useTimerStore(state => state.isActive);
  const activeChamadoId = useTimerStore(state => state.activeChamadoId);
  const startTimer = useTimerStore(state => state.startTimer);
  const resetTimer = useTimerStore(state => state.resetTimer);

  const iniciarTrabalhoMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/trabalho/iniciar', { chamadoId: id });
      return res.data.data;
    },
    onSuccess: () => {
      startTimer(id, undefined, chamado?.tempo_gasto_total_segundos || 0);
      toast.success('Atendimento Iniciado!');
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao iniciar trabalho')
  });

  const pausarTrabalhoMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/trabalho/pausar-ou-finalizar', {});
      return res.data.data;
    },
    onSuccess: () => {
      resetTimer();
      toast.success('Atendimento Pausado!');
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erro ao pausar atendimento');
    }
  });

  const updatePrioridadeMutation = useMutation({
    mutationFn: async (prioridade: string) => {
      await api.put(`/chamados/${id}/prioridade`, { prioridade });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
      queryClient.invalidateQueries({ queryKey: ['chamadosAgente'] });
      toast.success('Prioridade atualizada com sucesso');
    }
  });

  const escalonarChamadoMutation = useMutation({
    mutationFn: async (direcao: 'ACIMA' | 'ABAIXO') => {
      await api.post(`/chamados/${id}/escalonar`, { direcao });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
      queryClient.invalidateQueries({ queryKey: ['chamadosAgente'] });
      toast.success('Chamado escalonado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao escalonar chamado');
    }
  });

  const avaliarChamadoMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/chamados/${id}/avaliar-chamado`, { 
        nota_satisfacao: avaliacaoNota, 
        comentario: avaliacaoComentario,
        problema_resolvido: problemaResolvido 
      });
    },
    onSuccess: () => {
      toast.success('Avaliação enviada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao enviar avaliação');
    }
  });

  const avaliarSolicitanteMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/chamados/${id}/avaliar-solicitante`, { nota_comunicacao: notaComunicacao, nota_retorno: notaRetorno });
    },
    onSuccess: () => {
      setIsAvaliacaoModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
      queryClient.invalidateQueries({ queryKey: ['chamadosAgente'] });
      toast.success('Chamado resolvido e avaliação salva com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar avaliação')
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.put(`/chamados/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
      queryClient.invalidateQueries({ queryKey: ['chamadosAgente'] });
      toast.success('Status atualizado com sucesso');
    }
  });

  const addComentarioMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/chamados/${id}/comentarios`, { texto: comentarioTexto });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
      setComentarioTexto('');
      toast.success('Comentário adicionado');
    }
  });

  const addAnexoMutation = useMutation({
    mutationFn: async () => {
      if (!anexoFile) return;
      const payload = new FormData();
      payload.append('anexos', anexoFile);
      await api.post(`/chamados/${id}/anexos`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chamado', id] });
      setAnexoFile(null);
      toast.success('Anexo adicionado');
    }
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'RESOLVIDO') {
      setIsAvaliacaoModalOpen(true);
    } else {
      updateStatusMutation.mutate(e.target.value);
    }
  };

  if (isLoading) return <div className="p-10 text-center">Carregando detalhes do chamado...</div>;
  if (error || !chamado) return <div className="p-10 text-center text-red-600">Erro ao carregar o chamado. Talvez ele não exista.</div>;

  const isConcluido = chamado.status === 'RESOLVIDO' || chamado.status === 'AGUARDANDO_AVALIACAO' || !!chamado.avaliacao;

  const getTicketTag = () => {
    if (!chamado.solicitante || chamado.solicitante.papel === 'EXTERNO') return { label: 'Normal', color: 'bg-gray-100 text-gray-700' };
    if (chamado.responsavel && chamado.solicitante.id === chamado.responsavel.id) return { label: 'Regularização', color: 'bg-purple-100 text-purple-800' };
    
    if (chamado.responsavel) {
      const assistentes = ['ESTAGIARIO', 'ASSISTENTE_1', 'ASSISTENTE_2', 'ASSISTENTE_3'];
      const gestores = ['GESTOR', 'ENCARREGADO'];
      if (gestores.includes(chamado.solicitante.papel) && assistentes.includes(chamado.responsavel.papel)) {
        return { label: 'Normal', color: 'bg-gray-100 text-gray-700' };
      }
    }

    return { label: 'Alinhamento', color: 'bg-indigo-100 text-indigo-800' };
  };

  const getMediaAvaliacao = (user: any) => {
    if (!user || !user.avaliacoesRecebidas || user.avaliacoesRecebidas.length === 0) return null;
    let sum = 0;
    user.avaliacoesRecebidas.forEach((av: any) => sum += (av.nota_comunicacao + av.nota_retorno));
    const media = sum / (user.avaliacoesRecebidas.length * 2);
    return media.toFixed(1);
  };

  const tag = getTicketTag();

  const podeAvaliar = user && (
    isAgent
      ? (user.id === chamado.solicitanteOriginalId || user.id === chamado.solicitanteOriginal?.id)
      : (user.id === chamado.solicitanteId || user.id === chamado.solicitanteOriginalId || user.id === chamado.solicitante?.id || user.id === chamado.solicitanteOriginal?.id)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition font-medium">
          &larr; Voltar
        </button>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-3">
            {chamado.codigo && (
              <span className="bg-[#174082] text-white text-xs font-mono font-bold px-2.5 py-1 rounded-md shadow-xs">
                {chamado.codigo}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-800">{chamado.titulo}</h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${tag.color}`}>
              {tag.label}
            </span>
          </div>
        </div>
        {isAgent && (
          <div className="flex gap-2 items-center">
            <select
              value={chamado.prioridade || 'MEDIA'}
              onChange={(e) => updatePrioridadeMutation.mutate(e.target.value)}
              disabled={updatePrioridadeMutation.isPending || isConcluido}
              className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg font-bold outline-none cursor-pointer hover:bg-gray-50 transition shadow-xs"
            >
              <option value="NORMAL">🟢 Normal</option>
              <option value="MEDIA">🟡 Média</option>
              <option value="PRIORITARIO">🟠 Prioritário</option>
              <option value="EMERGENCIAL">🔴 Emergencial</option>
            </select>
            {!isActive && (
              <button 
                onClick={() => iniciarTrabalhoMutation.mutate()}
                disabled={iniciarTrabalhoMutation.isPending || isConcluido}
                className="flex items-center gap-2 bg-[#018896] hover:bg-[#017784] text-white px-4 py-2 rounded-lg font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <PlayCircle size={18} /> Iniciar Atendimento
              </button>
            )}
            {isActive && activeChamadoId === id && (
              <button 
                onClick={() => pausarTrabalhoMutation.mutate()}
                disabled={pausarTrabalhoMutation.isPending || isConcluido}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <PauseCircle size={18} /> Pausar Atendimento
              </button>
            )}
            {isActive && activeChamadoId !== id && (
              <div className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded font-bold">
                <PlayCircle size={18} className="opacity-50" /> Outro atendimento em andamento
              </div>
            )}
            
            <div className="flex items-center gap-1 border-l pl-2 ml-1">
              <button 
                  onClick={() => escalonarChamadoMutation.mutate('ACIMA')}
                  disabled={isConcluido}
                  className="flex items-center gap-1 bg-[#174082]/10 text-[#174082] hover:bg-[#174082]/20 px-3 py-2 rounded-lg font-semibold transition disabled:opacity-50 cursor-pointer"
                  title="Escalonar nível acima"
                >
                <ArrowUp size={18} /> Subir
              </button>
              <button 
                onClick={() => escalonarChamadoMutation.mutate('ABAIXO')}
                disabled={escalonarChamadoMutation.isPending || isConcluido}
                className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg font-semibold hover:bg-orange-200 transition disabled:opacity-50 cursor-pointer"
                title="Escalonar nível abaixo"
              >
                <ArrowDown size={18} /> Descer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md flex flex-col md:flex-row overflow-hidden border border-gray-200">
        
        {/* Lado Esquerdo: Info e Descrição */}
        <div className="p-6 flex-1">
          {chamado.is_emergencia && (
            <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded text-xs font-bold mb-4">
              EMERGÊNCIA
            </span>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Solicitante (Aberto por)</p>
              <div className="flex items-center gap-2">
                {chamado.solicitante?.id ? (
                  <Link to={`/perfil/${chamado.solicitante.id}`} className="font-semibold text-[#018896] hover:underline">
                    {chamado.solicitante.nome_completo}
                  </Link>
                ) : (
                  <p className="font-medium text-gray-800">N/A</p>
                )}
                {getMediaAvaliacao(chamado.solicitante) && (
                  <span className="text-xs flex items-center text-yellow-500 font-bold bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                    ⭐ {getMediaAvaliacao(chamado.solicitante)}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-200">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs text-purple-700 uppercase tracking-wider font-semibold">Solicitante Original</p>
                {getMediaAvaliacao(chamado.solicitanteOriginal) && (
                  <span className="text-[10px] flex items-center text-yellow-500 font-bold bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                    ⭐ {getMediaAvaliacao(chamado.solicitanteOriginal)}
                  </span>
                )}
              </div>
              {isAgent ? (
                <select 
                  value={chamado.solicitanteOriginal?.id || ''}
                  onChange={(e) => updateSolicitanteOriginalMutation.mutate(e.target.value)}
                  disabled={updateSolicitanteOriginalMutation.isPending || isConcluido}
                  className="w-full mt-1 p-1 border border-purple-300 rounded-md bg-white text-purple-900 font-medium outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                >
                  <option value="">-- Não Definido --</option>
                  {usuariosLista?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.nome_completo}</option>
                  ))}
                </select>
              ) : (
                <p className="font-medium text-purple-900">{chamado.solicitanteOriginal?.nome_completo || 'Não definido'}</p>
              )}
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Responsável</p>
                {isGestor && (
                  <span className="text-[10px] bg-[#174082]/10 text-[#174082] px-2 py-0.5 rounded font-bold">Admin</span>
                )}
              </div>
              {isGestor ? (
                <select
                  value={chamado.responsavelId || ''}
                  onChange={(e) => atribuirResponsavelMutation.mutate(e.target.value || null)}
                  disabled={atribuirResponsavelMutation.isPending || isConcluido}
                  className="w-full mt-1 p-1.5 border border-gray-300 rounded-md bg-white text-gray-800 text-sm font-medium outline-none focus:ring-2 focus:ring-[#018896] cursor-pointer"
                >
                  <option value="">-- Não atribuído --</option>
                  {agentesTI.map((agente: any) => (
                    <option key={agente.id} value={agente.id}>
                      {agente.nome_completo} ({agente.papel})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-medium text-gray-800">{chamado.responsavel?.nome_completo || 'Não atribuído'}</p>
              )}
            </div>
            <div className="bg-[#018896]/10 p-3 rounded-lg border border-[#018896]/20">
              <p className="text-xs text-[#018896] uppercase tracking-wider font-semibold mb-1">Tempo de Atendimento</p>
              <p className="font-bold text-[#174082] text-base">
                {String(Math.floor((chamado.tempo_gasto_total_segundos || 0) / 60)).padStart(2, '0')}:
                {String((chamado.tempo_gasto_total_segundos || 0) % 60).padStart(2, '0')}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Categoria</p>
              <p className="font-medium text-gray-800">
                {chamado.categoria?.nome || 'N/A'}{chamado.subcategoria?.nome ? ` / ${chamado.subcategoria.nome}` : ''}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Status Atual</p>
              {isAgent ? (
                <select 
                  value={chamado.status}
                  onChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending || isConcluido}
                  className="w-full mt-1 p-1 border border-gray-300 rounded-md bg-white text-gray-800 font-medium outline-none focus:ring-2 focus:ring-[#018896]"
                >
                  <option value="ABERTO">Aberto</option>
                  <option value="EM_ANALISE">Em Análise</option>
                  <option value="AGUARDANDO_RESPOSTA">Aguardando Retorno</option>
                  <option value="AGUARDANDO_AVALIACAO">Aguardando Avaliação</option>
                  <option value="RESOLVIDO">Concluído / Resolvido</option>
                </select>
              ) : (
                <p className="font-medium text-gray-800">{chamado.status}</p>
              )}
            </div>
          </div>
          
          {podeAvaliar && chamado.status === 'AGUARDANDO_AVALIACAO' && !chamado.avaliacao && (
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⭐</span>
                <h2 className="text-lg font-bold text-amber-900">Por favor, avalie este atendimento</h2>
              </div>
              <p className="text-xs text-amber-700 mb-4">
                {chamado.solicitanteOriginalId === user.id && chamado.solicitanteId !== user.id
                  ? 'Este chamado foi regularizado/aberto pela equipe técnica em seu nome. Sua avaliação é fundamental para concluí-lo!'
                  : 'Sua nota e comentários ajudam nossa equipe de TI a melhorar continuamente o suporte.'}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">1. Seu problema foi resolvido?</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setProblemaResolvido(true)} 
                    className={`px-5 py-2 rounded-lg font-medium transition cursor-pointer ${problemaResolvido === true ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Sim
                  </button>
                  <button 
                    onClick={() => setProblemaResolvido(false)} 
                    className={`px-5 py-2 rounded-lg font-medium transition cursor-pointer ${problemaResolvido === false ? 'bg-rose-600 text-white shadow-xs' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Não
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">2. Como você avalia esse atendimento?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((nota) => (
                    <button 
                      key={nota}
                      onClick={() => setAvaliacaoNota(nota)}
                      className={`text-2xl transition cursor-pointer ${avaliacaoNota >= nota ? 'text-amber-500 scale-110' : 'text-gray-300 hover:text-amber-400'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">3. Gostaria de deixar algum comentário?</label>
                <textarea 
                  value={avaliacaoComentario}
                  onChange={(e) => setAvaliacaoComentario(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#018896] resize-none"
                  rows={3}
                  placeholder="Deixe seu comentário sobre o atendimento..."
                />
              </div>

              <button 
                onClick={() => avaliarChamadoMutation.mutate()}
                disabled={problemaResolvido === null || avaliacaoNota === 0 || avaliarChamadoMutation.isPending}
                className="bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {avaliarChamadoMutation.isPending ? 'Enviando avaliação...' : 'Enviar Avaliação e Concluir'}
              </button>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Descrição Completa</p>
            <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 whitespace-pre-wrap border min-h-[120px]">
              {chamado.descricao || 'Nenhuma descrição fornecida.'}
            </div>
          </div>

          {chamado.avaliacao && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-5">
              <h3 className="text-green-800 font-bold mb-2 flex items-center gap-2">
                <CheckCircle size={18} /> Atendimento Encerrado e Avaliado
              </h3>
              <p className="text-sm text-green-700 mb-2">Este chamado foi avaliado pelo solicitante e não pode mais ser reaberto ou modificado.</p>
              <div className="flex gap-4 text-sm mt-3 bg-white p-3 rounded border border-green-100">
                <div>
                  <span className="text-gray-500 block text-xs uppercase font-bold">Problema Resolvido?</span>
                  <span className="font-semibold text-gray-800">{chamado.avaliacao.problema_resolvido ? 'Sim' : 'Não'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs uppercase font-bold">Nota (Satisfação)</span>
                  <span className="font-semibold text-yellow-500">{'★'.repeat(chamado.avaliacao.nota_satisfacao)}</span>
                </div>
                {chamado.avaliacao.comentario && (
                  <div className="flex-1">
                    <span className="text-gray-500 block text-xs uppercase font-bold">Comentário</span>
                    <span className="text-gray-800 italic">"{chamado.avaliacao.comentario}"</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Anexos ({chamado.anexos?.length || 0})</p>
            <div className="flex flex-col gap-2 mb-3">
              {chamado.anexos?.map((anexo: any) => {
                const isExterno = !anexo.usuario || anexo.usuario.papel === 'EXTERNO';
                return (
                  <a key={anexo.id} href={`http://localhost:3000${anexo.url_arquivo}`} target="_blank" rel="noreferrer" 
                     className={`hover:underline text-sm border p-3 rounded block w-full truncate flex items-center justify-between gap-2 ${isExterno ? 'bg-gray-50 text-blue-600 border-gray-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>
                    <div className="flex items-center gap-2 truncate">
                      <span>📎</span> <span className="truncate">{anexo.nome_original}</span>
                    </div>
                    {anexo.usuario && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isExterno ? 'bg-gray-200 text-gray-600' : 'bg-blue-200 text-blue-700'}`}>
                        {anexo.usuario.nome_completo} {isExterno ? '' : '(TI)'}
                      </span>
                    )}
                  </a>
                );
              })}
              {!chamado.anexos?.length && <p className="text-sm text-gray-400">Nenhum anexo encontrado.</p>}
            </div>
            
            <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
              <input type="file" onChange={(e) => setAnexoFile(e.target.files?.[0] || null)} disabled={isConcluido} className="text-sm flex-1 bg-white border border-gray-200 p-1.5 rounded-md outline-none" />
              <button 
                onClick={() => addAnexoMutation.mutate()} 
                disabled={!anexoFile || addAnexoMutation.isPending || isConcluido}
                className="bg-[#174082] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#12366f] disabled:opacity-50 transition cursor-pointer"
              >
                {addAnexoMutation.isPending ? 'Enviando...' : 'Adicionar Anexo'}
              </button>
            </div>
          </div>
        </div>

        {/* Lado Direito: Comentários (Fórum) */}
        <div className="w-full md:w-96 flex flex-col bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-white">
            <p className="text-sm text-gray-800 uppercase tracking-wider font-bold">Interações do Chamado</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {chamado.comentarios?.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center mt-10">Sem interações ainda. Seja o primeiro a comentar!</p>
            ) : (
              chamado.comentarios?.map((c: any) => {
                const isExterno = c.usuario?.papel === 'EXTERNO';
                return (
                  <div key={c.id} className={`p-3 rounded-lg border shadow-xs text-sm ${isExterno ? 'bg-white border-gray-200' : 'bg-[#018896]/10 border-[#018896]/25'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <p className={`font-bold ${isExterno ? 'text-gray-800' : 'text-[#174082]'}`}>{c.usuario?.nome_completo} {isExterno ? '' : '(TI)'}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${isExterno ? 'text-gray-500 bg-gray-100' : 'text-[#018896] bg-[#018896]/15'}`}>
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className={`whitespace-pre-wrap ${isExterno ? 'text-gray-700' : 'text-[#174082]'}`}>{c.texto}</p>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-gray-200">
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#018896] focus:border-[#018896] outline-none resize-none shadow-xs" 
              rows={3} 
              placeholder={isConcluido ? "Chamado concluído. Não é possível enviar mensagens." : "Escreva uma nova resposta..."}
              value={comentarioTexto}
              onChange={(e) => setComentarioTexto(e.target.value)}
              disabled={isConcluido}
            ></textarea>
            <button 
              onClick={() => addComentarioMutation.mutate()}
              disabled={!comentarioTexto.trim() || addComentarioMutation.isPending || isConcluido}
              className="w-full bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white font-bold py-2.5 rounded-lg mt-3 transition shadow cursor-pointer disabled:opacity-50"
            >
              {addComentarioMutation.isPending ? 'Enviando...' : 'Enviar Resposta'}
            </button>
          </div>
        </div>

      </div>
      
      {isAvaliacaoModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-100 transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Avaliar Solicitante</h2>
            <p className="text-sm text-gray-600 mb-6">Como você avalia o solicitante deste chamado antes de concluí-lo?</p>
            
            <div className="mb-4">
              <p className="font-medium text-gray-700 mb-2">Comunicação (1 a 5):</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button 
                    key={num} 
                    onClick={() => setNotaComunicacao(num)}
                    disabled={isConcluido}
                    className={`w-10 h-10 rounded-full font-bold transition cursor-pointer ${notaComunicacao === num ? 'bg-[#018896] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="font-medium text-gray-700 mb-2">Retorno/Tempo de Resposta (1 a 5):</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button 
                    key={num} 
                    onClick={() => setNotaRetorno(num)}
                    className={`w-10 h-10 rounded-full font-bold transition ${notaRetorno === num ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsAvaliacaoModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => avaliarSolicitanteMutation.mutate()}
                disabled={notaComunicacao === 0 || notaRetorno === 0 || avaliarSolicitanteMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Salvar e Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
