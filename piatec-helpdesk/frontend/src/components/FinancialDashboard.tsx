import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

export const FinancialDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['pedidosFinanceiro'],
    queryFn: async () => {
      // Passando datas fixas para exemplo do mock
      const res = await api.get('/financeiro/pedidos-medicoes?start=20260724&end=20260724');
      return res.data;
    }
  });

  const chartData = [
    { name: 'Pedidos de Compra', valor: 45000 },
    { name: 'Medições', valor: 32000 }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Proxy Financeiro - Investimento em TI</h2>
      {isLoading ? (
        <p className="text-gray-500">Buscando dados no ERP Protheus...</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
