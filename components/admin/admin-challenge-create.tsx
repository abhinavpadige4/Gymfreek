'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Admin challenge creation. Days and tasks come from the blueprint seed
// (npm run db:seed:challenge); price is entered in rupees.
export function AdminChallengeCreate() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('2999');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const pricePaise = Math.round(Number(price) * 100);
      if (!Number.isFinite(pricePaise) || pricePaise < 0) throw new Error('Enter a valid price.');
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), slug: slug.trim(), pricePaise }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? 'Create failed.');
      setTitle('');
      setSlug('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New challenge</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-challenge-title">Title</Label>
            <Input
              id="admin-challenge-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="100XU - Spring Sprint"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-challenge-slug">Slug</Label>
            <Input
              id="admin-challenge-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="spring-sprint"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-challenge-price">Price (Rs)</Label>
            <Input
              id="admin-challenge-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2999"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Days and tasks come from the blueprint seed. Use 0 for a free challenge.
        </p>
        <div>
          <Button type="button" disabled={busy} onClick={() => void create()}>
            {busy ? 'Creating...' : 'Create challenge'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
