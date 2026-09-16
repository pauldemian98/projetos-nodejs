import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export const PerfilUsuario = () => {
  const { id } = useParams<{ id: string }>();

  const { data: perfil, isLoading, error } = useQuery({
    queryKey: ['perfil', id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}/perfil`);
      return res.data.data;
    }
  });

  if (isLoading) return <div className="p-10 text-center">Carregando perfil...</div>;
  if (error || !perfil) return <div className="p-10 text-center text-red-600">Erro ao carregar o perfil.</div>;

  const allChamados = [
    ...(perfil.chamadosSolicitados || []),
    ...(perfil.chamadosSolicitadosOriginal || [])
  ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getMediaAvaliacao = () => {
    if (!perfil.avaliacoesRecebidas || perfil.avaliacoesRecebidas.length === 0) return 'N/A';
    let sum = 0;
    perfil.avaliacoesRecebidas.forEach((av: any) => sum += (av.nota_comunicacao + av.nota_retorno));
    const media = sum / (perfil.avaliacoesRecebidas.length * 2);
    return media.toFixed(1);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{perfil.nome_completo}</h1>
            <p className="text-gray-500 mt-1">{perfil.email} &bull; {perfil.papel}</p>
          </div>
          <div className="text-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 font-bold uppercase tracking-wider mb-1">Avaliação Média</p>
            <p className="text-3xl font-bold text-yellow-600 flex justify-center items-center gap-2">
              ⚭ {getMediaAvaliacao()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Últimas Avaliações Recebidas</h2>
          {perfil.avaliacoesRecebidas?.length === 0 ? (
            <p className="text-gray-500 italic">Nenhuma avaliação recebida.</p>
          ) : (
            <div className="space-y-4">
              {perfil.avaliacoesRecebidas.map((av: any) => (
                <div key={av.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between mb-1">
                    <p className="font-semibold text-gray-700">Por {av.agente.nome_completo}</p>
                    <span className="text-xs text-gray-400">{new Date(av.createdAt.replace('T', ' ').replace('Z', '')).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Chamado: <strong>{av.chamado?.titulo || 'Desconhecido'}</strong></p>
                  <div className="flex gap-4">
                    <p className="text-sm"><span className="text-gray-500">Comunicação:</span> <strong className="text-yellow-600">{av.nota_comunicacao}</strong></p>
                    <p className="text-sm"><span className="text-gray-500">Retorno:</span> <strong className="text-yellow-600">{av.nota_retorno}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Últimos Chamados (Histórico)</h2>
          {allChamados.length === 0 ? (
            <p className="text-gray-500 italic">Nenhum chamado encontrado.</p>
          ) : (
            <div className="space-y-3">
              {allChamados.map((c: any) => (
                <Link key={c.id} to={`/chamado/${c.id}`} className="block border p-3 rounded hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">
                      {c.codigo && <span className="text-gray-500 mr-2 text-xs">{c.codigo}</span>}
                      {c.titulo}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">{c.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(c.createdAt.replace('T', ' ').replace('Z', '')).toLocaleDateString()} &bull; Responsável: {c.responsavel?.nome_completo || 'Nenhum'}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
