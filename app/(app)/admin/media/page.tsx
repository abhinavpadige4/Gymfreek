import { db } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin-page';
import { buildExerciseReadiness } from '@/lib/exercise-readiness';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminMediaCenter } from '@/components/admin/admin-media-center';

// Admin media library: coverage flags per movement with the uploader
// embedded, so missing photos and demo videos get fixed where they are seen.
export default async function AdminMediaPage() {
  await requireAdminPage();
  const uploads = await db.exerciseMediaUpload.findMany({
    select: { name: true, imageMimeType: true, videoUrl: true, videoMimeType: true },
  });
  const rows = buildExerciseReadiness(
    new Map(
      uploads.map((u) => [
        u.name,
        {
          hasPhoto: u.imageMimeType != null,
          hasVideo: u.videoUrl != null || u.videoMimeType != null,
        },
      ]),
    ),
  );

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div>
          <p className="font-display text-sm tracking-[0.3em] text-volt">100XU CONTROL</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Media Library</h1>
        </div>
        <AdminNav />
        <AdminMediaCenter rows={rows} />
      </div>
    </main>
  );
}
