export interface CsvVolunteerRow {
  lastName: string;
  firstName: string;
  phone?: string;
}

const HEADER_ALIASES: Record<string, keyof CsvVolunteerRow> = {
  nom: "lastName",
  prenom: "firstName",
  prénom: "firstName",
  telephone: "phone",
  téléphone: "phone",
  tel: "phone",
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseVolunteersCsv(content: string): {
  rows: CsvVolunteerRow[];
  errors: string[];
} {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: ["Fichier CSV vide"] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const columnMap: Partial<Record<keyof CsvVolunteerRow, number>> = {};

  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[h];
    if (key) columnMap[key] = i;
  });

  const errors: string[] = [];
  if (columnMap.lastName === undefined) errors.push("Colonne « nom » manquante");
  if (columnMap.firstName === undefined) errors.push("Colonne « prenom » manquante");

  if (errors.length > 0) return { rows: [], errors };

  const rows: CsvVolunteerRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const lastName = fields[columnMap.lastName!]?.trim();
    const firstName = fields[columnMap.firstName!]?.trim();
    const phone =
      columnMap.phone !== undefined
        ? fields[columnMap.phone]?.trim() || undefined
        : undefined;

    if (!lastName && !firstName) continue;
    if (!lastName || !firstName) {
      errors.push(`Ligne ${i + 1} : nom et prénom requis`);
      continue;
    }

    rows.push({ lastName, firstName, phone });
  }

  return { rows, errors };
}
