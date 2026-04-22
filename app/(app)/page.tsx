'use client';

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { collection, query, where, getCountFromServer, getDocs, orderBy, limit } from "firebase/firestore";
import { db, useAuth } from "@/lib/providers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Server, Network, KeyRound } from "lucide-react";
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('active_projects')}</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_servers')}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_services')}</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.services}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stored_credentials')}</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.credentials}</div>
          </CardContent>
        </Card>
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
