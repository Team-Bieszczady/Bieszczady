const SEPARATOR = ';';
const POLISH_LETTERS_MARK = '﻿';

function csvValue(value: string) {
  const needsQuotes =
    value.includes(SEPARATOR) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');

  if (!needsQuotes) {
    return value;
  }

  return `"${value.split('"').join('""')}"`;
}

export function buildCsv(header: string, rows: string[][]) {
  const lines = [header];

  for (const row of rows) {
    lines.push(row.map(csvValue).join(SEPARATOR));
  }

  return POLISH_LETTERS_MARK + lines.join('\r\n');
}

export function safeFileNamePart(text: string) {
  return text
    .split(/[<>:"/\\|?*]/)
    .join('-')
    .trim();
}

export function downloadCsv(text: string, fileName: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
