'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  initial: {
    displayName: string | null;
    sex: string | null;
    heightCm: number | null;
    bodyweight: number | null;
    goal: string | null;
    weeklyFrequency: number | null;
    dateOfBirth: string | null;
    medicalConditions: string | null;
    injuries: string | null;
    experienceLevel: string | null;
  };
};

export function OnboardingForm({ initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: form.displayName || null,
        sex: form.sex || null,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
        bodyweight: form.bodyweight ? Number(form.bodyweight) : null,
        goal: form.goal || null,
        weeklyFrequency: form.weeklyFrequency ? Number(form.weeklyFrequency) : null,
        dateOfBirth: form.dateOfBirth || null,
        medicalConditions: form.medicalConditions || null,
        injuries: form.injuries || null,
        experienceLevel: form.experienceLevel || null,
        onboardingCompleted: true,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? 'Save failed.');
      return;
    }
    router.push('/challenges');
    router.refresh();
  }

  const set = (k: keyof typeof form, v: string | number | null) =>
    setForm((f) => ({ ...f, [k]: v as never }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about you</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={form.displayName ?? ''}
              onChange={(e) => set('displayName', e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={form.dateOfBirth ?? ''}
                onChange={(e) => set('dateOfBirth', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sex</Label>
              <Select value={form.sex ?? ''} onValueChange={(v) => set('sex', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={form.heightCm ?? ''}
                onChange={(e) => set('heightCm', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={form.bodyweight ?? ''}
                onChange={(e) => set('bodyweight', e.target.value === '' ? null : Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="freq">Days / week</Label>
              <Input
                id="freq"
                type="number"
                min={1}
                max={14}
                value={form.weeklyFrequency ?? ''}
                onChange={(e) =>
                  set('weeklyFrequency', e.target.value === '' ? null : Number(e.target.value))
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Training goal</Label>
            <Select value={form.goal ?? ''} onValueChange={(v) => set('goal', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HYPERTROPHY">Hypertrophy</SelectItem>
                <SelectItem value="STRENGTH">Strength</SelectItem>
                <SelectItem value="FAT_LOSS">Fat loss</SelectItem>
                <SelectItem value="RECOMP">Recomp</SelectItem>
                <SelectItem value="GENERAL_FITNESS">General fitness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Experience</Label>
            <Select value={form.experienceLevel ?? ''} onValueChange={(v) => set('experienceLevel', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">Beginner</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                <SelectItem value="ADVANCED">Advanced</SelectItem>
                <SelectItem value="ATHLETE">Athlete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="medical">Medical conditions</Label>
            <Input
              id="medical"
              value={form.medicalConditions ?? ''}
              onChange={(e) => set('medicalConditions', e.target.value)}
              placeholder="Asthma, diabetes, blood pressure..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="injuries">Injuries or pain</Label>
            <Input
              id="injuries"
              value={form.injuries ?? ''}
              onChange={(e) => set('injuries', e.target.value)}
              placeholder="Knee pain, shoulder issue..."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving} className="min-h-tap w-full">
            {saving ? 'Saving...' : 'Save and continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
