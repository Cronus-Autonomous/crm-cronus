import { Droppable } from '@hello-pangea/dnd';
import OpportunityCard from './OpportunityCard';
import { formatCurrency } from '@/lib/crm-utils';
import { cn } from '@/lib/utils';

export default function KanbanColumn({ stage, opportunities, onEdit, onClose, users }) {
  const total = opportunities.length;
  const sum = opportunities.reduce((acc, o) => acc + Number(o.value || 0), 0);

  return (
    <Droppable droppableId={stage.id}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.droppableProps}
          className={cn('flex h-full w-[280px] shrink-0 flex-col rounded-lg border border-border bg-muted/30',
            snapshot.isDraggingOver && 'ring-2 ring-primary/40 bg-primary/5 backdrop-blur-sm')}>
          <div className="flex items-center justify-between gap-2 border-b border-border bg-card/80 px-3 py-2.5 backdrop-blur">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{stage.name}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{total}</span>
            </div>
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">{formatCurrency(sum)}</span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5">
            {opportunities.map((o, index) => (
              <OpportunityCard key={o.id} opportunity={o} index={index} onEdit={onEdit} onClose={onClose} users={users} />
            ))}
            {provided.placeholder}
            {total === 0 && <p className="px-2 py-6 text-center text-xs text-muted-foreground">Sem oportunidades</p>}
          </div>
        </div>
      )}
    </Droppable>
  );
}