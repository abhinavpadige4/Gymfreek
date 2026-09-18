import { navigation as english } from '../en/navigation';
import type { MessageShape } from '@/i18n/message-types';

export const navigation = {
  home: 'Accueil',
  challenges: 'Défis',
  history: 'Historique',
  progress: 'Progrès',
  programs: 'Programmes',
  catalog: 'Catalogue',
  admin: 'Admin',
  settings: 'Réglages',
} satisfies MessageShape<typeof english>;
