'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SiteSettingKey } from '@/lib/site-settings';

const FIELDS: { key: SiteSettingKey; label: string; multiline?: boolean; placeholder: string }[] = [
  { key: 'businessName', label: 'Business name', placeholder: '[LEGAL BUSINESS NAME]' },
  { key: 'contactEmail', label: 'Support email', placeholder: '[CONTACT EMAIL]' },
  { key: 'supportPhone', label: 'Support phone', placeholder: '[SUPPORT PHONE]' },
  { key: 'supportHours', label: 'Support hours', placeholder: 'Mon-Sat 10:00-18:00 IST' },
  { key: 'registeredAddress', label: 'Registered address', placeholder: '[REGISTERED ADDRESS]' },
  { key: 'governingLaw', label: 'Governing law', placeholder: '[GOVERNING LAW / JURISDICTION]' },
  { key: 'refundPolicy', label: 'Refund policy', multiline: true, placeholder: 'Full refund within 7 days...' },
];

// App content the admin owns: support contact, business details, and the
// refund text shown on /terms /privacy /refunds /support. Saves to the DB,
// pages pick it up live - no redeploy. Empty = env placeholder shows.
export function AdminSettingsForm({ initial }: { initial: Record<SiteSettingKey, string> }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? 'Save failed.');
      toast.success('Settings saved. Legal pages update immediately.');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Site content</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={`setting-${f.key}`}>{f.label}</Label>
            {f.multiline ? (
              <textarea
                id={`setting-${f.key}`}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={3}
                className="min-h-tap w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            ) : (
              <Input
                id={`setting-${f.key}`}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="min-h-tap"
              />
            )}
          </div>
        ))}
        <Button type="button" onClick={() => void save()} disabled={busy} className="min-h-tap w-fit">
          {busy ? 'Saving...' : 'Save settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
