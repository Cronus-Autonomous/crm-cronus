import { useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const empty = { company_name: '', phone: '', email: '', site_url: '', has_site: false, temperature: 'frio', value: 0, stage_id: '', owner_id: '', notes: '' };

function FormFields({ data, setData, stages, users, isAdmin }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Nome da Empresa *</Label>
        <Input className="mt-1.5" value={data.company_name} onChange={(e) => setData((d) => ({ ...d, company_name: e.target.value }))} placeholder="Ex: Acme Ltda" />
      </div>
      <div>
        <Label>Telefone *</Label>
        <Input className="mt-1.5" value={data.phone} onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))} placeholder="+55 11 99999-9999" />
      </div>
      <div>
        <Label>E-mail</Label>
        <Input className="mt-1.5" type="email" value={data.email} onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))} placeholder="contato@empresa.com" />
      </div>
      <div>
        <Label>URL do Site</Label>
        <Input className="mt-1.5" value={data.site_url} onChange={(e) => setData((d) => ({ ...d, site_url: e.target.value }))} placeholder="https://..." />
      </div>
      <div className="flex items-center gap-2 sm:pt-7">
        <Switch checked={data.has_site} onCheckedChange={(v) => setData((d) => ({ ...d, has_site: v }))} id="has_site" />
        <Label htmlFor="has_site" className="font-normal">Possui Site</Label>
      </div>
      <div>
        <Label>Temperatura</Label>
        <Select value={data.temperature} onValueChange={(v) => setData((d) => ({ ...d, temperature: v }))}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="frio">Frio</SelectItem>
            <SelectItem value="morno">Morno</SelectItem>
            <SelectItem value="quente">Quente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Valor (R$)</Label>
        <Input className="mt-1.5" type="number" value={data.value} onChange={(e) => setData((d) => ({ ...d, value: Number(e.target.value) }))} onFocus={(e) => {
      if (data.value === 0 || data.value === '0') {
        setData((d) => ({ ...d, value: '' }));
      } else {
        // Seleciona o texto existente se for outro valor
        e.target.select();
      }
    }}
    onBlur={(e) => {
      // Se o usuário clicar fora sem digitar nada, restaura para 0
      if (e.target.value === '' || isNaN(e.target.value)) {
        setData((d) => ({ ...d, value: 0 }));
      }
    }}
    placeholder="0"/>
      </div>
      <div>
        <Label>Etapa</Label>
        <Select value={data.stage_id} onValueChange={(v) => setData((d) => ({ ...d, stage_id: v }))}>
          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>{stages.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Owner</Label>
        {isAdmin ? (
          <Select value={data.owner_id} onValueChange={(v) => setData((d) => ({ ...d, owner_id: v }))}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input className="mt-1.5" disabled value={users.find((u) => u.id === data.owner_id)?.full_name || 'Você'} />
        )}
      </div>
      <div className="sm:col-span-2">
        <Label>Observações</Label>
        <div className="mt-1.5 ql-wrapper">
          <ReactQuill theme="snow" value={data.notes} onChange={(v) => setData((d) => ({ ...d, notes: v }))} />
        </div>
      </div>
    </div>
  );
}

export default function OpportunityFormModal({ open, onClose, onSubmit, opportunity, stages, users, currentUser }) {
  const isMobile = useIsMobile();
  const isAdmin = currentUser?.role === 'admin';
  const [data, setData] = useState(empty);
  const wasOpen = useRef(false);

  useEffect(() => {
    // Roda APENAS na transição de FECHADO -> ABERTO ou quando mudar a Oportunidade em edição
    if (open && !wasOpen.current) {
      setData(opportunity
        ? { ...empty, ...opportunity }
        : { ...empty, owner_id: currentUser?.id || '', stage_id: stages[0]?.id || '' });
    }
    wasOpen.current = open;
  }, [open, opportunity]);

  const handleSubmit = () => {
    if (!data.company_name.trim()) return toast.error('Informe o nome da empresa');
    if (!data.phone.trim()) return toast.error('Informe o telefone');
    if (!data.stage_id) return toast.error('Selecione a etapa');
    if (!data.owner_id) return toast.error('Selecione o owner');
    onSubmit({
      company_name: data.company_name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || '',
      site_url: data.site_url?.trim() || '',
      has_site: !!data.has_site,
      temperature: data.temperature,
      value: Number(data.value) || 0,
      stage_id: data.stage_id,
      owner_id: data.owner_id,
      notes: data.notes || '',
      last_fup_date: data.last_fup_date || new Date().toISOString(),
    });
  };

  const title = opportunity ? 'Editar Oportunidade' : 'Nova Oportunidade';
  const fields = <FormFields data={data} setData={setData} stages={stages} users={users} isAdmin={isAdmin} />;
  const footer = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onClose}>Cancelar</Button>
      <Button onClick={handleSubmit}>Salvar</Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="border-b border-border">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-3">{fields}</div>
          <DrawerFooter className="border-t border-border">{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-1 py-2">{fields}</div>
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}