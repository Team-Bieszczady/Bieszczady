export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();

  const surname = parts[parts.length - 1];
  return `${parts.slice(0, -1).join(' ')} ${surname.charAt(0)}.`;
}
