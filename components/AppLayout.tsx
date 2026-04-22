'use client';

import { useAuth } from '@/lib/providers';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, FolderKanban, Server, Network, KeyRound, Share2, LogOut, Menu, Languages, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, login, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  // If loading auth state
  if (loading) {
    return (
      <div className="flex bg-background h-screen w-full items-center justify-center">
        <p className="text-muted-foreground animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  // If public route like /share/:token, we don't force login or show sidebar.
  // We'll let the individual page handle it, but wait, usually we apply AppLayout in an (app) group.
  // Actually, we can just check if pathname starts with /share/
  if (pathname.startsWith('/share/')) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  // If not logged in
  if (!user) {
    return (
      <div className="flex bg-background h-screen w-full flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary">IT-Vault</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Centralized storage for servers, services, projects, and credentials with AES-256-GCM encryption.
          </p>
        </div>
        <Button onClick={login} size="lg">
          {t('login')}
        </Button>
      </div>
    );
  }

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/projects', icon: FolderKanban, label: t('projects') },
    { href: '/servers', icon: Server, label: t('servers') },
    { href: '/services', icon: Network, label: t('services') },
    { href: '/credentials', icon: KeyRound, label: t('credentials') },
    { href: '/share-links', icon: Share2, label: t('share_links') },
  ];

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r bg-muted/20 md:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Server className="h-6 w-6" />
            <span className="">IT-Vault</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 py-4 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  pathname === item.href ? "bg-muted text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 flex flex-col gap-2">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleLang}>
            <Languages className="h-4 w-4" />
            {i18n.language === 'en' ? 'RU / EN' : 'EN / RU'}
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/20 px-4 lg:h-[60px] lg:px-6">
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
          
          <div className="w-full flex-1">
            {/* Minimal top bar, perhaps search later */}
            <form onSubmit={(e) => { e.preventDefault(); /* handle search later */ }}>
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Universal Search..."
                  className="w-full appearance-none bg-background pl-8 shadow-none"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:inline-block">{user.email}</span>
          </div>
        </header>

        {/* Mobile Navigation overlay (simplified, or just use Sheet from shadcn later) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <aside className="relative flex w-64 flex-col bg-background">
               <div className="flex h-14 items-center border-b px-4">
                  <span className="font-semibold">IT-Vault</span>
               </div>
               <nav className="grid p-4 text-sm font-medium gap-2">
                 {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                        pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
               </nav>
            </aside>
          </div>
        )}

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
