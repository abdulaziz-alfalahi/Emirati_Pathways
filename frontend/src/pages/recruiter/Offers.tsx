import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Send, Link as LinkIcon } from 'lucide-react';

const api = (path: string) => `http://localhost:5003${path}`;

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch(api('/api/hr/offers/?limit=20'), { headers: authHeaders as any });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setOffers(json?.data?.offers || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOffer = async (offerId: string) => {
    try {
      const res = await fetch(api(`/api/hr/offers/${offerId}/send`), {
        method: 'POST',
        headers: { ...(authHeaders as any), 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_days: 7 })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const signUrl = json?.data?.sign_url;
      if (signUrl && navigator.clipboard) {
        await navigator.clipboard.writeText(signUrl);
        toast({ title: 'Offer sent', description: 'Sign URL copied to clipboard.' });
      } else if (signUrl) {
        toast({ title: 'Offer sent', description: signUrl });
      } else {
        toast({ title: 'Offer sent' });
      }
      await loadOffers();
    } catch (e: any) {
      toast({ title: 'Failed to send offer', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const copySignUrl = async (o: any) => {
    try {
      if (!o.signature_token) {
        toast({ title: 'No signature token', description: 'Send the offer first.', variant: 'destructive' });
        return;
      }
      const signUrl = `${api(`/api/offers/${o.id}/accept`)}?token=${o.signature_token}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(signUrl);
        toast({ title: 'Copied', description: 'Sign URL copied to clipboard.' });
      } else {
        toast({ title: 'Copy this sign URL', description: signUrl });
      }
    } catch (e: any) {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      sent: 'bg-blue-100 text-blue-800 border-blue-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      declined: 'bg-red-100 text-red-800 border-red-200',
    };
    return <Badge variant="outline" className={map[status] || 'bg-slate-100 text-slate-800 border-slate-200'}>{status}</Badge>;
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Offers</CardTitle>
          <CardDescription>Manage offers sent to candidates</CardDescription>
        </CardHeader>
        <CardContent>
      {loading && <div className="text-sm text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded border">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">ID</th>
            <th className="p-3">Job</th>
            <th className="p-3">Candidate</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <tr key={o.id} className="border-b hover:bg-slate-50">
              <td className="p-3 text-xs">{o.id}</td>
              <td className="p-3">{o.job_title}</td>
              <td className="p-3">{o.candidate_first_name} {o.candidate_last_name}</td>
              <td className="p-3">{statusBadge(o.status)}</td>
              <td className="p-3 space-x-2 whitespace-nowrap">
                <Button size="sm" variant="outline" onClick={async() => {
                  const res = await fetch(api(`/api/hr/offers/${o.id}`), { headers: authHeaders as any });
                  const txt = await res.text();
                  toast({ title: 'Offer details', description: txt.substring(0, 200) + (txt.length>200?'...':'') });
                }}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
                {o.status !== 'accepted' && o.status !== 'declined' && (
                  <Button size="sm" className="bg-ehrdc-teal text-white" onClick={() => sendOffer(o.id)}>
                    <Send className="h-4 w-4 mr-1" /> Send
                  </Button>
                )}
                {o.signature_token && (
                  <Button size="sm" variant="outline" onClick={() => copySignUrl(o)}>
                    <LinkIcon className="h-4 w-4 mr-1" /> Copy Link
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      </CardContent>
      </Card>
    </div>
  );
}
