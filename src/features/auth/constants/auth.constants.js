export const SKATING_LEVELS = [
  { id: 'principiante', translationKey: 'auth.signup.levels.beginner' },
  { id: 'intermedio', translationKey: 'auth.signup.levels.intermediate' },
  { id: 'avanzado', translationKey: 'auth.signup.levels.advanced' },
  { id: 'profesional', translationKey: 'auth.signup.levels.professional' },
];

export const SKATING_DISCIPLINES = [
  { id: 'street', translationKey: 'auth.signup.disciplines.street' },
  { id: 'park', translationKey: 'auth.signup.disciplines.park' },
  { id: 'freestyle', translationKey: 'auth.signup.disciplines.freestyle' },
  { id: 'speed', translationKey: 'auth.signup.disciplines.speed' },
  { id: 'downhill', translationKey: 'auth.signup.disciplines.downhill' },
  { id: 'cruising', translationKey: 'auth.signup.disciplines.cruising' },
];

export const createSignupInitialForm = () => ({
  bio: '',
  ciudad: '',
  confirmPassword: '',
  disciplina: SKATING_DISCIPLINES[0].id,
  email: '',
  nivel: SKATING_LEVELS[0].id,
  nombre: '',
  password: '',
});
