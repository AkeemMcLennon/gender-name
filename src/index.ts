import { nameData, Gender, Language } from './data.js';

export type { Gender, Language };

export interface NameInfo {
  name: string;
  gender: Gender;
  language: Language;
}

export interface NameParts {
  salutation?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  fullName?: string;
}

export interface ParseNameOpts {
  extraSalutations?: string[];
  extraSuffixes?: string[];
  extraCompound?: string[];
  ignoreSalutation?: string[];
  ignoreSuffix?: string[];
  ignoreCompound?: string[];
}

const LANGUAGE_PRIORITY: Language[] = ['es', 'it', 'fr', 'de', 'zh', 'ja', 'en'];

function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function pickLanguage(languages: Language[]): Language {
  for (const lang of LANGUAGE_PRIORITY) {
    if (languages.includes(lang)) return lang;
  }
  return languages[0];
}

export function determineNameInfo(name: string): NameInfo | null {
  const normalized = name.trim().toLowerCase();
  const entry = nameData[normalized];
  if (!entry) return null;

  const language = pickLanguage(entry.languages);
  return { name: capitalize(normalized), gender: entry.gender, language };
}

export function parseNameParts(name: string, opts: ParseNameOpts = {}): NameParts {
  const BASE_SALUTATIONS = ['mr', 'master', 'mister', 'mrs', 'miss', 'ms', 'dr', 'prof', 'rev', 'fr', 'judge', 'honorable', 'hon', 'tuan', 'sr', 'srta', 'br', 'pr', 'mx', 'sra'];
  const BASE_SUFFIXES = ['i', 'ii', 'iii', 'iv', 'v', 'senior', 'junior', 'jr', 'sr', 'phd', 'apr', 'rph', 'pe', 'md', 'ma', 'dmd', 'cme', 'qc', 'kc'];
  const BASE_COMPOUND = ['vere', 'von', 'van', 'de', 'del', 'della', 'der', 'den', 'di', 'da', 'pietro', 'vanden', 'du', 'st.', 'st', 'la', 'lo', 'ter', 'bin', 'ibn', 'te', 'ten', 'op', 'ben', 'al'];

  const lc = (v: string) => v.toLowerCase();

  const extraSalutations = (opts.extraSalutations ?? []).map(lc);
  const extraSuffixes = (opts.extraSuffixes ?? []).map(lc);
  const extraCompound = (opts.extraCompound ?? []).map(lc);
  const ignoreSalutation = (opts.ignoreSalutation ?? []).map(lc);
  const ignoreSuffix = (opts.ignoreSuffix ?? []).map(lc);
  const ignoreCompound = (opts.ignoreCompound ?? []).map(lc);

  const salutations = [...BASE_SALUTATIONS, ...extraSalutations].filter(s => !ignoreSalutation.includes(s));
  const suffixes = [...BASE_SUFFIXES, ...extraSuffixes].filter(s => !ignoreSuffix.includes(s));
  const compound = [...BASE_COMPOUND, ...extraCompound].filter(c => !ignoreCompound.includes(c));

  const normalize = (s: string) => s.toLowerCase().replace(/\./g, '');

  const normalized = name
    .trim()
    .replace(/\b\s+(,\s+)\b/, '$1')
    .replace(/\b,\b/, ', ');

  const quoted = normalized.match(/[^\s"]+|"[^"]+"/g);
  const splitParts: string[] = quoted
    ? quoted.map(n => (n.match(/^".*"$/) ? n.slice(1, -1) : n))
    : normalized.split(/\s+/);

  const attrs: NameParts = {};

  if (!splitParts.length) return attrs;

  if (splitParts.length === 1) {
    attrs.firstName = splitParts[0];
    return attrs;
  }

  // Handle suffix first — always check trailing token
  if (suffixes.includes(normalize(splitParts[splitParts.length - 1]))) {
    attrs.suffix = splitParts.pop()!;
    splitParts[splitParts.length - 1] = splitParts[splitParts.length - 1].replace(',', '');
  }

  const isFirstNameFirst = splitParts.every(p => !p.includes(','));

  if (!isFirstNameFirst) {
    // Last-name-first format: "Smith, John Middle"
    let firstNameIndex = 0;
    const lastNameParts: string[] = [];

    for (let i = 0; i < splitParts.length; i++) {
      const part = splitParts[i];
      if (!part.includes(',')) {
        lastNameParts.push(part);
      } else {
        const stripped = part.replace(',', '');
        if (suffixes.includes(normalize(stripped))) {
          attrs.suffix = stripped;
        } else {
          lastNameParts.push(stripped);
        }
        firstNameIndex = i + 1;
        break;
      }
    }

    attrs.lastName = lastNameParts.join(' ');
    const remaining = splitParts.slice(firstNameIndex);
    if (remaining.length > 1) {
      attrs.firstName = remaining[0];
      attrs.middleName = remaining.slice(1).join(' ');
    } else if (remaining.length === 1) {
      attrs.firstName = remaining[0];
    }

    const nameWords: string[] = [];
    if (attrs.firstName) nameWords.push(attrs.firstName);
    if (attrs.middleName) nameWords.push(attrs.middleName);
    if (attrs.lastName) nameWords.push(attrs.lastName);
    if (attrs.suffix) nameWords.push(attrs.suffix);
    attrs.fullName = nameWords.join(' ');
  } else {
    // First-name-first format
    if (splitParts.length > 1 && salutations.includes(normalize(splitParts[0]))) {
      attrs.salutation = splitParts.shift()!;
      if (splitParts.length === 1) {
        attrs.lastName = splitParts.shift()!;
      } else {
        attrs.firstName = splitParts.shift()!;
      }
    } else {
      attrs.firstName = splitParts.shift()!;
    }

    if (!attrs.lastName) {
      attrs.lastName = splitParts.length ? splitParts.pop()! : '';
    }

    // Detect compound last name from right-to-left in remaining middle parts
    const revParts = [...splitParts].reverse();
    const compoundParts: string[] = [];
    for (const part of revParts) {
      if (compound.includes(normalize(part))) {
        compoundParts.push(part);
      } else {
        break;
      }
    }

    if (compoundParts.length) {
      attrs.lastName = compoundParts.reverse().join(' ') + ' ' + attrs.lastName;
      // Remove compound parts from splitParts
      for (const cp of compoundParts) {
        const idx = splitParts.lastIndexOf(cp);
        if (idx !== -1) splitParts.splice(idx, 1);
      }
    }

    if (splitParts.length) {
      attrs.middleName = splitParts.join(' ');
    }

    if (attrs.lastName) {
      attrs.lastName = attrs.lastName.replace(',', '');
    }

    attrs.fullName = name;
  }

  for (const key of Object.keys(attrs) as (keyof NameParts)[]) {
    if (attrs[key]) {
      (attrs as Record<string, string>)[key] = (attrs[key] as string).trim();
    }
  }

  return attrs;
}

export function getNameByGender(gender?: Gender | null, language?: Language | null): string | null {
  const resolvedLanguage: Language = language || 'en';
  const resolvedGender: Gender = gender || (Math.random() < 0.5 ? 'male' : 'female');
  const candidates = Object.entries(nameData).filter(
    ([, entry]) =>
      entry.gender === resolvedGender &&
      entry.languages.includes(resolvedLanguage) &&
      pickLanguage(entry.languages) === resolvedLanguage
  );
  if (candidates.length === 0) return null;
  const [name] = candidates[Math.floor(Math.random() * candidates.length)];
  return capitalize(name);
}
