'use client';

import { useEffect, useState } from "react";
import { doc, getDoc, collection, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/providers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ShieldAlert, FileJson } from "lucide-react";
import { useParams } from "next/navigation";

function generateLogId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadShared() {
      try {
        const linkDoc = await getDoc(doc(db, "shareLinks", token));
        
        if (!linkDoc.exists()) {
          setError("Link not found, expired, or revoked.");
          setLoading(false);
          return;
        }

        const linkData = linkDoc.data();
        setData(linkData);

        // Record log asynchronously
        fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(async ({ ip }) => {
            const logId = generateLogId();
            await setDoc(doc(db, `shareLinks/${token}/logs`, logId), {
              ip,
              userAgent: navigator.userAgent,
              accessedAt: serverTimestamp()
            });
          }).catch(console.error);

      } catch (err) {
        setError("Link not found, expired, or revoked.");
      } finally {
        setLoading(false);
      }
    }
    
    if (token) {
       loadShared();
    }
  }, [token]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse">Loading secure snapshot...</p></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-bold">{error}</h1>
        <p className="text-muted-foreground">This resource is no longer safely accessible.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 md:p-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg border-t-4 border-blue-500">
           <div className="flex justify-between items-start border-b pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">Shared {data.resourceType}</h1>
                <p className="text-muted-foreground text-sm">Read-only snapshot. Credentials and passwords are stripped.</p>
              </div>
              <Badge variant="outline" className="uppercase tracking-widest">{data.resourceType}</Badge>
           </div>
           
           <div className="space-y-4">
              {Object.entries(data.snapshot).map(([k, v]: [string, any]) => {
                if (k.includes('Id') || k.includes('At') || k === 'ownerId') return null; // hide internal fields
                if (k === 'password' || k === 'passwordEncrypted') return null; // safeguard
                
                return (
                  <div key={k} className="border rounded p-4 bg-slate-50 dark:bg-slate-950">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <div className="text-base font-medium break-words">
                       {(typeof v === 'string' && v.startsWith('http')) ? (
                         <a href={v} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center">
                           {v} <ExternalLink className="w-3 h-3 ml-1" />
                         </a>
                       ) : (
                         v || <span className="text-muted-foreground italic">None</span>
                       )}
                    </div>
                  </div>
                );
              })}
           </div>
           
           <div className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <FileJson className="w-4 h-4" />
              Powered by IT-Vault Secure Sharing
           </div>
        </div>
      </div>
    </div>
  );
}
