import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, QrCode, LogOut, Send, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WhatsApp() {
  const [user, setUser] = useState(null);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newInstance, setNewInstance] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [qrMap, setQrMap] = useState({});
  const [testNum, setTestNum] = useState({});
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    try {
      const [u, list] = await Promise.all([
        base44.auth.me(),
        base44.entities.WhatsAppInstance.list('-created_date', 100),
      ]);
      setUser(u);
      setInstances(list || []);
    } catch {
      toast.error('Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isAdmin = user?.role === 'admin';

  const createInstance = async () => {
    if (!newInstance.trim() || !serverUrl.trim()) return toast.error('Informe nome e URL do servidor');
    try {
      await base44.entities.WhatsAppInstance.create({ instance_name: newInstance.trim(), server_url: serverUrl.trim(), status: 'disconnected' });
      setNewInstance('');
      setServerUrl('');
      toast.success('Instância criada');
      load();
    } catch {
      toast.error('Erro ao criar instância');
    }
  };

  const removeInstance = async (inst) => {
    try {
      await base44.entities.WhatsAppInstance.delete(inst.id);
      toast.success('Instância removida');
      load();
    } catch {
      toast.error('Erro ao remover instância');
    }
  };

  const runAction = async (inst, actionName, extra = {}) => {
    setBusy((b) => ({ ...b, [inst.id]: actionName }));
    try {
      const res = await base44.functions.invoke('whatsappAction', { action: actionName, instanceId: inst.id, ...extra });
      if (res?.data?.error) throw new Error(res.data.error);
      if (actionName === 'create') {
        let qr = res?.data?.qrcode;
        if (qr && !qr.startsWith('data:')) qr = `data:image/png;base64,${qr}`;
        setQrMap((m) => ({ ...m, [inst.id]: qr || null }));
        toast.success('QR Code gerado');
      } else if (actionName === 'disconnect') {
        setQrMap((m) => ({ ...m, [inst.id]: null }));
        toast.success('Instância desconectada');
      } else if (actionName === 'test') {
        toast.success('Mensagem de teste enviada');
      }
      load();
    } catch (e) {
      toast.error(e.message || 'Erro na operação');
    } finally {
      setBusy((b) => ({ ...b, [inst.id]: null }));
    }
  };

  if (!loading && !isAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Acesso restrito a administradores.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      <h1 className="font-display text-xl font-bold tracking-tight text-foreground">Conexão WhatsApp</h1>
      <p className="mt-1 text-sm text-muted-foreground">Gerencie instâncias da Evolution API para prospecção via WhatsApp.</p>

      <Card className="mt-5">
        <CardHeader><CardTitle className="text-base">Nova Instância</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Nome da Instância</Label>
            <Input className="mt-1.5" value={newInstance} onChange={(e) => setNewInstance(e.target.value)} placeholder="ex: cronus-01" />
          </div>
          <div className="flex-[2]">
            <Label>URL do Servidor (Evolution API)</Label>
            <Input className="mt-1.5" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://evolution.seudominio.com" />
          </div>
          <Button onClick={createInstance} className="gap-1.5"><Plus className="h-4 w-4" /> Adicionar</Button>
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {loading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        {!loading && instances.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma instância cadastrada. Crie a primeira acima.</p>
        )}
        {instances.map((inst) => (
          <Card key={inst.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{inst.instance_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{inst.server_url}</p>
                </div>
                <span className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                  inst.status === 'connected' ? 'bg-status-whatsapp/15 text-status-whatsapp' :
                  inst.status === 'connecting' ? 'bg-status-warm/15 text-status-warm' : 'bg-muted text-muted-foreground')}>
                  <span className={cn('h-2 w-2 rounded-full',
                    inst.status === 'connected' ? 'bg-status-whatsapp' :
                    inst.status === 'connecting' ? 'bg-status-warm' : 'bg-muted-foreground/50')} />
                  {inst.status === 'connected' ? 'Online' : inst.status === 'connecting' ? 'Conectando' : 'Offline'}
                </span>
              </div>

              <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/20 p-4">
                {qrMap[inst.id] ? (
                  <img src={qrMap[inst.id]} alt="QR Code" className="h-40 w-40 rounded" />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center text-muted-foreground">
                    <QrCode className="h-16 w-16" />
                  </div>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  {qrMap[inst.id] ? 'Escaneie o QR Code para conectar' : 'Gere um QR Code para iniciar o pareamento'}
                </p>
              </div>

              <div className="mt-3">
                <Label className="text-xs">Número para teste (com DDI/DDD)</Label>
                <Input className="mt-1 h-8 text-sm" value={testNum[inst.id] || ''} onChange={(e) => setTestNum((m) => ({ ...m, [inst.id]: e.target.value }))} placeholder="5511999999999" />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => runAction(inst, 'create')} disabled={!!busy[inst.id]} className="gap-1.5">
                  {busy[inst.id] === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Gerar QR
                </Button>
                <Button size="sm" variant="outline" onClick={() => runAction(inst, 'disconnect')} disabled={!!busy[inst.id]} className="gap-1.5">
                  <LogOut className="h-4 w-4" /> Desconectar
                </Button>
                <Button size="sm" variant="outline" onClick={() => runAction(inst, 'test', { testNumber: testNum[inst.id] })} disabled={!!busy[inst.id]} className="gap-1.5">
                  <Send className="h-4 w-4" /> Testar Envio
                </Button>
                <Button size="sm" variant="ghost" onClick={() => removeInstance(inst)} className="ml-auto text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}