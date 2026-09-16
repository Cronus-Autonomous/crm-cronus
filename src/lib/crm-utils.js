export function formatCurrency(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export function relativeTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `${days}d atrás`;
  return formatDate(value);
}

export const TEMPERATURES = {
  frio: { label: 'Frio', token: 'cold' },
  morno: { label: 'Morno', token: 'warm' },
  quente: { label: 'Quente', token: 'hot' },
};