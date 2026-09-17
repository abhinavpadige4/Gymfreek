import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';

export default async function OnboardingPage() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      displayName: true,
      sex: true,
      heightCm: true,
      bodyweight: true,
      goal: true,
      weeklyFrequency: true,
      dateOfBirth: true,
      medicalConditions: true,
      injuries: true,
      experienceLevel: true,
      onboardingCompleted: true,
    },
  });
  if (user?.onboardingCompleted) redirect('/challenges');

  return (
    <main className="flex-1 px-4 py-6">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Your training profile</h1>
        <p className="text-sm text-muted-foreground">
          Complete profile helps the AI coach understand you. Takes 30 seconds.
        </p>
        <OnboardingForm
          initial={{
            displayName: user?.displayName ?? null,
            sex: user?.sex ?? null,
            heightCm: user?.heightCm ?? null,
            bodyweight: user?.bodyweight ?? null,
            goal: user?.goal ?? null,
            weeklyFrequency: user?.weeklyFrequency ?? null,
            dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
            medicalConditions: user?.medicalConditions ?? null,
            injuries: user?.injuries ?? null,
            experienceLevel: user?.experienceLevel ?? null,
          }}
        />
      </div>
    </main>
  );
}
