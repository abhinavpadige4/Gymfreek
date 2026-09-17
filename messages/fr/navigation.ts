import { navigation as english } from '../en/navigation';
import type { MessageShape } from '@/i18n/message-types';

export const navigation = {
  home: 'Accueil',
  challenges: 'Défis',
  history: 'Historique',
  progress: 'Progrès',
  coach: 'Coach',
  chat: 'Chat',
  programs: 'Programmes',
  catalog: 'Catalogue',
  admin: 'Admin',
  settings: 'Réglages',
} satisfies MessageShape<typeof english>;
