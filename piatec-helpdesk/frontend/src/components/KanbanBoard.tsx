import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Play, Square } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

const COLUMNS = [
  { id: 'REQUISITOS', title: 'Requisitos Levantados' },
  { id: 'NECESSITA_ETAPA_ANTERIOR', title: 'Necessita de Etapa Anterior' },
  { id: 'EM_DESENVOLVIMENTO', title: 'Em Desenvolvimento' },
  { id: 'EM_TESTE', title: 'Em Teste / Aguardando Validação' },
  { id: 'CONCLUIDO', title: 'Concluído' },
];

interface Tarefa {
  id: string;
  titulo: string;
  status: string;
}

export const KanbanBoard = ({ tarefasIniciais }: { tarefasIniciais: Tarefa[] }) => {
  const [tarefas, setTarefas] = useState<Tarefa[]>(tarefasIniciais);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) => api.patch(`/tarefas/${data.id}/status`, { status: data.status }),
    onMutate: async (newData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tarefas'] });
      const previousTarefas = queryClient.getQueryData(['tarefas']);
      setTarefas((prev) => prev.map(t => t.id === newData.id ? { ...t, status: newData.status } : t));
      return { previousTarefas };
    },
    onError: (err, newData, context: any) => {
      setTarefas(context.previousTarefas);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    }
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    updateStatusMutation.mutate({ id: draggableId, status: newStatus });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 p-4 overflow-x-auto min-h-[500px]">
        {COLUMNS.map((column) => {
          const colTarefas = tarefas.filter(t => t.status === column.id);

          return (
            <div key={column.id} className="bg-gray-100 p-4 rounded-lg w-80 shrink-0">
              <h2 className="font-bold text-gray-700 mb-4">{column.title}</h2>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[200px]">
                    {colTarefas.map((tarefa, index) => (
                      <Draggable key={tarefa.id} draggableId={tarefa.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-4 mb-2 rounded shadow-sm border border-gray-200 flex flex-col gap-2"
                          >
                            <span className="font-medium text-gray-800">{tarefa.titulo}</span>
                            <div className="flex gap-2 mt-2">
                              <button className="text-green-600 hover:bg-green-50 p-1 rounded"><Play size={16}/></button>
                              <button className="text-red-600 hover:bg-red-50 p-1 rounded"><Square size={16}/></button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
