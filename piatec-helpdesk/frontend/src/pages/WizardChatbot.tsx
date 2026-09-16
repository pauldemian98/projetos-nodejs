import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';

export const WizardChatbot = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    titulo: '',
    categoriaId: '',
    subcategoriaId: '',
    descricao: '',
    solicitanteOriginalId: '',
  });
  const [anexo, setAnexo] = useState<File | null>(null);
  const [categoriasLista, setCategoriasLista] = useState<any[]>([]);
  const [showWarningAnexo, setShowWarningAnexo] = useState(false);
  const [usuariosLista, setUsuariosLista] = useState<any[]>([]);

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAgent = user && user.papel !== 'EXTERNO';

  // Hook para persistência (Rascunho no localStorage)
  useEffect(() => {
    api.get('/categorias').then(res => setCategoriasLista(res.data.data)).catch(console.error);
    if (isAgent) {
      api.get('/users').then(res => setUsuariosLista(res.data.data)).catch(console.error);
    }
    const draft = localStorage.getItem('draft_chamado');
    if (draft) {
      setFormData(JSON.parse(draft));
    }
  }, [isAgent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const newForm = { ...formData, [e.target.name]: e.target.value };
    setFormData(newForm);
    localStorage.setItem('draft_chamado', JSON.stringify(newForm));
  };

  const handlePreSubmit = () => {
    if (!anexo && !showWarningAnexo) {
      setShowWarningAnexo(true);
      return;
    }
    submitChamado();
  };

  const submitChamado = async () => {
    try {
      // Obrigatório o envio via FormData para comportar os arquivos
      const payload = new FormData();
      payload.append('titulo', formData.titulo);
      payload.append('categoriaId', formData.categoriaId);
      if (formData.subcategoriaId) {
        payload.append('subcategoriaId', formData.subcategoriaId);
      }
      payload.append('descricao', formData.descricao);
      payload.append('prioridade', 'MEDIA'); // hardcoded pro MVP
      if (formData.solicitanteOriginalId) {
        payload.append('solicitanteOriginalId', formData.solicitanteOriginalId);
      }
      
      if (anexo) {
        payload.append('anexos', anexo); // multer lá no back pegará o .array('anexos')
      }

      const res = await api.post('/chamados', payload);

      if (res.status === 201 || res.status === 200) {
        toast.success('Chamado aberto com sucesso!');
        localStorage.removeItem('draft_chamado'); // Limpa rascunho apenas no sucesso HTTP
        setStep(4); // Fim do Wizard
      }
    } catch (error: any) {
      console.error("Erro completo:", error.response || error);
      let msg = error.response?.data?.error || error.message || 'Falha ao abrir chamado';
      if (error.response?.data?.details) {
        msg += ': ' + JSON.stringify(error.response.data.details);
      }
      toast.error(`Erro: ${msg}`);
    }
  };

  return (
    <div className="bg-white p-4">
      <div className="text-[#018896] font-bold mb-4 text-xs uppercase tracking-wider">Assistente Virtual &bull; Passo {step} de 3</div>

      <div className="space-y-6">
        {step === 1 && (
          <div className="animate-fade-in">
            <p className="font-medium text-gray-700 mb-2">Olá! Por favor, resuma em poucas palavras o problema (Título).</p>
            <input 
              name="titulo" value={formData.titulo} onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-xs outline-none focus:ring-2 focus:ring-[#018896] focus:border-[#018896] mb-4 text-sm"
              placeholder="Ex: Teclado não funciona..."
              minLength={5}
            />
            {isAgent && (
              <div className="mb-4">
                <p className="font-medium text-gray-700 mb-2">Foi solicitado por outro usuário? (Opcional - para Regularização)</p>
                <select 
                  name="solicitanteOriginalId" value={formData.solicitanteOriginalId} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-xs outline-none text-sm"
                >
                  <option value="">-- Selecione o Solicitante Original --</option>
                  {usuariosLista.map(u => <option key={u.id} value={u.id}>{u.nome_completo}</option>)}
                </select>
              </div>
            )}
            <button onClick={() => { if (formData.titulo.trim().length < 5) { toast.error('O título deve ter no mínimo 5 caracteres.'); return; } setStep(2); }} className="mt-4 bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-xs transition cursor-pointer">Avançar</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <p className="font-medium text-gray-700 mb-2">Qual categoria se encaixa melhor?</p>
            <select 
              name="categoriaId" value={formData.categoriaId} onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-xs outline-none mb-4 text-sm"
            >
              <option value="">-- Selecione a Categoria --</option>
              {categoriasLista.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome} {cat.prefixo ? `(${cat.prefixo})` : ''}
                </option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium cursor-pointer">Voltar</button>
              <button 
                onClick={() => setStep(3)} 
                className={`px-6 py-2.5 rounded-lg font-bold text-sm shadow-xs transition cursor-pointer ${!formData.categoriaId ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white'}`}
                disabled={!formData.categoriaId}
              >
                Avançar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <p className="font-medium text-gray-700 mb-2">Quase lá! Descreva os detalhes e anexe evidências (print/vídeo).</p>
            <textarea 
              name="descricao" value={formData.descricao} onChange={handleChange}
              className="w-full p-3 h-32 border border-gray-300 rounded-lg shadow-xs outline-none mb-4 text-sm focus:ring-2 focus:ring-[#018896]"
              placeholder="Descreva o que está ocorrendo detalhadamente..."
            />
            
            <input 
              type="file" 
              onChange={(e) => {
                setAnexo(e.target.files ? e.target.files[0] : null);
                setShowWarningAnexo(false);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg mb-6 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#018896]/10 file:text-[#018896] hover:file:bg-[#018896]/20 cursor-pointer"
            />

            {showWarningAnexo && (
              <div className="bg-amber-50 text-amber-900 p-4 rounded-xl mb-4 text-xs border border-amber-200">
                <strong>Atenção:</strong> Você não anexou nenhuma evidência. Anexar prints ou vídeos auxilia e muito na rápida identificação e solução do problema. Quer mesmo enviar sem anexo?
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setStep(2); setShowWarningAnexo(false); }} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium cursor-pointer">Voltar</button>
              <button onClick={() => { if (formData.descricao.trim().length < 10) { toast.error('A descrição deve ter no mínimo 10 caracteres.'); return; } handlePreSubmit(); }} className="bg-gradient-to-r from-[#174082] to-[#018896] hover:from-[#13366f] hover:to-[#017682] text-white px-6 py-2.5 rounded-lg hover:opacity-95 font-bold text-sm shadow-xs transition cursor-pointer">
                {showWarningAnexo ? 'Sim, enviar sem anexo' : 'Enviar Chamado'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-green-600">Chamado Enviado com Sucesso! ✅</h2>
            <p className="text-gray-600 mt-2">Você pode acompanhar o status pela sua dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
};







