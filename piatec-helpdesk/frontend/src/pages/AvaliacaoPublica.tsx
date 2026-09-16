import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'sonner';

export const AvaliacaoPublica = () => {
  const { id } = useParams(); // ID do Chamado pego pela URL
  const [nota, setNota] = useState<number>(0);
  const [comentario, setComentario] = useState('');
  const [enviado, setEnviado] = useState(false);

  const submeterAvaliacao = async () => {
    if (nota === 0) {
      toast.error('Por favor, selecione uma nota de 1 a 5 estrelas!');
      return;
    }

    try {
      // POST público para o backend gravar na tabela AvaliacaoChamado
      await api.post(`/chamados/${id}/avaliar`, { nota_satisfacao: nota, comentario });
      setEnviado(true);
      toast.success('Avaliação enviada com sucesso!');
    } catch (error) {
      toast.error('Ocorreu um erro ao enviar sua avaliação.');
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow text-center max-w-sm">
          <div className="text-4xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-gray-800">Obrigado!</h2>
          <p className="text-gray-500 mt-2">Seu feedback é fundamental para nós.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded shadow-lg max-w-md w-full border-t-8 border-blue-600">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Avalie o Atendimento</h2>
        <p className="text-gray-500 mb-8 text-sm">Como você classifica a resolução do seu chamado?</p>

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((estrela) => (
            <button 
              key={estrela} 
              onClick={() => setNota(estrela)}
              className={`text-5xl transition-transform hover:scale-110 ${nota >= estrela ? 'text-yellow-400' : 'text-gray-200'}`}
            >
              ★
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Comentário Adicional (Opcional)</label>
          <textarea 
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Deixe um elogio ou sugestão..."
            className="w-full p-3 border rounded shadow-sm outline-none focus:border-blue-500 h-24"
          />
        </div>

        <button 
          onClick={submeterAvaliacao}
          className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition"
        >
          Enviar Avaliação
        </button>
      </div>
    </div>
  );
};
