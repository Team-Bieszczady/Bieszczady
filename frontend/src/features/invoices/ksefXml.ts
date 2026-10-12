export interface ParsedKsefInvoice {
  number: string | null;
  sellerName: string | null;
  amount: string | null;
  paymentDate: string | null;
}

// Pliki z KSeF mają kilka wersji schematu (FA(2), FA(3)) i bywają zapisane
// z różnymi przestrzeniami nazw. Dlatego szukamy pól po samej nazwie,
// gdziekolwiek w pliku, i bierzemy to, co się znajdzie.
function findIn(root: Element | Document, tag: string): Element | null {
  const found = root.getElementsByTagNameNS('*', tag);
  return found.length > 0 ? found[0] : null;
}

function textIn(root: Element | Document, tag: string): string | null {
  const element = findIn(root, tag);
  if (!element) return null;

  const text = element.textContent;
  if (text === null) return null;

  const trimmed = text.trim();
  return trimmed === '' ? null : trimmed;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toAmount(value: string | null): string | null {
  if (value === null) return null;

  const normalized = value.replace(',', '.');
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return normalized;
}

function sellerNameOf(doc: Document): string | null {
  // Nazwa sprzedawcy leży w Podmiot1; w Podmiot2 jest nabywca, więc
  // zawężamy szukanie, żeby nie wziąć tej drugiej.
  const seller = findIn(doc, 'Podmiot1');
  if (!seller) return null;

  return textIn(seller, 'Nazwa');
}

function paymentDateOf(doc: Document): string | null {
  const payment = findIn(doc, 'Platnosc');
  const due = payment ? textIn(payment, 'Termin') : null;
  if (due !== null && isIsoDate(due)) return due;

  // Bez terminu płatności zostaje data wystawienia.
  const issued = textIn(doc, 'P_1');
  if (issued !== null && isIsoDate(issued.slice(0, 10))) {
    return issued.slice(0, 10);
  }

  return null;
}

export function parseKsefInvoice(xmlText: string): ParsedKsefInvoice | null {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  } catch {
    return null;
  }

  if (findIn(doc, 'parsererror')) return null;

  const number = textIn(doc, 'P_2');
  const amount = toAmount(textIn(doc, 'P_15'));

  // Bez numeru i bez kwoty to nie wygląda na fakturę z KSeF.
  if (number === null && amount === null) return null;

  return {
    number,
    sellerName: sellerNameOf(doc),
    amount,
    paymentDate: paymentDateOf(doc),
  };
}

export function invoiceNameFrom(parsed: ParsedKsefInvoice): string {
  if (parsed.number !== null && parsed.sellerName !== null) {
    return `${parsed.number} — ${parsed.sellerName}`;
  }
  if (parsed.number !== null) return parsed.number;
  if (parsed.sellerName !== null) return parsed.sellerName;
  return '';
}
