import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FiltersBar from '@/components/kanban/FiltersBar';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import OpportunityFormModal from '@/components/kanban/OpportunityFormModal';
import ManageStagesModal from '@/components/kanban/ManageStagesModal';
import CloseOpportunityDialog from '@/components/kanban/CloseOpportunityDialog';
import ProspectModal from '@/components/kanban/ProspectModal';

export default function Kanban() {
  const { user, userProfile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({ search: '', period: 'all', owner: 'all', temperatures: [], site: 'all' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState(null);
  const [turboModalOpen, setTurboModalOpen] = useState(false);

  // 1. Busca Etapas (Cache por 10 minutos)
  const { data: stages = [], isLoading: loadingStages } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stages').select('*').order('order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
    enabled: !!user,
  });

  // 2. Busca Oportunidades
  const { data: opportunities = [], isLoading: loadingOps } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!user,
  });

  // 3. Busca Usuários para filtros
  const { data: users = [] } = useQuery({
    queryKey: ['users-list', isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        const { data } = await supabase.from('profiles').select('*');
        return data || [];
      }
      return userProfile ? [userProfile] : [];
    },
    enabled: !!user,
  });

  // Structural Loading Status (apenas no primeiro carregamento real)
  const isLoading = loadingStages || loadingOps;

  // Mutação para mover oportunidade no Kanban (Atualização Otimista)
  const moveMutation = useMutation({
    mutationFn: async ({ oppId, newStageId }) => {
      const { error } = await supabase
        .from('opportunities')
        .update({ stage_id: newStageId, last_fup_date: new Date().toISOString() })
        .eq('id', oppId);
      if (error) throw error;
    },
    onMutate: async ({ oppId, newStageId }) => {
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });
      const previousOps = queryClient.getQueryData(['opportunities']);

      queryClient.setQueryData(['opportunities'], (old = []) =>
        old.map((o) => (o.id === oppId ? { ...o, stage_id: newStageId } : o))
      );

      return { previousOps };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['opportunities'], context.previousOps);
      toast.error('Erro ao mover oportunidade');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  // Mutação para Criar / Atualizar Oportunidade
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editing) {
        const { error } = await supabase.from('opportunities').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('opportunities').insert([{ ...payload, status: 'open', owner_id: user?.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Oportunidade atualizada' : 'Oportunidade criada');
      setFormOpen(false);
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  // Mutação para Fechar Oportunidade (Ganha/Perdida)
  const closeMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('opportunities').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'won' ? 'Oportunidade ganha!' : 'Oportunidade perdida');
      setCloseTarget(null);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
    onError: () => toast.error('Erro ao encerrar'),
  });

  const boardOps = useMemo(() => {
    return opportunities.filter((o) => {
      if (o.status && o.status !== 'open') return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!o.company_name?.toLowerCase().includes(q) && !o.phone?.toLowerCase().includes(q)) return false;
      }
      if (filters.temperatures.length && !filters.temperatures.includes(o.temperature)) return false;
      if (filters.site === 'com' && !o.has_site) return false;
      if (filters.site === 'sem' && o.has_site) return false;
      if (filters.owner !== 'all' && o.owner_id !== filters.owner) return false;
      if (filters.period !== 'all') {
        const dateVal = o.created_at || o.created_date;
        if (dateVal) {
          const days = (Date.now() - new Date(dateVal).getTime()) / 86400000;
          if (days > Number(filters.period)) return false;
        }
      }
      return true;
    });
  }, [opportunities, filters]);

  useEffect(() => {
  const channel = supabase
    .channel('opportunities-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'opportunities' },
      () => {
        // Invalida o cache do React Query para renderizar os cards novos sem dar refresh na página
        queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [queryClient]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-screen">
      <FiltersBar
        filters={filters}
        setFilters={setFilters}
        isAdmin={isAdmin}
        users={users}
        onNew={() => { setEditing(null); setFormOpen(true); } }
        onManageStages={() => setStagesOpen(true)}
        onOpenTurboLeads={() => setTurboModalOpen(true)}
      />
      <div className="relative flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full gap-4 overflow-x-auto px-4 py-4 lg:px-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-full w-[280px] shrink-0 rounded-lg" />
            ))}
          </div>
        ) : (
          <KanbanBoard
            stages={stages}
            opportunities={boardOps}
            onMove={(oppId, newStageId) => moveMutation.mutate({ oppId, newStageId })}
            onEdit={(o) => { setEditing(o); setFormOpen(true); }}
            onClose={setCloseTarget}
            users={users}
          />
        )}
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 lg:hidden"
          aria-label="Nova Oportunidade"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <OpportunityFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={(payload) => saveMutation.mutate(payload)}
        opportunity={editing}
        stages={stages}
        users={users}
        currentUser={user}
      />

      <ManageStagesModal
        open={stagesOpen}
        onClose={() => setStagesOpen(false)}
        stages={stages}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['stages'] })}
      />

      <CloseOpportunityDialog
        opportunity={closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={(status) => closeMutation.mutate({ id: closeTarget.id, status })}
      />

      <ProspectModal
        open={turboModalOpen}
        onClose={() => setTurboModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
}