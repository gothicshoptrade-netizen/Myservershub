'use client';

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer, getDocs, orderBy, limit } from "firebase/firestore";
import { db, useAuth } from "@/lib/providers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Server, Network, KeyRound, Share2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({ projects: 0, servers: 0, services: 0, credentials: 0 });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentServers, setRecentServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadDashboard() {
      try {
        const pQuery = query(collection(db, "projects"), where("ownerId", "==", user!.uid), where("status", "==", "active"));
        const srvQuery = query(collection(db, "servers"), where("ownerId", "==", user!.uid));
        const svcQuery = query(collection(db, "services"), where("ownerId", "==", user!.uid));
        const cQuery = query(collection(db, "credentials"), where("ownerId", "==", user!.uid));

        const [pSnap, srvSnap, svcSnap, cSnap] = await Promise.all([
          getCountFromServer(pQuery),
          getCountFromServer(srvQuery),
          getCountFromServer(svcQuery),
          getCountFromServer(cQuery)
        ]);

        setStats({
          projects: pSnap.data().count,
          servers: srvSnap.data().count,
          services: svcSnap.data().count,
          credentials: cSnap.data().count
        });

        // Load recents
        const pRecentQ = query(collection(db, "projects"), where("ownerId", "==", user!.uid), orderBy("createdAt", "desc"), limit(5));
        const sRecentQ = query(collection(db, "servers"), where("ownerId", "==", user!.uid), orderBy("createdAt", "desc"), limit(5));

        const [pRec, sRec] = await Promise.all([getDocs(pRecentQ), getDocs(sRecentQ)]);
        
        setRecentProjects(pRec.docs.map(d => ({ id: d.id, ...d.data() })));
        setRecentServers(sRec.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch(err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  if (loading) return <div className="p-4">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h1>
        <p className="text-muted-foreground">{t('system_overview')}</p>
      </div>

      <Card className="bg-gradient-to-br from-background to-muted/20 border-0 neu-flat mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">IT-Box — Единый сейф для всей вашей инфраструктуры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 neu-pressed shrink-0">
               <KeyRound className="h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm md:text-base">Прекратите искать доступы в чатах и таблицах.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 neu-pressed shrink-0">
               <Share2 className="h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm md:text-base">Контролируйте, кто и к чему имеет доступ, в один клик.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 neu-pressed shrink-0">
               <Network className="h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm md:text-base">От фрилансера до корпорации.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/projects" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <Card className="h-full hover:neu-pressed transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('active_projects')}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 neu-flat">
                 <FolderKanban className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black mb-4">{stats.projects}</div>
              <div className="flex items-center text-sm font-medium text-cyan-600 dark:text-cyan-400">
                 Все <span className="ml-1">→</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/servers" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <Card className="h-full hover:neu-pressed transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('total_servers')}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 neu-flat">
                 <Server className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black mb-4">{stats.servers}</div>
              <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400">
                 Все <span className="ml-1">→</span>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/services" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <Card className="h-full hover:neu-pressed transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('total_services')}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 neu-flat">
                 <Network className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black mb-4">{stats.services}</div>
              <div className="flex items-center text-sm font-medium text-yellow-600 dark:text-yellow-400">
                 Все <span className="ml-1">→</span>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/credentials" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <Card className="h-full hover:neu-pressed transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('stored_credentials')}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 neu-flat">
                 <KeyRound className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black mb-4">{stats.credentials}</div>
              <div className="flex items-center text-sm font-medium text-red-600 dark:text-red-400">
                 Все <span className="ml-1">→</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{t('recent_projects')}</CardTitle>
            <CardDescription>{t('system_overview')}</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {recentProjects.length === 0 ? <p className="text-sm text-muted-foreground">{t('no_data')}</p> : null}
               {recentProjects.map((p) => (
                 <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium leading-none mb-1"><Link href={"/projects"} className="hover:underline">{p.name}</Link></p>
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">{p.description || "No description"}</p>
                    </div>
                    <div>
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                    </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('recent_servers')}</CardTitle>
            <CardDescription>{t('system_overview')}</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {recentServers.length === 0 ? <p className="text-sm text-muted-foreground">{t('no_data')}</p> : null}
               {recentServers.map((s) => (
                 <div key={s.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium leading-none mb-1"><Link href={"/servers"} className="hover:underline">{s.name}</Link></p>
                      <p className="text-sm text-muted-foreground">{s.ipAddress}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-muted-foreground">{s.os}</p>
                    </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
