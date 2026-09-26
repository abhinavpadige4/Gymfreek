'use client';

import { useRef, useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Optional profile photo, stored as bytes on User. Separate from the bitmoji:
// the bitmoji stays the public avatar, the photo is for the profile and admin.
export function PhotoUpload({ hasPhoto: initial }: { hasPhoto: boolean }) {
  const [hasPhoto, setHasPhoto] = useState(initial);
  const [pending, setPending] = useState(false);
  const [cacheBust, setCacheBust] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error('Photo must be jpeg, png or webp.');
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error('Photo must be under 500KB.');
      return;
    }
    setPending(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error('Read failed.'));
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/profile/photo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setHasPhoto(true);
      setCacheBust((v) => v + 1);
      toast.success('Photo saved.');
    } catch {
      toast.error('Photo save failed.');
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    try {
      const res = await fetch('/api/profile/photo', { method: 'DELETE' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setHasPhoto(false);
      toast.success('Photo removed.');
    } catch {
      toast.error('Photo remove failed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {hasPhoto ? (
        // ponytail: plain img, photo bytes vary in size and skip the optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/profile/photo?t=${cacheBust}`}
          alt="Your photo"
          className="h-14 w-14 rounded-full border object-cover"
        />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-full border bg-muted text-xs text-muted-foreground">
          No photo
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium">Your photo</p>
        <p className="text-xs text-muted-foreground">Optional. Only you and admins see it.</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void upload(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            <span className="ml-2">{hasPhoto ? 'Replace' : 'Upload'}</span>
          </Button>
          {hasPhoto && (
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => void remove()}>
              <Trash2 className="size-4" />
              <span className="ml-2">Remove</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
