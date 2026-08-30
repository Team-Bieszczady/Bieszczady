const PASSWORD_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

export function generatePassword(length = 16): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  return Array.from(
    values,
    (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length],
  ).join('');
}
