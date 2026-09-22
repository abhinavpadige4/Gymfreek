'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Search } from 'lucide-react';
import type { EquipmentType, Exercise, ExerciseCategory, MuscleGroup } from '@/lib/prisma-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExerciseFormDialog } from '@/components/exercises/exercise-form-dialog';
import { ExerciseMediaDialog } from '@/components/exercises/exercise-media-dialog';
import { DeleteExerciseButton } from '@/components/exercises/delete-exercise-button';
import { useExerciseName } from '@/components/shared/use-exercise-name';
import { createAnalyzer } from '@/lib/form-engine/registry';
import {
  equipmentTypeMessageKeys,
  exerciseCategoryMessageKeys,
  muscleGroupMessageKeys,
} from '@/i18n/enum-keys';

interface ExercisesViewProps {
  exercises: Exercise[];
}

const ALL = 'all';

export function ExercisesView({ exercises }: ExercisesViewProps) {
  const t = useTranslations('exercises');
  const common = useTranslations('common');
  const exerciseName = useExerciseName();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | typeof ALL>(ALL);
  const [category, setCategory] = useState<ExerciseCategory | typeof ALL>(ALL);
  const [equipment, setEquipment] = useState<EquipmentType | typeof ALL>(ALL);
  const [ai, setAi] = useState<typeof ALL | 'ready'>(ALL);

  // Case-insensitive substring match on the exercise name plus the selected
  // facet filters. Everything narrows the already-loaded list (no API call);
  // empty query + "All" filters shows everything, preserving the behaviour.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      if (q && !ex.name.toLowerCase().includes(q) && !exerciseName(ex.name).toLowerCase().includes(q)) {
        return false;
      }
      if (muscle !== ALL && ex.muscleGroup !== muscle) return false;
      if (category !== ALL && ex.category !== category) return false;
      if (equipment !== ALL && ex.equipmentType !== equipment) return false;
      if (ai === 'ready' && createAnalyzer(ex.name) === null) return false;
      return true;
    });
  }, [ai, category, equipment, exerciseName, exercises, muscle, query]);

  const grouped = useMemo(() => groupByMuscle(filtered), [filtered]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-sm tracking-[0.3em] text-volt">{t('eyebrow')}</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('subtitle')} {t('savedCount', { count: exercises.length })}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="min-h-tap">
          <Plus className="size-4" />
          <span className="ml-2">{common('actions.add')}</span>
        </Button>
      </div>

      {exercises.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search')}
              aria-label={t('search')}
              className="min-h-tap pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={muscle} onValueChange={(v) => setMuscle(v as MuscleGroup | typeof ALL)}>
              <SelectTrigger className="h-9 w-auto min-w-[10rem]" aria-label={t('muscleGroup')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('all')}</SelectItem>
                {Object.keys(muscleGroupMessageKeys).map((m) => (
                  <SelectItem key={m} value={m}>
                    {t(`muscleGroups.${muscleGroupMessageKeys[m as MuscleGroup]}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => setCategory(v as ExerciseCategory | typeof ALL)}>
              <SelectTrigger className="h-9 w-auto min-w-[10rem]" aria-label={t('category')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('all')}</SelectItem>
                {Object.keys(exerciseCategoryMessageKeys).map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`categories.${exerciseCategoryMessageKeys[c as ExerciseCategory]}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={equipment} onValueChange={(v) => setEquipment(v as EquipmentType | typeof ALL)}>
              <SelectTrigger className="h-9 w-auto min-w-[10rem]" aria-label={t('equipmentType')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('all')}</SelectItem>
                {Object.keys(equipmentTypeMessageKeys).map((e) => (
                  <SelectItem key={e} value={e}>
                    {t(`equipmentTypes.${equipmentTypeMessageKeys[e as EquipmentType]}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ai} onValueChange={(v) => setAi(v as typeof ALL | 'ready')}>
              <SelectTrigger className="h-9 w-auto min-w-[10rem]" aria-label={t('aiTracking')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('aiTracking')}</SelectItem>
                <SelectItem value="ready">{t('aiReady')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {exercises.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('emptyTitle')}</CardTitle>
            <CardDescription>{t('emptyDescription')}</CardDescription>
          </CardHeader>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('noMatchTitle')}</CardTitle>
            <CardDescription>{t('noMatchDescription', { query: query.trim() })}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([group, list]) => (
            <section key={group} className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`muscleGroups.${muscleGroupMessageKeys[group as MuscleGroup]}`)}
                <span className="font-normal normal-case tracking-normal">{list.length}</span>
              </h2>
              <div className="flex flex-col gap-2">
                {list.map((ex) => (
                  <ExerciseRow key={ex.id} exercise={ex} onEdit={() => setEditing(ex)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ExerciseFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" />
      <ExerciseFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        mode="edit"
        exercise={editing ?? undefined}
      />
    </div>
  );
}

function ExerciseRow({ exercise, onEdit }: { exercise: Exercise; onEdit: () => void }) {
  const t = useTranslations('exercises');
  const exerciseName = useExerciseName();
  const displayName = exerciseName(exercise.name);
  const aiReady = createAnalyzer(exercise.name) !== null;

  // Mobile-first card (issue #330). Every tap target is 64px (the `tap` token),
  // so three of them in a trailing column would leave the name ~150px at 400px
  // wide and truncate it first. Instead: a fixed 64px technique slot leads the
  // row, the name takes the remaining width and may wrap to two lines, the
  // equipment label is compact plain text, and edit/delete sit on their own
  // full-width row below (inline again from `sm`).
  return (
    <Card className="transition-colors hover:border-volt/60">
      <CardContent className="flex flex-wrap items-start gap-x-3 gap-y-1 p-3 sm:flex-nowrap">
        <ExerciseMediaDialog
          exerciseName={exercise.name}
          displayName={displayName}
          equipmentType={exercise.equipmentType}
          notes={exercise.notes}
          compact
        />
        <div className="min-w-0 flex-1 basis-40 py-0.5">
          <p className="line-clamp-2 text-sm font-medium leading-snug">
            {displayName}{' '}
            {aiReady && (
              <span className="ml-1 inline-flex items-center gap-1 whitespace-nowrap rounded-sm border border-volt/40 bg-volt/10 px-1.5 py-px align-middle text-[10px] font-bold tracking-wider text-volt">
                <span aria-hidden="true" className="size-1 rounded-full bg-volt" />
                {t('aiReady')}
              </span>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Badge variant="secondary">
              {t(`categories.${exerciseCategoryMessageKeys[exercise.category]}`)}
            </Badge>
            {/* One non-wrapping unit, so the separator never orphans at a line end. */}
            <span className="whitespace-nowrap">
              <span>
                {t(`equipmentTypesShort.${equipmentTypeMessageKeys[exercise.equipmentType] ?? 'other'}`)}
              </span>
              <span aria-hidden="true"> &middot; </span>
              <span>{t('restSeconds', { seconds: exercise.defaultRestSec })}</span>
            </span>
          </div>
          {exercise.notes && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{exercise.notes}</p>
          )}
        </div>
        <div className="-mb-2 -mr-2 -mt-4 flex w-full shrink-0 items-center justify-end sm:-mt-2 sm:w-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label={t('editTitle')}
            className="min-h-tap min-w-tap"
          >
            <Pencil className="size-4" />
          </Button>
          <DeleteExerciseButton exerciseId={exercise.id} exerciseName={displayName} />
        </div>
      </CardContent>
    </Card>
  );
}

function groupByMuscle(exercises: Exercise[]): Record<string, Exercise[]> {
  const out: Record<string, Exercise[]> = {};
  for (const ex of exercises) {
    if (!out[ex.muscleGroup]) out[ex.muscleGroup] = [];
    out[ex.muscleGroup]!.push(ex);
  }
  return out;
}
