import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/EnhancedLanguageContext';
import { restClient } from '@/utils/api';
import { FileText, Upload, Download, Check, Trash2, Loader2, ShieldCheck } from 'lucide-react';

/**
 * Minutes for one board meeting.
 *
 * Shared by the secretary workspace and the board member dashboard so both see
 * the same versions, statuses and wording — the owner's ruling is that members,
 * the secretary and Administrators all read the same archive, including drafts.
 *
 * The capability flags below mirror the server's role sets. They decide which
 * BUTTONS are drawn, nothing more: every action is authorised again server-side
 * by `require_roles`. Hiding a control the server would refuse is a courtesy,
 * not a guard.
 */

const ADMIN_ROLES = ['admin', 'administrator', 'super_user', 'super_admin', 'platform_administrator'];
const ORGANISER_ROLES = [...ADMIN_ROLES, 'platform_operator', 'board_operator'];

const MAX_BYTES = 50 * 1024 * 1024;

interface Minute {
  id: string;
  filename: string;
  size_bytes: number;
  sha256: string;
  version: number;
  status: 'draft' | 'approved' | 'superseded';
  uploaded_at: string | null;
  approved_at: string | null;
}

const BoardMinutesPanel: React.FC<{ meetingId: string; compact?: boolean }> = ({ meetingId, compact }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const b = (en: string, ar: string) => (isRTL ? ar : en);

  const roles = [(user as any)?.role, ...(((user as any)?.secondary_roles) || [])]
    .filter(Boolean).map((r: string) => String(r).toLowerCase());
  const canUpload = roles.some((r) => ORGANISER_ROLES.includes(r));
  const canDelete = roles.some((r) => ADMIN_ROLES.includes(r));

  const [items, setItems] = useState<Minute[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await restClient.get(`/api/board/meetings/${meetingId}/minutes`);
      setItems(res.data?.data || []);
    } catch {
      // Distinguished from "no minutes": null means we could not ask, and the
      // panel says so rather than implying the meeting has no minutes.
      setItems(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [meetingId]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';   // let the same file be re-picked after a failure
    if (!file) return;

    // Checked here purely so the user hears it immediately; the server enforces
    // both rules again, including the magic bytes a filename cannot prove.
    if (file.size > MAX_BYTES) {
      toast({
        title: b('That file is too large', 'الملف كبير جداً'),
        description: b(`Minutes must be 50 MB or less. This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
                       `يجب ألا يتجاوز حجم المحضر ٥٠ ميغابايت. حجم هذا الملف ${(file.size / 1024 / 1024).toFixed(1)} ميغابايت.`),
        variant: 'destructive',
      });
      return;
    }
    if (file.type !== 'application/pdf') {
      toast({
        title: b('Only PDF files are accepted', 'يُقبل ملف PDF فقط'),
        description: b('Minutes are kept as a permanent record, so they must be in a format that will render the same years from now.',
                       'تُحفظ المحاضر كسجل دائم، لذا يجب أن تكون بصيغة تُعرض بالشكل نفسه بعد سنوات.'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await restClient.post(`/api/board/meetings/${meetingId}/minutes`, fd);
      const d = res.data?.data || {};
      toast({
        title: d.superseded_version
          ? b(`Version ${d.version} saved — version ${d.superseded_version} was superseded, not replaced`,
              `تم حفظ النسخة ${d.version} — حلّت محل النسخة ${d.superseded_version} دون حذفها`)
          : b('Minutes saved', 'تم حفظ المحضر'),
        description: d.superseded_version
          ? b('The earlier version stays in the archive and can still be downloaded.',
              'تبقى النسخة السابقة في الأرشيف ويمكن تنزيلها.')
          : undefined,
      });
      load();
    } catch (err: any) {
      toast({
        title: err?.response?.data?.message || b('Could not save the minutes', 'تعذّر حفظ المحضر'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const download = async (m: Minute) => {
    setBusyId(m.id);
    try {
      // Streamed through the backend rather than a link to storage, so every
      // read passes the role check.
      const res = await restClient.get(`/api/board/meetings/minutes/${m.id}/download`,
                                       { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = m.filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: b('Could not download the minutes', 'تعذّر تنزيل المحضر'),
        description: b('If this keeps happening, the stored file may have failed its integrity check — report it rather than relying on another copy.',
                       'إذا تكرر ذلك، فقد يكون الملف المخزّن قد فشل في فحص السلامة — أبلغ عن ذلك بدل الاعتماد على نسخة أخرى.'),
        variant: 'destructive',
      });
    } finally { setBusyId(null); }
  };

  const approve = async (m: Minute) => {
    setBusyId(m.id);
    try {
      await restClient.post(`/api/board/meetings/minutes/${m.id}/approve`, {});
      toast({ title: b(`Version ${m.version} marked approved`, `تم اعتماد النسخة ${m.version}`) });
      load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || b('Could not approve', 'تعذّر الاعتماد'),
              variant: 'destructive' });
    } finally { setBusyId(null); }
  };

  const remove = async (m: Minute) => {
    const reason = window.prompt(b(
      `Delete version ${m.version} of these minutes?\n\nThe record of the deletion — who and when — is kept permanently. Please give a reason:`,
      `حذف النسخة ${m.version} من هذا المحضر؟\n\nيُحفظ سجل الحذف (من ومتى) بشكل دائم. يرجى ذكر السبب:`));
    if (reason === null) return;
    setBusyId(m.id);
    try {
      await restClient.delete(`/api/board/meetings/minutes/${m.id}`, { data: { reason } });
      toast({
        title: b('Minutes deleted', 'تم حذف المحضر'),
        description: b('The deletion has been recorded against your name.',
                       'تم تسجيل عملية الحذف باسمك.'),
      });
      load();
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || b('Could not delete', 'تعذّر الحذف'),
              variant: 'destructive' });
    } finally { setBusyId(null); }
  };

  const statusChip = (s: Minute['status']) => {
    const map = {
      approved:   ['bg-green-50 text-green-800 border-green-200', b('Approved', 'معتمد')],
      draft:      ['bg-amber-50 text-amber-800 border-amber-200', b('Draft', 'مسودة')],
      superseded: ['bg-gray-50 text-gray-600 border-gray-200', b('Superseded', 'مُستبدل')],
    } as const;
    const [cls, label] = map[s] || map.draft;
    return <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>{label}</span>;
  };

  const kb = (n: number) => (n < 1024 * 1024
    ? `${Math.max(1, Math.round(n / 1024))} KB`
    : `${(n / 1024 / 1024).toFixed(1)} MB`);

  return (
    <div className={compact ? 'mt-3 border-t pt-3' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-ehrdc-teal" />
          {b('Minutes', 'المحاضر')}
        </p>
        {canUpload && (
          <label className="inline-flex">
            <input type="file" accept="application/pdf,.pdf" className="sr-only"
                   onChange={onPick} disabled={uploading} />
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs cursor-pointer
                              hover:bg-gray-50 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {items && items.length
                ? b('Upload a correction', 'رفع نسخة مصححة')
                : b('Upload minutes (PDF)', 'رفع المحضر (PDF)')}
            </span>
          </label>
        )}
      </div>

      {loading && items === null ? (
        <p className="text-xs text-gray-500">{b('Loading…', 'جارٍ التحميل…')}</p>
      ) : items === null ? (
        <p className="text-xs text-gray-500">
          {b('The minutes for this meeting could not be loaded just now.',
             'تعذّر تحميل محاضر هذا الاجتماع في الوقت الحالي.')}
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs text-gray-500">
          {canUpload
            ? b('No minutes uploaded for this meeting yet.', 'لم يُرفع محضر لهذا الاجتماع بعد.')
            : b('No minutes have been uploaded for this meeting yet.', 'لم يُرفع محضر لهذا الاجتماع بعد.')}
        </p>
      ) : (
        <div className="space-y-1.5">
          {items.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-md border bg-white px-2.5 py-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium text-gray-900">{m.filename}</span>
                  {statusChip(m.status)}
                </div>
                <p className="text-[11px] text-gray-500">
                  {b(`Version ${m.version}`, `النسخة ${m.version}`)} · {kb(m.size_bytes)}
                  {m.uploaded_at ? ` · ${new Date(m.uploaded_at).toLocaleDateString(isRTL ? 'ar-AE' : 'en-GB')}` : ''}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-7 px-2" title={b('Download', 'تنزيل')}
                      disabled={busyId === m.id} onClick={() => download(m)}>
                {busyId === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              </Button>
              {canUpload && m.status === 'draft' && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-green-700"
                        title={b('Mark approved', 'اعتماد')}
                        disabled={busyId === m.id} onClick={() => approve(m)}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600"
                        title={b('Delete (Administrator only)', 'حذف (للمسؤول فقط)')}
                        disabled={busyId === m.id} onClick={() => remove(m)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stated once, where it is relevant: a corrected minute does not erase
          the one the board actually saw. */}
      {canUpload && items && items.length > 0 && (
        <p className="text-[11px] text-gray-500 flex items-start gap-1">
          <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0" />
          {b('Uploading a correction adds a new version; earlier versions stay in the archive and remain downloadable.',
             'رفع نسخة مصححة يضيف نسخة جديدة؛ وتبقى النسخ السابقة في الأرشيف وقابلة للتنزيل.')}
        </p>
      )}
    </div>
  );
};

export default BoardMinutesPanel;
