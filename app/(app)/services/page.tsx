'use client';

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { db, useAuth } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function ServicesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [port, setPort] = useState("");
  const [serverId, setServerId] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    if(!user) return;
    try {
      const q = query(collection(db, "services"), where("ownerId", "==", user.uid));
      const sq = query(collection(db, "servers"), where("ownerId", "==", user.uid));
      
      const [sSnap, srvSnap] = await Promise.all([getDocs(q), getDocs(sq)]);
      
      setServices(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setServers(srvSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "services"), {
        name, url, port, serverId, notes,
        ownerId: user!.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Service created");
      setOpen(false);
      setName(""); setUrl(""); setPort(""); setServerId(""); setNotes("");
      loadData();
    } catch (error) {
      toast.error("Failed to create service");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "services", id));
      toast.success("Service deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete service");
    }
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('services')}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2"/> Add Service
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input required value={name} onChange={e=>setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Port</label>
                  <Input value={port} onChange={e=>setPort(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Linked Server</label>
                <Select value={serverId} onValueChange={(val) => val && setServerId(val)}>
                  <SelectTrigger><SelectValue placeholder="Select server (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {servers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.ipAddress})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={notes} onChange={e=>setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end"><Button type="submit">Save</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p>{t('loading')}</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Port</TableHead>
              <TableHead>Server</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No services found</TableCell></TableRow>
            )}
            {services.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  {s.url ? (
                    <a href={s.url.startsWith('http') ? s.url : `http://${s.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
                      {s.url} <ExternalLink className="ml-1 w-3 h-3" />
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>{s.port || '-'}</TableCell>
                <TableCell>{servers.find(srv => srv.id === s.serverId)?.name || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                   <Button variant="ghost" size="icon" title="Share" onClick={() => {/* Handle Share */}}>
                     <Share2 className="w-4 h-4 text-blue-500" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                     <Trash2 className="w-4 h-4 text-red-500" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
