import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';

export default function KanbanBoard({ stages, opportunities, onMove, onEdit, onClose, users }) {
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onMove(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto px-4 pb-4 lg:px-6">
        {stages.map((stage) => {
          const ops = opportunities.filter((o) => o.stage_id === stage.id);
          return (
            <KanbanColumn key={stage.id} stage={stage} opportunities={ops} onEdit={onEdit} onClose={onClose} users={users} />
          );
        })}
        {stages.length === 0 && (
          <p className="px-2 py-10 text-sm text-muted-foreground">Nenhuma etapa configurada. {`Peça ao admin para criar etapas.`}</p>
        )}
      </div>
    </DragDropContext>
  );
}