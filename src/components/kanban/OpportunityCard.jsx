import { Draggable } from '@hello-pangea/dnd';
import { MessageCircle, Mail, Pencil, MoreVertical, Trophy } from 'lucide-react';
import { formatCurrency, relativeTime, TEMPERATURES } from '@/lib/crm-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const TEMP_COLOR = { cold: 'bg-status-cold', warm: 'bg-status-warm', hot: 'bg-status-hot' };

export default function OpportunityCard({ opportunity: o, index, onEdit, onClose, users }) {
  const temp = TEMPERATURES[o.temperature] || TEMPERATURES.frio;
  const owner = users.find((u) => u.id === o.owner_id);

  return (
    <Draggable draggableId={o.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          className={cn('group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
            snapshot.isDragging && 'shadow-lg ring-2 ring-primary/30')}>
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[0.9375rem] font-semibold leading-tight text-foreground">{o.company_name}</h4>
            <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', TEMP_COLOR[temp.token])} title={temp.label} />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={cn('rounded-full px-1.5 py-0.5 text-[0.6875rem] font-medium',
              o.has_site ? 'bg-primary/10 text-primary' : 'border border-border text-muted-foreground')}>
              {o.has_site ? 'Com Site' : 'Sem Site'}
            </span>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(o.value)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[0.6875rem] font-semibold text-muted-foreground">
                {(owner?.full_name || owner?.email || '?').charAt(0).toUpperCase()}
              </div>
              <span className="truncate text-xs text-muted-foreground">{owner?.full_name || '—'}</span>
            </div>
            <span className="text-[0.6875rem] text-muted-foreground">{relativeTime(o.last_fup_date || o.created_date)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-status-whatsapp"
                onClick={() => window.open(`https://api.whatsapp.com/send?phone=${(o.phone || '').replace(/\D/g, '')}`, '_blank')}>
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
              {o.email && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`mailto:${o.email}`)}>
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(o)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onClose(o)} className="gap-2 text-status-won">
                  <Trophy className="h-3.5 w-3.5" /> Encerrar (Ganha/Perdida)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </Draggable>
  );
}