export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldState = 'default' | 'focus' | 'error' | 'success';

export type SigninField = 'email' | 'password';

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);

export const isValidPassword = (password: string): boolean =>
  password.length >= 8 && password.length <= 256;

type GetFieldStateParams = {
  isFocused: boolean;
  hasError: boolean;
  isValid: boolean;
  value: string;
  isTouched: boolean;
};

export const getFieldState = ({
  isFocused,
  hasError,
  isValid,
  value,
  isTouched,
}: GetFieldStateParams): FieldState => {
  if (hasError) {
    return 'error';
  }

  if (isFocused) {
    return 'focus';
  }

  if (isTouched && isValid && value.length > 0) {
    return 'success';
  }

  return 'default';
};
