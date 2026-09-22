import { dashboard as english } from '../en/dashboard';
import type { MessageShape } from '@/i18n/message-types';

export const dashboard = {
  welcomeBack: 'С ВОЗВРАЩЕНИЕМ',
  greeting: 'Привет, {name}',
  heroSubtitle: 'Регулярность сегодня. Более сильный вы завтра.',
  challengeEyebrow: 'ЧЕЛЛЕНДЖ 100XU',
  challengeTitle: '100 дней. Более сильный вы.',
  challengeDescription: 'Ежедневные задания, ИИ-контроль техники и реальный прогресс.',
  viewChallenges: 'Открыть челленджи',
  trainingProfile: 'Профиль тренировок',
  heaviestSet: '{name} - {weight} кг',
  quickActions: 'Быстрые действия',
  startWorkout: 'Начать тренировку',
  startWorkoutDescription: 'Перейти к тренировке',
  viewProgress: 'Открыть прогресс',
  viewProgressDescription: 'Графики и рекорды',
  browsePrograms: 'Открыть программы',
  browseProgramsDescription: 'Структурные планы',
  joinChallenge: 'Присоединиться к челленджу',
  joinChallengeDescription: '100 дней. 1 000 повторов в день.',
  yourStats: 'Ваша статистика',
  statWorkouts: 'Тренировки',
  statReps: 'Всего повторов',
  statMinutes: 'Минут активности',
  activeSession: 'Активная тренировка',
  sessionFallback: 'Тренировка',
  startedOn: '{name}, начало: {date}',
  resumeSession: 'Продолжить тренировку',
  noActiveProgram: 'Нет активной программы',
  noActiveProgramDescription: 'Активируйте программу, чтобы начать тренировку.',
  viewPrograms: 'Открыть программы',
  emptyProgram: 'Пустая программа',
  emptyProgramDescription: 'В программе «{name}» не настроены тренировки.',
  configureProgram: 'Настроить программу',
  startSession: 'Начать тренировку',
  activeProgram: 'Активная программа: {name}',
  chooseSession: 'Выбрать тренировку',
  programSessions: 'Тренировки программы',
  insight: {
    deloadTitle: 'Похоже, пора восстановиться',
    stalledTitle:
      '{count, plural, one {Прогресс в упражнении остановился} few {Прогресс остановился в # упражнениях} many {Прогресс остановился в # упражнениях} other {Прогресс остановился в # упражнения}}',
    stalledDetail:
      '{count, plural, one {В упражнении «{names}» в последнее время нет прогресса. Небольшое изменение веса, повторов или техники может помочь.} few {В упражнениях {names} в последнее время нет прогресса. Откройте страницу прогресса, чтобы выбрать корректировку.} many {В упражнениях {names} в последнее время нет прогресса. Откройте страницу прогресса, чтобы выбрать корректировку.} other {В упражнениях {names} в последнее время нет прогресса. Откройте страницу прогресса, чтобы выбрать корректировку.}}',
    prTitle: 'Новый личный рекорд',
    prWeightDetail: 'На последней тренировке установлен новый рекорд веса в упражнении «{name}».',
    prOneRmDetail: 'На последней тренировке установлен новый расчётный 1ПМ в упражнении «{name}».',
    consistentTitle: 'Вы тренируетесь регулярно',
    consistentDetail:
      'На этой неделе: {count, plural, one {# тренировочный день} few {# тренировочных дня} many {# тренировочных дней} other {# тренировочного дня}}. Продолжайте в том же режиме.',
    deloadStalledReason:
      '{count, plural, one {Прогресс остановился в # упражнении: {names}.} few {Прогресс остановился в # упражнениях: {names}.} many {Прогресс остановился в # упражнениях: {names}.} other {Прогресс остановился в # упражнения: {names}.}}',
    deloadReadinessReason:
      'Средняя готовность за последние {checkins, plural, one {# оценку} few {# оценки} many {# оценок} other {# оценки}} составляет {average}/5.',
  },
} satisfies MessageShape<typeof english>;
