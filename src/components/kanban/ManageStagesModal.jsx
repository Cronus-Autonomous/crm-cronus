import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';

export default function ManageStagesModal({ open, onClose, stages, onRefresh }) {
  const [list, setList] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (open) setList([...stages].sort((a, b) => a.order - b.order));
  }, [open, stages]);

  const refresh = async () => {
    await onRefresh();
    const fresh = await base44.entities.Stage.list('order', 100);
    setList(fresh || []);
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const a = list[index];
    const b = list[target];
    const next = [...list];
    next[index] = { ...a, order: b.order };
    next[target] = { ...b, order: a.order };
    setList(next.sort((x, y) => x.order - y.order));
    try {
      await Promise.all([
        base44.entities.Stage.update(a.id, { order: b.order }),
        base44.entities.Stage.update(b.id, { order: a.order }),
      ]);
      toast.success('Ordem atualizada');
      refresh();
    } catch {
      toast.error('Erro ao reordenar');
    }
  };

  const add = async () => {
    if (!newName.trim()) return toast.error('Informe o nome da etapa');
    try {
      await base44.entities.Stage.create({ name: newName.trim(), order: list.length });
      setNewName('');
      toast.success('Etapa criada');
      refresh();
    } catch {
      toast.error('Erro ao criar etapa');
    }
  };

  const remove = async (stage) => {
    try {
      await base44.entities.Stage.delete(stage.id);
      toast.success('Etapa removida');
      refresh();
    } catch {
      toast.error('Erro ao remover etapa');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Gerenciar Etapas</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-2">
          {list.map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
              <span className="flex-1 text-sm font-medium text-foreground">{stage.name}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === list.length - 1} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(stage)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma etapa. Crie a primeira abaixo.</p>}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nova etapa..." onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Button onClick={add} className="gap-1.5"><Plus className="h-4 w-4" /> Adicionar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}