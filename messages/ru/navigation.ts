import { navigation as english } from '../en/navigation';
import type { MessageShape } from '@/i18n/message-types';

export const navigation = {
  home: 'Главная',
  challenges: 'Челленджи',
  history: 'История',
  progress: 'Прогресс',
  programs: 'Программы',
  catalog: 'Упражнения',
  admin: 'Админ',
  settings: 'Настройки',
} satisfies MessageShape<typeof english>;
