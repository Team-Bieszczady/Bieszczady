export function truncateText(text: string, maxLength = 15): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
