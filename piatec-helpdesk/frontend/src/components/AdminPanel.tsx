import React, { useState } from 'react';
import { Users, LayoutList, Settings, Plus, Trash2, ArrowUp, ArrowDown, Edit2, Tag, X, Check, Hash } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const AdminPanel = () => {
  const userRaw = localStorage.getItem('user');
  const loggedUser = userRaw ? JSON.parse(userRaw) : null;
  const isGestor = loggedUser?.papel === 'GESTOR' || loggedUser?.papel === 'ENCARREGADO';

  const [activeTab, setActiveTab] = useState<'USERS' | 'CATEGORIES' | 'ESCALONAMENTO'>('USERS');
  
  // Modal e Formulário de Categoria
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catModalMode, setCatModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [currentCatId, setCurrentCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({
    nome: '',
    prefixo: '',
    cor: '#3b82f6'
  });

  const colorOptions = [
    { label: 'Azul', value: '#3b82f6' },
    { label: 'Esmeralda', value: '#10b981' },
    { label: 'Âmbar', value: '#f59e0b' },
    { label: 'Vermelho', value: '#ef4444' },
    { label: 'Roxo', value: '#8b5cf6' },
    { label: 'Rosa', value: '#ec4899' },
    { label: 'Ciano', value: '#06b6d4' },
    { label: 'Índigo', value: '#6366f1' },
    { label: 'Ardósia', value: '#64748b' },
  ];

  const queryClient = useQueryClient();
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.data;
    }
  });

  const { data: escalonamentoData, isLoading: escalonamentoLoading } = useQuery({
    queryKey: ['config', 'escalonamento'],
    queryFn: async () => {
      const res = await api.get('/config/escalonamento');
      return res.data.data;
    }
  });
  const [ordemEscalonamento, setOrdemEscalonamento] = useState<string[]>([]);
  const [isEditingEscalonamento, setIsEditingEscalonamento] = useState(false);

  React.useEffect(() => {
    if (escalonamentoData && !isEditingEscalonamento) {
      setOrdemEscalonamento(escalonamentoData);
    }
  }, [escalonamentoData, isEditingEscalonamento]);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const res = await api.get('/categorias');
      return res.data.data;
    }
  });

  const openCreateCategory = () => {
    setCatModalMode('CREATE');
    setCurrentCatId(null);
    setCatForm({ nome: '', prefixo: '', cor: '#3b82f6' });
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat: any) => {
    setCatModalMode('EDIT');
    setCurrentCatId(cat.id);
    setCatForm({
      nome: cat.nome || '',
      prefixo: cat.prefixo || '',
      cor: cat.cor || '#3b82f6'
    });
    setIsCatModalOpen(true);
  };

  const salvarCategoriaMutation = useMutation({
    mutationFn: async (data: { id?: string | null; nome: string; prefixo: string; cor: string }) => {
      if (data.id) {
        return await api.put(`/categorias/${data.id}`, {
          nome: data.nome,
          prefixo: data.prefixo,
          cor: data.cor
        });
      } else {
        return await api.post('/categorias', {
          nome: data.nome,
          prefixo: data.prefixo,
          cor: data.cor
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success(vars.id ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
      setIsCatModalOpen(false);
      setCatForm({ nome: '', prefixo: '', cor: '#3b82f6' });
      setCurrentCatId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao salvar categoria');
    }
  });

  const deletarCategoriaMutation = useMutation({
    mutationFn: (catId: string) => api.delete(`/categorias/${catId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoria excluída com sucesso!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao excluir categoria');
    }
  });

  const handleSalvarCategoriaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.nome.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }
    salvarCategoriaMutation.mutate({
      id: currentCatId,
      nome: catForm.nome.trim(),
      prefixo: catForm.prefixo ? catForm.prefixo.trim().toUpperCase() : '',
      cor: catForm.cor
    });
  };

  const handleDeleteCategoria = (cat: any) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${cat.nome}"?`)) {
      deletarCategoriaMutation.mutate(cat.id);
    }
  };

  const salvarEscalonamentoMutation = useMutation({
    mutationFn: (ordem: string[]) => api.put('/config/escalonamento', { ordem }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'escalonamento'] });
      toast.success('Ordem de escalonamento atualizada!');
      setIsEditingEscalonamento(false);
    }
  });

  const handleSalvarEscalonamento = () => {
    salvarEscalonamentoMutation.mutate(ordemEscalonamento);
  };

  const rolesDisponiveis = ["GESTOR", "ENCARREGADO", "ASSISTENTE_1", "ASSISTENTE_2", "ASSISTENTE_3", "ESTAGIARIO", "EXTERNO"];
  const papelLabels: Record<string, string> = {
    "GESTOR": "Gestor",
    "ENCARREGADO": "Encarregado",
    "ASSISTENTE_1": "Assistente 1",
    "ASSISTENTE_2": "Assistente 2",
    "ASSISTENTE_3": "Assistente 3",
    "ESTAGIARIO": "Auxiliar / Estagiário",
    "EXTERNO": "Externo"
  };



  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Painel do TI</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-6 py-3 text-sm transition-colors cursor-pointer ${activeTab === 'USERS' ? 'border-b-2 border-[#018896] text-[#018896] font-bold' : 'font-medium text-gray-500 hover:text-gray-700'}`}
        >
          <Users size={18} /> Usuários
        </button>
        <button 
          onClick={() => setActiveTab('CATEGORIES')}
          className={`flex items-center gap-2 px-6 py-3 text-sm transition-colors cursor-pointer ${activeTab === 'CATEGORIES' ? 'border-b-2 border-[#018896] text-[#018896] font-bold' : 'font-medium text-gray-500 hover:text-gray-700'}`}
        >
          <LayoutList size={18} /> Categorias
        </button>
        {isGestor && (
          <button 
            onClick={() => setActiveTab('ESCALONAMENTO')}
            className={`flex items-center gap-2 px-6 py-3 text-sm transition-colors cursor-pointer ${activeTab === 'ESCALONAMENTO' ? 'border-b-2 border-[#018896] text-[#018896] font-bold' : 'font-medium text-gray-500 hover:text-gray-700'}`}
          >
            <Settings size={18} /> Escalonamento
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 min-h-[400px]">
        {activeTab === 'USERS' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gestão de Usuários</h2>
                <p className="text-sm text-gray-500">Usuários cadastrados no banco de dados.</p>
              </div>
              <Link to="/admin/users/new" className="flex items-center gap-2 bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0">
                <Plus size={16} /> Novo Usuário
              </Link>
            </div>
            
            {usersLoading ? <p className="text-sm text-gray-400">Carregando...</p> : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-3">Nome</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Papel</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="p-3 font-medium text-gray-800">{u.nome_completo}</td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3"><span className="bg-[#018896]/10 text-[#018896] px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#018896]/20">{u.papel}</span></td>
                      <td className="p-3">
                        <span className={u.ativo ? 'text-emerald-600 font-semibold text-xs' : 'text-rose-600 font-semibold text-xs'}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isGestor && (
                          <Link 
                            to={`/admin/users/edit/${u.id}`}
                            className="text-[#018896] text-sm hover:underline font-semibold"
                          >
                            Alterar
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'CATEGORIES' && (
          <div className="space-y-6">
            {/* Header com Ação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Gestão de Categorias</h2>
                  <span className="text-xs bg-[#018896]/10 text-[#018896] font-semibold px-2.5 py-0.5 rounded-full border border-[#018896]/20">
                    {categories?.length || 0} {categories?.length === 1 ? 'categoria' : 'categorias'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Defina as categorias de atendimento e os prefixos para numeração sequencial automática dos chamados (ex: <code className="bg-gray-100 text-gray-700 px-1 py-0.5 rounded text-xs">PRT-001</code>).
                </p>
              </div>
              <button 
                onClick={openCreateCategory} 
                className="flex items-center gap-2 bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus size={16} /> Nova Categoria
              </button>
            </div>

            {/* Listagem de Categorias */}
            {categoriesLoading ? (
              <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-400">
                <div className="w-8 h-8 border-2 border-[#018896] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm">Carregando categorias...</p>
              </div>
            ) : !categories || categories.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#018896]/10 text-[#018896] flex items-center justify-center mx-auto mb-3">
                  <LayoutList size={24} />
                </div>
                <h3 className="font-bold text-gray-800 text-base mb-1">Nenhuma categoria cadastrada</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  Crie sua primeira categoria para organizar os chamados e gerar códigos sequenciais personalizados.
                </p>
                <button 
                  onClick={openCreateCategory}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
                >
                  <Plus size={16} /> Cadastrar Categoria
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/70 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold text-xs tracking-wider uppercase">
                        <th className="py-3.5 px-4 w-12">Cor</th>
                        <th className="py-3.5 px-4">Nome da Categoria</th>
                        <th className="py-3.5 px-4">Prefixo / Código</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categories.map((c: any) => (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <span 
                              className="block w-4 h-4 rounded-full shadow-xs ring-2 ring-white" 
                              style={{ backgroundColor: c.cor || '#3b82f6' }}
                              title={c.cor || '#3b82f6'}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-gray-900 text-sm">{c.nome}</span>
                          </td>
                          <td className="py-4 px-4">
                            {c.prefixo ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-100">
                                  {c.prefixo}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">
                                  (ex: {c.prefixo}-001)
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                Sem prefixo (usa sigla automática)
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Ativa
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => openEditCategory(c)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Editar Categoria"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategoria(c)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Excluir Categoria"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Minimalista de Criação / Edição de Categoria */}
            {isCatModalOpen && (
              <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden transform transition-all">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Tag size={18} />
                      </div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {catModalMode === 'CREATE' ? 'Nova Categoria' : 'Editar Categoria'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setIsCatModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSalvarCategoriaSubmit} className="p-6 space-y-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                        Nome da Categoria *
                      </label>
                      <input 
                        type="text" 
                        value={catForm.nome}
                        onChange={e => setCatForm({ ...catForm, nome: e.target.value })}
                        placeholder="Ex: ERP TOTVS Protheus, Office 365"
                        required
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        autoFocus
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                          Prefixo do Chamado
                        </label>
                        <span className="text-[11px] text-gray-400">Opcional (Ex: PRT, OFF, INF)</span>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Hash size={16} />
                        </div>
                        <input 
                          type="text" 
                          value={catForm.prefixo}
                          onChange={e => setCatForm({ ...catForm, prefixo: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                          placeholder="Ex: PRT"
                          maxLength={6}
                          className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                      </div>
                      
                      {/* Preview do Código Gerado */}
                      <div className="mt-2 bg-gray-50 border border-gray-200/70 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">Exemplo de chamado gerado:</span>
                        <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                          {(catForm.prefixo || (catForm.nome ? catForm.nome.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'CAT'))}-001
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                        Cor de Identificação
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {colorOptions.map((opt) => (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() => setCatForm({ ...catForm, cor: opt.value })}
                            className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center shadow-xs ${catForm.cor === opt.value ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'}`}
                            style={{ backgroundColor: opt.value }}
                            title={opt.label}
                          >
                            {catForm.cor === opt.value && <Check size={14} className="text-white drop-shadow-xs" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 flex gap-3 justify-end border-t border-gray-100">
                      <button 
                        type="button"
                        onClick={() => setIsCatModalOpen(false)}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={salvarCategoriaMutation.isPending || !catForm.nome.trim()}
                        className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50"
                      >
                        {salvarCategoriaMutation.isPending ? 'Salvando...' : 'Salvar Categoria'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ESCALONAMENTO' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold">Ordem de Escalonamento</h2>
                <p className="text-sm text-gray-500">Defina a hierarquia de papéis. O chamado sempre sobe para o próximo nível da lista caso seja escalonado.</p>
              </div>
              {!isEditingEscalonamento ? (
                <button 
                  onClick={() => setIsEditingEscalonamento(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Edit2 size={16} /> Editar Ordem
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setIsEditingEscalonamento(false);
                      setOrdemEscalonamento(escalonamentoData || []);
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSalvarEscalonamento}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Check size={16} /> Salvar Alterações
                  </button>
                </div>
              )}
            </div>

            {escalonamentoLoading ? <p>Carregando configuração...</p> : (
              <div className="max-w-2xl bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  {ordemEscalonamento.map((papel, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white p-3 border rounded shadow-sm">
                      <div className="bg-gray-100 text-gray-500 font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm">
                        {index + 1}
                      </div>
                      
                      {isEditingEscalonamento ? (
                        <div className="flex-1 flex items-center gap-2">
                          <select 
                            value={papel}
                            onChange={e => {
                              const newOrdem = [...ordemEscalonamento];
                              newOrdem[index] = e.target.value;
                              setOrdemEscalonamento(newOrdem);
                            }}
                            className="flex-1 border p-2 rounded text-sm bg-white"
                          >
                            {rolesDisponiveis.map(r => (
                              <option key={r} value={r}>{papelLabels[r]}</option>
                            ))}
                          </select>
                          
                          <div className="flex flex-col gap-1 ml-2">
                            <button 
                              disabled={index === 0}
                              onClick={() => {
                                const newOrdem = [...ordemEscalonamento];
                                const temp = newOrdem[index];
                                newOrdem[index] = newOrdem[index - 1];
                                newOrdem[index - 1] = temp;
                                setOrdemEscalonamento(newOrdem);
                              }}
                              className="text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              disabled={index === ordemEscalonamento.length - 1}
                              onClick={() => {
                                const newOrdem = [...ordemEscalonamento];
                                const temp = newOrdem[index];
                                newOrdem[index] = newOrdem[index + 1];
                                newOrdem[index + 1] = temp;
                                setOrdemEscalonamento(newOrdem);
                              }}
                              className="text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-500"
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => {
                              const newOrdem = [...ordemEscalonamento];
                              newOrdem.splice(index, 1);
                              setOrdemEscalonamento(newOrdem);
                            }}
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Remover Nível"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 font-medium text-gray-700">
                          {papelLabels[papel] || papel}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {isEditingEscalonamento && (
                  <button 
                    onClick={() => {
                      setOrdemEscalonamento([...ordemEscalonamento, "EXTERNO"]);
                    }}
                    className="mt-4 flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium w-full justify-center border-2 border-dashed border-blue-200 py-3 rounded-lg hover:border-blue-400 bg-blue-50/50 transition-colors"
                  >
                    <Plus size={16} /> Adicionar Nível
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
