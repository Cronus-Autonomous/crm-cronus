import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Flame, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProspectModal({ open, onClose, currentUser }) {
  const [nicho, setNicho] = useState('');
  const [cidade, setCidade] = useState('');
  const [limit, setLimit] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  // Efeito para simular progresso visual enquanto a API executa assincronamente
  useEffect(() => {
    let interval;
    if (isProcessing) {
      setProgress(5);
      setStatusText('Disparando scraper na AWS...');

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          if (prev === 30) setStatusText('Extraindo leads do Google Maps...');
          if (prev === 60) setStatusText('Validando telefones via WhatsApp...');
          return prev + 5;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nicho.trim() || !cidade.trim()) {
      return toast.error('Preencha o nicho e a cidade');
    }

    setIsProcessing(true);

    const payload = {
      user_id: currentUser?.id,
      nicho: nicho.trim(),
      cidade: cidade.trim(),
      limit: Number(limit) || 10,
      evolution_config: {
        api_url: import.meta.env.EVOLUTION_API_URL || 'https://sua-evolution.com',
        apikey: import.meta.env.EVOLUTION_API_KEY || 'GLOBAL_API_KEY',
        instance: currentUser?.evolution_instance || `instancia_${currentUser?.id}`,
      },
    };

    try {
      const response = await fetch(`${import.meta.env.SCRAPER_API_URL}/prospect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Falha ao iniciar prospecção');

      // Finaliza o progresso visualmente
      setProgress(100);
      setStatusText('Busca concluída! Inserindo oportunidades...');
      
      setTimeout(() => {
        toast.success('Leads localizados com sucesso!');
        setIsProcessing(false);
        setProgress(0);
        onClose();
      }, 1200);

    } catch (err) {
      console.error(err);
      toast.error('Erro ao conectar com o serviço de prospecção');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isProcessing && !o && onClose()}>
      {/* Classe backdrop-blur-md aplicada para criar o efeito blur no fundo */}
      <DialogContent className="max-w-md backdrop-blur-md bg-background/90 border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            Calibre o motor
          </DialogTitle>
        </DialogHeader>

        {isProcessing ? (
          <div className="py-6 flex flex-col items-center justify-center gap-4 text-center">
            {progress === 100 ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
            ) : (
              <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            )}
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-3 bg-emerald-950/20 [&>div]:bg-emerald-500" />
              <p className="text-sm font-medium text-muted-foreground">{statusText}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label>Nicho de Mercado *</Label>
              <Input
                className="mt-1"
                placeholder="Ex: Clínica de Estética, Odontologia..."
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
              />
            </div>
            <div>
              <Label>Cidade *</Label>
              <Input
                className="mt-1"
                placeholder="Ex: Londrina"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div>
              <Label>Quantidade Limite de Leads</Label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 font-semibold">
                <Flame className="h-4 w-4 fill-white" /> Iniciar Turbo
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}