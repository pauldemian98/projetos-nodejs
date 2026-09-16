import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'sonner';

export const CreateUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRaw = localStorage.getItem('user');
  const loggedUser = userRaw ? JSON.parse(userRaw) : null;
  const isGestor = loggedUser?.papel === 'GESTOR' || loggedUser?.papel === 'ENCARREGADO';

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post(`/admin/users`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
      navigate('/admin');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Erro ao criar usuário';
      toast.error(msg);
    }
  });

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      nome_completo: formData.get('nome_completo'),
      email: formData.get('email'),
      ativo: formData.get('ativo') === 'true',
      papel: formData.get('papel'),
    };
    createUserMutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Criar Novo Usuário</h1>
        <button 
          onClick={() => navigate('/admin')}
          className="text-gray-600 hover:underline"
        >
          Voltar
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
            <input type="text" name="nome_completo" className="mt-1 block w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input type="email" name="email" className="mt-1 block w-full border rounded p-2" required />
            <p className="text-xs text-gray-500 mt-1">Uma senha de 12 caracteres será gerada aleatoriamente e enviada para este e-mail.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Papel</label>
            <select name="papel" defaultValue="EXTERNO" className="mt-1 block w-full border rounded p-2">
              {isGestor && (
                <>
                  <option value="GESTOR">Gestor</option>
                  <option value="ENCARREGADO">Encarregado</option>
                  <option value="ASSISTENTE_1">Assistente</option>
                  <option value="ESTAGIARIO">Auxiliar</option>
                </>
              )}
              <option value="EXTERNO">Externo</option>
              {isGestor && (
                <>
                  <option value="ASSISTENTE_2">Assistente 2</option>
                  <option value="ASSISTENTE_3">Assistente 3</option>
                </>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="ativo" defaultValue="true" className="mt-1 block w-full border rounded p-2">
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => navigate('/admin')} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
            <button type="submit" disabled={createUserMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {createUserMutation.isPending ? 'Salvando...' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
