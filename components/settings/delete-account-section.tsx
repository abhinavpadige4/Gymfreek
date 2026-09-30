'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Danger zone: type your email, confirm, and the account plus all personal
// data is erased (DELETE /api/account). Export first via Import/Backup if
// you want a copy - deletion cannot be undone.
export function DeleteAccountSection({ email }: { email: string }) {
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [busy, setBusy] = useState(false);

  async function erase() {
    setBusy(true);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? 'Deletion failed.');
        return;
      }
      toast.success('Account deleted.');
      router.replace('/signup');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-3">
        <h2 className="text-base font-semibold text-destructive">Delete account</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">
          Permanently erases your profile, training data, AI records, badges, and uploads.
          Payment records stay with Razorpay as required by financial law. This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="min-h-tap w-fit">
              Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                Type your account email ({email}) to confirm permanent erasure.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              type="email"
              autoComplete="email"
              placeholder={email}
              aria-label="Confirm account email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="min-h-tap"
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-tap">Keep my account</AlertDialogCancel>
              <AlertDialogAction
                onClick={erase}
                disabled={busy || confirmEmail.trim().toLowerCase() !== email.toLowerCase()}
                className="min-h-tap bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {busy ? 'Deleting...' : 'Delete forever'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
