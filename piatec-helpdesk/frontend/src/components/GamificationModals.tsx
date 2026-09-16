import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { isToday, parseISO } from 'date-fns';
import api from '../api/axios';

export const GamificationModals = ({ user }: { user: any }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPremiacaoModal, setShowPremiacaoModal] = useState<any>(null);

  useEffect(() => {
    // 1. Verificação de Aniversário
    if (user?.data_nascimento) {
      const birthDate = parseISO(user.data_nascimento);
      if (isToday(birthDate)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 10000); // Para após 10s
      }
    }

    // 2. Verificação de Prêmio Recebido (Agente)
    const checkAward = async () => {
      try {
        const res = await api.get(`/gamificacao/minhas-premiacoes`);
        if (res.data.length > 0 && !res.data[0].lida) {
          setShowPremiacaoModal(res.data[0]);
        }
      } catch (err) {
        // ignora
      }
    };
    checkAward();
  }, [user]);

  return (
    <>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}
      
      {showPremiacaoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md text-center shadow-xl">
            <h2 className="text-3xl font-bold text-yellow-500 mb-4">🏆 Parabéns!</h2>
            <p className="text-gray-700 text-lg mb-6">
              Você foi eleito o <strong>Agente do Mês ({showPremiacaoModal.mes_referencia})</strong>!
            </p>
            <div className="bg-gray-50 italic p-4 rounded text-gray-600 mb-6">
              "{showPremiacaoModal.mensagem_elogio}"
            </div>
            <button 
              onClick={() => setShowPremiacaoModal(null)} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Comemorar!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
