import { requireAdminPage } from '@/lib/admin-page';
import { getSiteSettings } from '@/lib/site-settings';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminSettingsForm } from '@/components/admin/admin-settings-form';

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const initial = await getSiteSettings();

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <AdminNav />
        <div>
          <h1 className="font-display text-3xl tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Support contact and legal text. Live on the site as soon as you save.
          </p>
        </div>
        <AdminSettingsForm initial={initial} />
      </div>
    </main>
  );
}
