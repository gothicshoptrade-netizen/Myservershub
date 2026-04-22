'use client';

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, useAuth } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Trash2, Link as LinkIcon, Ban, Clock } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ShareLinksPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if(!user) return;
    try {
      const q = query(collection(db, "shareLinks"), where("ownerId", "==", user.uid));
      const snap = await getDocs(q);
      setLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Failed to load share links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleRevoke = async (id: string) => {
    if(!confirm("Revoke this public link immediately?")) return;
    try {
      await updateDoc(doc(db, "shareLinks", id), {
        revokedAt: serverTimestamp()
      });
      toast.success("Link revoked");
      loadData();
    } catch (error) {
      toast.error("Failed to revoke link");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this link log permanently?")) return;
    try {
      await deleteDoc(doc(db, "shareLinks", id));
      toast.success("Deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Public link copied to clipboard");
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('share_links')}</h1>
        <p className="text-muted-foreground mt-1">Manage public snapshots of your infrastructure.</p>
      </div>

      {loading ? <p>{t('loading')}</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Target ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No shared links yet.</TableCell></TableRow>
            )}
            {links.map(l => {
              const now = new Date();
              const isExpired = l.expiresAt && l.expiresAt.toDate() < now;
              const isRevoked = !!l.revokedAt;
              const isActive = !isExpired && !isRevoked;

              return (
              <TableRow key={l.id}>
                <TableCell><Badge variant="outline">{l.resourceType}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{l.resourceId}</TableCell>
                <TableCell>
                  {isActive ? <Badge className="bg-green-500">Active</Badge> : 
                   isRevoked ? <Badge variant="destructive">Revoked</Badge> : 
                   <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Expired</Badge>}
                </TableCell>
                <TableCell>
                  {l.expiresAt ? l.expiresAt.toDate().toLocaleString() : 'Never'}
                </TableCell>
                <TableCell className="text-right space-x-2">
                   {isActive && (
                     <>
                        <Button variant="ghost" size="sm" onClick={() => copyLink(l.id)}>
                          <LinkIcon className="w-4 h-4 mr-2 text-blue-500" /> Copy
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRevoke(l.id)}>
                          <Ban className="w-4 h-4 mr-2 text-orange-500" /> Revoke
                        </Button>
                     </>
                   )}
                   <Button variant="ghost" size="icon" onClick={() => handleDelete(l.id)}>
                     <Trash2 className="w-4 h-4 text-red-500" />
                   </Button>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
