import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'sonner';

export const EditUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}`);
      return res.data.data;
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: any) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
      navigate('/admin');
    },
    onError: () => {
      toast.error('Erro ao atualizar usuário');
    }
  });

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      nome_completo: formData.get('nome_completo'),
      email: formData.get('email'),
      ativo: formData.get('ativo') === 'true',
      papel: formData.get('papel'),
    };
    const senha = formData.get('senha');
    if (senha) {
      data['senha'] = senha;
    }
    updateUserMutation.mutate(data);
  };

  if (isLoading) return <div className="p-6">Carregando usuário...</div>;
  if (isError || !user) return <div className="p-6 text-red-600">Erro ao carregar usuário.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Editar Usuário</h1>
        <button 
          onClick={() => navigate('/admin')}
          className="text-gray-600 hover:underline"
        >
          Voltar
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input type="text" name="nome_completo" defaultValue={user.nome_completo} className="mt-1 block w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input type="email" name="email" defaultValue={user.email} className="mt-1 block w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nova Senha (deixe em branco para não alterar)</label>
            <input type="password" name="senha" className="mt-1 block w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="ativo" defaultValue={user.ativo ? 'true' : 'false'} className="mt-1 block w-full border rounded p-2">
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Papel</label>
            <select name="papel" defaultValue={user.papel} className="mt-1 block w-full border rounded p-2">
              <option value="GESTOR">Gestor</option>
              <option value="ENCARREGADO">Encarregado</option>
              <option value="ASSISTENTE_1">Assistente</option>
              <option value="ESTAGIARIO">Auxiliar</option>
              {/* Optional, in case the user has other roles not in the list above */}
              <option value="EXTERNO">Externo</option>
              <option value="ASSISTENTE_2">Assistente 2</option>
              <option value="ASSISTENTE_3">Assistente 3</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => navigate('/admin')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};
