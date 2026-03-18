import { nameData, Gender, Language } from './data.js';

export type { Gender, Language };

export interface NameInfo {
  name: string;
  gender: Gender;
  language: Language;
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
