import { auth as english } from '../en/auth';
import type { MessageShape } from '@/i18n/message-types';

export const auth = {
  login: {
    title: 'С возвращением',
    description: 'Войдите, чтобы продолжить тренировки.',
    submit: 'Войти',
    submitting: 'Вход...',
    emailPlaceholder: 'Введите email',
    passwordPlaceholder: 'Введите пароль',
    demoTitle: 'Демо-аккаунт',
    demoSubmit: 'Войти в демо',
    noAccount: 'Ещё нет аккаунта?',
    createAccount: 'Создать',
    error: 'Не удалось войти.',
  },
  signup: {
    title: 'Создание аккаунта',
    description: 'Начните вести дневник тренировок.',
    submit: 'Создать аккаунт',
    submitting: 'Создание аккаунта...',
    namePlaceholder: 'Введите имя',
    emailPlaceholder: 'Введите email',
    passwordPlaceholder: 'Придумайте пароль',
    hasAccount: 'Уже есть аккаунт?',
    signIn: 'Войти',
    error: 'Не удалось зарегистрироваться.',
  },
  logout: 'Выйти',
  validation: {
    invalidEmail: 'Введите корректный адрес эл. почты',
    nameRequired: 'Введите имя',
    passwordRequired: 'Введите пароль',
    passwordMin: 'Пароль должен содержать не менее 8 символов',
  },
} satisfies MessageShape<typeof english>;
