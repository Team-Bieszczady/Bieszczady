const SEPARATOR = ';';

// Excel rozpoznaje polskie znaki dopiero po tym znaczniku na początku pliku.
const POLISH_LETTERS_MARK = '﻿';

const FORMULA_START = ['=', '+', '-', '@'];

function csvValue(value: string) {
  // Excel bierze tekst zaczynający się od = + - @ za formułę: numer
  // +48-600-100-200 pokazałby jako -852. Apostrof każe mu zostawić tekst.
  let text = value;
  if (FORMULA_START.includes(value.charAt(0))) {
    text = `'${value}`;
  }

  const needsQuotes =
    text.includes(SEPARATOR) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r');

  if (!needsQuotes) {
    return text;
  }

  return `"${text.split('"').join('""')}"`;
}

export function buildCsv(headers: string[], rows: string[][]) {
  const lines = [headers.map(csvValue).join(SEPARATOR)];

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
