import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { base44 } from '@/api/base44Client';
import { Kanban, MessageCircle, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const NAV = [
  { to: '/', label: 'Kanban', icon: Kanban, end: true },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, end: false },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">C</div>
      <span className="font-display text-base font-bold tracking-tight text-foreground">Cronus <span className="text-primary">CRM</span></span>
    </div>
  );
}

function StatusDot({ status }) {
  const online = status === 'connected';
  return (
    <span className="relative flex h-2.5 w-2.5">
      {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-whatsapp opacity-75" />}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', online ? 'bg-status-whatsapp' : 'bg-muted-foreground/40')} />
    </span>
  );
}

function NavList({ onNavigate, whatsappStatus }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <item.icon className="h-[18px] w-[18px]" />
          <span className="flex-1">{item.label}</span>
          {item.label === 'WhatsApp' && <StatusDot status={whatsappStatus} />}
        </NavLink>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

function ProfileCapsule({ user, onLogout }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {(user?.full_name || user?.email || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{user?.full_name || user?.email}</p>
        <p className="text-xs capitalize text-muted-foreground">{user?.role || 'user'}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Layout() {
  const [user, setUser] = useState(null);
  const [waStatus, setWaStatus] = useState('disconnected');
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.WhatsAppInstance.list().then((list) => {
      setWaStatus((list || []).some((i) => i.status === 'connected') ? 'connected' : 'disconnected');
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate('/login');
  };

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-4">
                <div className="flex items-center justify-between">
                  <Logo />
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
                </div>
                <div className="mt-6"><NavList onNavigate={() => setOpen(false)} whatsappStatus={waStatus} /></div>
                <div className="absolute bottom-4 left-4 right-4"><ProfileCapsule user={user} onLogout={handleLogout} /></div>
              </SheetContent>
            </Sheet>
            <Logo />
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status={waStatus} />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-hidden"><Outlet /></main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-border bg-card p-4">
        <div className="px-2 py-3"><Logo /></div>
        <div className="mt-6"><NavList whatsappStatus={waStatus} /></div>
        <div className="mt-auto"><ProfileCapsule user={user} onLogout={handleLogout} /></div>
      </aside>
      <main className="flex-1 overflow-hidden pl-60"><Outlet /></main>
    </div>
  );
}