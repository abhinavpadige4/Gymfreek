import { auth as english } from '../en/auth';
import type { MessageShape } from '@/i18n/message-types';

export const auth = {
  login: {
    title: 'Bon retour',
    description: 'Connectez-vous pour reprendre votre entraînement.',
    submit: 'Se connecter',
    submitting: 'Connexion...',
    emailPlaceholder: 'Entrez votre email',
    passwordPlaceholder: 'Entrez votre mot de passe',
    demoTitle: 'Compte démo',
    demoSubmit: 'Entrer en démo',
    noAccount: 'Pas encore de compte ?',
    createAccount: 'En créer un',
    error: 'Erreur de connexion.',
  },
  signup: {
    title: 'Créer un compte',
    description: 'Commencez à suivre vos entraînements.',
    submit: 'Créer le compte',
    submitting: 'Création du compte...',
    namePlaceholder: 'Entrez votre nom',
    emailPlaceholder: 'Entrez votre email',
    passwordPlaceholder: 'Créez un mot de passe',
    hasAccount: 'Déjà un compte ?',
    signIn: 'Se connecter',
    error: 'Erreur lors de l’inscription.',
  },
  logout: 'Se déconnecter',
  validation: {
    invalidEmail: 'Email invalide',
    nameRequired: 'Nom requis',
    passwordRequired: 'Mot de passe requis',
    passwordMin: 'Le mot de passe doit contenir au moins 8 caractères',
  },
} satisfies MessageShape<typeof english>;
