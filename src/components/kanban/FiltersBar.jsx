import { Search, Plus, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const TEMPS = [
  { key: 'frio', label: 'Frio', cls: 'bg-status-cold' },
  { key: 'morno', label: 'Morno', cls: 'bg-status-warm' },
  { key: 'quente', label: 'Quente', cls: 'bg-status-hot' },
];

export default function FiltersBar({ filters, setFilters, isAdmin, users, onNew, onManageStages, onOpenTurboLeads }) {
  const toggleTemp = (key) =>
    setFilters((f) => ({ ...f, temperatures: f.temperatures.includes(key) ? f.temperatures.filter((t) => t !== key) : [...f.temperatures, key] }));

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 lg:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-lg font-bold tracking-tight text-foreground">Oportunidades B2B</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            onClick={onOpenTurboLeads}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5 shadow-sm transition-all"
          >
          🔥 Turbo Leads
          </Button>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={onManageStages} className="gap-1.5">
              <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">Gerenciar Etapas</span>
            </Button>
          )}
          <Button size="sm" onClick={onNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Oportunidade
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar empresa ou telefone..." value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} className="pl-8" />
        </div>
        <Select value={filters.period} onValueChange={(v) => setFilters((f) => ({ ...f, period: v }))}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={filters.owner} onValueChange={(v) => setFilters((f) => ({ ...f, owner: v }))}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Owner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-1">
          {TEMPS.map((t) => (
            <button key={t.key} onClick={() => toggleTemp(t.key)}
              className={cn('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                filters.temperatures.includes(t.key) ? 'border-foreground/20 bg-foreground/5 text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
              <span className={cn('h-2 w-2 rounded-full', t.cls)} /> {t.label}
            </button>
          ))}
        </div>
        <Select value={filters.site} onValueChange={(v) => setFilters((f) => ({ ...f, site: v }))}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Site" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="com">Com Site</SelectItem>
            <SelectItem value="sem">Sem Site</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}