export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^[\d +()-]*$/;

export function emailOrEmpty(value: string) {
  if (value.trim() === '') {
    return true;
  }

  if (EMAIL_PATTERN.test(value.trim())) {
    return true;
  }

  return 'Podaj poprawny adres e-mail';
}
