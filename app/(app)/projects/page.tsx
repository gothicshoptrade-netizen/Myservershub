'use client';

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, useAuth } from "@/lib/providers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [stack, setStack] = useState("");
  const [status, setStatus] = useState("active");

  const loadProjects = async () => {
    if(!user) return;
    try {
      const q = query(collection(db, "projects"), where("ownerId", "==", user.uid));
      const snap = await getDocs(q);
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "projects"), {
        name,
        description: desc,
        url,
        techStack: stack,
        status,
        ownerId: user!.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Project created");
      setOpen(false);
      setName(""); setDesc(""); setUrl(""); setStack(""); setStatus("active");
      loadProjects();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      toast.success("Project deleted");
      loadProjects();
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('projects')}</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2"/> {t('create_project')}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('create_project')}</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input required value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={desc} onChange={e=>setDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL</label>
                  <Input value={url} onChange={e=>setUrl(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={(val) => val && setStatus(val)}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tech Stack (comma separated)</label>
                <Input value={stack} onChange={e=>setStack(e.target.value)} placeholder="React, Node.js, Firebase..." />
              </div>
              <div className="flex justify-end"><Button type="submit">Save</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p>{t('loading')}</p> : (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map(p => (
            <Card key={p.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{p.description}</CardDescription>
                  </div>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {p.techStack && (
                  <div className="flex flex-wrap gap-1">
                    {p.techStack.split(',').map((t: string) => t.trim()).slice(0, 4).map((tech: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                    ))}
                    {p.techStack.split(',').length > 4 && <Badge variant="outline" className="text-xs">+{p.techStack.split(',').length - 4}</Badge>}
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
