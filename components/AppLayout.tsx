'use client';

import { useAuth } from '@/lib/providers';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, FolderKanban, Server, Network, KeyRound, Share2, LogOut, Menu, Languages, Search, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { useTheme } from 'next-themes';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, login, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

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
          <h1 className="text-4xl font-bold tracking-tight text-primary">IT-Box</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Единый сейф для всей инфраструктуры.
          </p>
        </div>
        <Button onClick={login} size="lg" className="neu-button">
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

  const setLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col md:flex">
        <div className="flex h-20 items-center px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-3 font-semibold text-lg">
            <div className="flex bg-background h-10 w-10 items-center justify-center rounded-full neu-flat text-primary">
              <Server className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span>IT-Box</span>
              <span className="text-[10px] font-normal text-muted-foreground tracking-tight">Сейф для инфраструктуры</span>
            </div>
          </Link>
        </div>
        <div className="flex-1 mt-4">
          <nav className="grid items-start px-4 text-sm font-medium gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-4 py-3 xl:py-3.5 transition-all text-[15px]",
                  pathname === item.href 
                    ? "bg-background neu-pressed text-primary font-semibold" 
                    : "text-muted-foreground hover:neu-flat hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 flex flex-col gap-1 items-start text-xs text-muted-foreground">
          <Link href="#" className="flex gap-2 items-center px-4 py-2 hover:text-foreground">О продукте</Link>
          <Link href="#" className="flex gap-2 items-center px-4 py-2 hover:text-foreground mb-4">FAQ</Link>
          
          <div className="px-4 border-t border-border/50 pt-4 w-full">
            <span className="block font-medium">Менеджер IT-активов</span>
            <span className="block opacity-70 mb-2">v1.0.0</span>
            <span className="block opacity-50">&copy; 2026 IT-Box</span>
            <span className="block opacity-50 mb-2">Политика конфиденциальности</span>
            <Button variant="ghost" className="w-fit justify-start bg-transparent text-red-500 hover:text-red-700 hover:bg-transparent h-auto p-0" onClick={logout}>
              {t('logout')}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between gap-4 px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="md:hidden neu-flat rounded-full h-10 w-10 shrink-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
          
          <div className="w-full flex-1 flex items-center gap-2">
            <form onSubmit={(e) => { e.preventDefault(); /* handle search later */ }} className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Universal Search..."
                  className="w-full sm:w-80 rounded-full bg-background neu-pressed pl-10 border-0 h-10"
                />
              </div>
            </form>
          </div>
          <div className="flex items-center gap-4 shrink-0">
             <Button variant="ghost" size="icon" className="md:hidden neu-flat rounded-full h-10 w-10 shrink-0 border-0">
               <Search className="h-4 w-4" />
             </Button>

             <Button variant="ghost" size="icon" className="neu-flat rounded-full h-10 w-10 shrink-0 border-0" onClick={toggleTheme}>
               {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
             </Button>
             
             <div className="flex items-center neu-flat rounded-full p-1 h-10 shrink-0 bg-background border-0 gap-1">
                <button 
                  onClick={() => setLang('ru')}
                  className={cn("px-4 h-full rounded-full text-xs font-semibold transition-all", i18n.language === 'ru' ? 'bg-primary text-primary-foreground neu-pressed' : 'text-muted-foreground hover:text-foreground')}
                >
                  RU
                </button>
                <button 
                  onClick={() => setLang('en')}
                  className={cn("px-4 h-full rounded-full text-xs font-semibold transition-all", i18n.language === 'en' ? 'bg-primary text-primary-foreground neu-pressed' : 'text-muted-foreground hover:text-foreground')}
                >
                  EN
                </button>
             </div>
          </div>
        </header>

        {/* Mobile Navigation overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative flex w-64 flex-col bg-background h-screen overflow-y-auto">
                <div className="flex h-20 items-center px-4">
                  <Link href="/" className="flex items-center gap-3 font-semibold text-lg" onClick={() => setSidebarOpen(false)}>
                    <div className="flex bg-background h-10 w-10 items-center justify-center rounded-full neu-flat text-primary">
                      <Server className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span>IT-Box</span>
                      <span className="text-[10px] font-normal text-muted-foreground tracking-tight">Сейф для инфраструктуры</span>
                    </div>
                  </Link>
               </div>
               <nav className="grid p-4 text-sm font-medium gap-3">
                 {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl px-4 py-3 transition-all",
                        pathname === item.href 
                          ? "bg-background neu-pressed text-primary font-semibold" 
                          : "text-muted-foreground hover:neu-flat hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
               </nav>
            </aside>
          </div>
        )}

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
