'use client';

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { db, useAuth } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ServersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [servers, setServers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [ipAddress, setIp] = useState("");
  const [provider, setProvider] = useState("");
  const [os, setOs] = useState("");
  const [projectId, setProjectId] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    if(!user) return;
    try {
      const q = query(collection(db, "servers"), where("ownerId", "==", user.uid));
      const pQ = query(collection(db, "projects"), where("ownerId", "==", user.uid));
      
      const [sSnap, pSnap] = await Promise.all([getDocs(q), getDocs(pQ)]);
      
      setServers(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProjects(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Failed to load servers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "servers"), {
        name, ipAddress, provider, os, projectId, notes,
        ownerId: user!.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Server created");
      setOpen(false);
      setName(""); setIp(""); setProvider(""); setOs(""); setProjectId(""); setNotes("");
      loadData();
    } catch (error) {
      toast.error("Failed to create server");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "servers", id));
      toast.success("Server deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete server");
    }
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('servers')}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2"/> {t('create_server')}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('create_server')}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input required value={name} onChange={e=>setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">IP Address</label>
                  <Input required value={ipAddress} onChange={e=>setIp(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <Input value={provider} onChange={e=>setProvider(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OS</label>
                  <Input value={os} onChange={e=>setOs(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Linked Project</label>
                <Select value={projectId} onValueChange={(val) => val && setProjectId(val)}>
                  <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
              <TableHead>IP Address</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No servers found</TableCell></TableRow>
            )}
            {servers.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.ipAddress}</TableCell>
                <TableCell>{s.provider}</TableCell>
                <TableCell>{s.os}</TableCell>
                <TableCell>{projects.find(p => p.id === s.projectId)?.name || '-'}</TableCell>
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
