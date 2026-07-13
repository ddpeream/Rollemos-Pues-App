const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

export const LOGIN_VALIDATION_ERROR_CODES = {
  EMAIL_INVALID: 'emailInvalid',
  EMAIL_REQUIRED: 'emailRequired',
  PASSWORD_REQUIRED: 'passwordRequired',
};

export const SIGNUP_VALIDATION_ERROR_CODES = {
  CITY_REQUIRED: 'cityRequired',
  EMAIL_INVALID: 'emailInvalid',
  EMAIL_REQUIRED: 'emailRequired',
  NAME_REQUIRED: 'nameRequired',
  PASSWORD_MISMATCH: 'passwordMismatch',
  PASSWORD_REQUIRED: 'passwordRequired',
  PASSWORD_TOO_SHORT: 'passwordTooShort',
};

export const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_REGISTERED: 'emailAlreadyRegistered',
  EMAIL_NOT_CONFIRMED: 'emailNotConfirmed',
  INVALID_CREDENTIALS: 'invalidCredentials',
};

export const validateLoginForm = ({ email, password }) => {
  if (!email?.trim()) return LOGIN_VALIDATION_ERROR_CODES.EMAIL_REQUIRED;
  if (!EMAIL_REGEX.test(email.trim())) {
    return LOGIN_VALIDATION_ERROR_CODES.EMAIL_INVALID;
  }
  if (!password) return LOGIN_VALIDATION_ERROR_CODES.PASSWORD_REQUIRED;

  return null;
};

export const validateSignupForm = ({
  ciudad,
  confirmPassword,
  email,
  nombre,
  password,
}) => {
  if (!nombre?.trim()) return SIGNUP_VALIDATION_ERROR_CODES.NAME_REQUIRED;
  if (!email?.trim()) return SIGNUP_VALIDATION_ERROR_CODES.EMAIL_REQUIRED;
  if (!EMAIL_REGEX.test(email.trim())) {
    return SIGNUP_VALIDATION_ERROR_CODES.EMAIL_INVALID;
  }
  if (!password) return SIGNUP_VALIDATION_ERROR_CODES.PASSWORD_REQUIRED;
  if (password.length < PASSWORD_MIN_LENGTH) {
    return SIGNUP_VALIDATION_ERROR_CODES.PASSWORD_TOO_SHORT;
  }
  if (password !== confirmPassword) {
    return SIGNUP_VALIDATION_ERROR_CODES.PASSWORD_MISMATCH;
  }
  if (!ciudad?.trim()) return SIGNUP_VALIDATION_ERROR_CODES.CITY_REQUIRED;

  return null;
};

export const getFriendlyAuthErrorCode = (error) => {
  if (!error) return null;

  if (error.includes('Invalid login credentials')) {
    return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
  }

  if (error.includes('Email not confirmed')) {
    return AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED;
  }

  if (error.includes('already registered') || error.includes('User already registered')) {
    return AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED;
  }

  return null;
};

export const getFriendlyAuthError = (error) => {
  const errorCode = getFriendlyAuthErrorCode(error);

  if (errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
    return 'Correo o contrasena incorrectos.';
  }

  if (errorCode === AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED) {
    return 'Confirma tu correo antes de iniciar sesion.';
  }

  if (errorCode === AUTH_ERROR_CODES.EMAIL_ALREADY_REGISTERED) {
    return 'Este correo ya esta registrado.';
  }

  return error;
};
