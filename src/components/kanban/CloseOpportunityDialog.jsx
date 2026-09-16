import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trophy, XCircle } from 'lucide-react';

export default function CloseOpportunityDialog({ opportunity, onClose, onConfirm }) {
  return (
    <AlertDialog open={!!opportunity} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar Oportunidade</AlertDialogTitle>
          <AlertDialogDescription>
            Defina o desfecho de <span className="font-medium text-foreground">{opportunity?.company_name}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="gap-1.5 bg-status-lost text-white hover:bg-status-lost/90" onClick={() => onConfirm('lost')}>
            <XCircle className="h-4 w-4" /> Perdida
          </Button>
          <Button className="gap-1.5 bg-status-won text-white hover:bg-status-won/90" onClick={() => onConfirm('won')}>
            <Trophy className="h-4 w-4" /> Ganha
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}