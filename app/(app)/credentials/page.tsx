'use client';

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { db, useAuth } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CredentialsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Decryption state tracking
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [loadingDecryption, setLoadingDecryption] = useState<Record<string, boolean>>({});

  // Form
  const [name, setName] = useState("");
  const [type, setType] = useState("OTHER");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resourceType, setResourceType] = useState("none");
  const [resourceId, setResourceId] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    if(!user) return;
    try {
      const q = query(collection(db, "credentials"), where("ownerId", "==", user.uid));
      const snap = await getDocs(q);
      setCredentials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!password) {
      toast.error("Password is required");
      return;
    }
    try {
      // 1. Encrypt via API
      const res = await fetch('/api/crypto/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: password })
      });
      const encData = await res.json();
      if(encData.error) throw new Error(encData.error);

      // 2. Save to Firestore
      await addDoc(collection(db, "credentials"), {
        name,
        type,
        username,
        passwordEncrypted: encData.encrypted,
        iv: encData.iv,
        authTag: encData.authTag,
        resourceType,
        resourceId,
        notes,
        ownerId: user!.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Credential created and securely encrypted");
      setOpen(false);
      setName(""); setType("OTHER"); setUsername(""); setPassword(""); setResourceType("none"); setResourceId(""); setNotes("");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create credential");
    }
  };

  const handleDecrypt = async (cred: any) => {
    if (decryptedPasswords[cred.id]) {
      // Already decrypted, hide it
      const newDps = {...decryptedPasswords};
      delete newDps[cred.id];
      setDecryptedPasswords(newDps);
      return;
    }

    setLoadingDecryption(prev => ({...prev, [cred.id]: true}));
    try {
      const res = await fetch('/api/crypto/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          encrypted: cred.passwordEncrypted,
          iv: cred.iv,
          authTag: cred.authTag
        })
      });
      const decData = await res.json();
      if(decData.error) throw new Error(decData.error);
      
      setDecryptedPasswords(prev => ({...prev, [cred.id]: decData.decrypted}));
    } catch(err: any) {
      toast.error("Decryption failed. Check server setup.");
    } finally {
      setLoadingDecryption(prev => ({...prev, [cred.id]: false}));
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "credentials", id));
      toast.success("Credential deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete credential");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 bg-white dark:bg-slate-900 rounded-lg p-6 shadow-sm border">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('credentials')}</h1>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center">
            {t('secure_storage')}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2"/> Add Credential
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Secure Credential</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input required value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Prod DB Root" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={type} onValueChange={(val) => val && setType(val)}>
                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SSH">SSH</SelectItem>
                      <SelectItem value="FTP">FTP</SelectItem>
                      <SelectItem value="DB">Database</SelectItem>
                      <SelectItem value="WEB_PANEL">Web Panel</SelectItem>
                      <SelectItem value="API_KEY">API Key</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input value={username} onChange={e=>setUsername(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password/Secret</label>
                  <Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end"><Button type="submit">Encrypt & Save</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p>{t('loading')}</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Password</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No credentials found</TableCell></TableRow>
            )}
            {credentials.map(c => (
              <TableRow key={c.id}>
                <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.username || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {decryptedPasswords[c.id] ? (
                      <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{decryptedPasswords[c.id]}</span>
                    ) : (
                      <span className="text-muted-foreground tracking-widest text-lg leading-none">••••••••</span>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDecrypt(c)} disabled={loadingDecryption[c.id]}>
                      {loadingDecryption[c.id] ? <span className="animate-spin text-xs">...</span> : decryptedPasswords[c.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    {decryptedPasswords[c.id] && (
                       <Button variant="ghost" size="icon" onClick={() => copyToClipboard(decryptedPasswords[c.id])}>
                         <Copy className="w-3 h-3 text-muted-foreground" />
                       </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right space-x-2">
                   <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
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
