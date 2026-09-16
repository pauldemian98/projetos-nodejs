import axios from 'axios';

export const getPedidos = async (dataInicio: string, dataFim: string) => {
  const baseUrl = process.env.EXTERNAL_FINANCIAL_API || 'https://piacentinido114560.protheus.cloudtotvs.com.br:4050/rest';
  const url = `${baseUrl}/compras_pbi/pedidos/${dataInicio}/${dataFim}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.warn('Erro ao conectar na API Financeira. Retornando dados em mock.', error.message);
    return {
      mock: true,
      message: 'API Externa indisponível temporariamente',
      pedidos: [{ id: '123', status: 'Aprovado' }]
    };
  }
};
