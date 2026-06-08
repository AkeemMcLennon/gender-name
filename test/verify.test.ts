import { describe, it, expect } from 'bun:test';
import { determineNameInfo, getNameByGender, parseNameParts } from '../src/index.js';
import type { Gender, Language } from '../src/index.js';

describe('parseNameParts', () => {
  it('parses a simple first + last name', () => {
    const result = parseNameParts('John Smith');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Smith');
    expect(result.middleName).toBeUndefined();
    expect(result.salutation).toBeUndefined();
    expect(result.suffix).toBeUndefined();
  });

  it('parses salutation', () => {
    const result = parseNameParts('Dr. Jane Doe');
    expect(result.salutation).toBe('Dr.');
    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Doe');
  });

  it('parses suffix', () => {
    const result = parseNameParts('James Brown Jr.');
    expect(result.firstName).toBe('James');
    expect(result.lastName).toBe('Brown');
    expect(result.suffix).toBe('Jr.');
  });

  it('parses middle name', () => {
    const result = parseNameParts('Mary Ann Jones');
    expect(result.firstName).toBe('Mary');
    expect(result.middleName).toBe('Ann');
    expect(result.lastName).toBe('Jones');
  });

  it('parses compound last name', () => {
    const result = parseNameParts('Carlos de la Cruz');
    expect(result.firstName).toBe('Carlos');
    expect(result.lastName).toBe('de la Cruz');
    expect(result.middleName).toBeUndefined();
  });

  it('parses last-name-first format', () => {
    const result = parseNameParts('Smith, John');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Smith');
  });

  it('parses last-name-first with middle name', () => {
    const result = parseNameParts('Smith, John William');
    expect(result.firstName).toBe('John');
    expect(result.middleName).toBe('William');
    expect(result.lastName).toBe('Smith');
  });

  it('parses a single-word name', () => {
    const result = parseNameParts('Madonna');
    expect(result.firstName).toBe('Madonna');
    expect(result.lastName).toBeUndefined();
  });

  it('integrates with determineNameInfo via first name extraction', () => {
    const parts = parseNameParts('Dr. John Smith Jr.');
    expect(parts.firstName).toBe('John');
    const info = determineNameInfo(parts.firstName!);
    expect(info).not.toBeNull();
    expect(info!.gender).toBe('male');
    expect(info!.language).toBe('en');
  });

  it('supports extra salutations via opts', () => {
    const result = parseNameParts('Capt. James Kirk', { extraSalutations: ['capt'] });
    expect(result.salutation).toBe('Capt.');
    expect(result.firstName).toBe('James');
    expect(result.lastName).toBe('Kirk');
  });
});

describe('determineNameInfo', () => {
  const cases: Array<{ input: string; gender: Gender; language: Language }> = [
    { input: 'Juan',  gender: 'male',   language: 'es' },
    { input: 'John',  gender: 'male',   language: 'en' },
    { input: 'Mary',  gender: 'female', language: 'en' },
    { input: 'Maria', gender: 'female', language: 'es' },
    { input: 'Yuki',  gender: 'female', language: 'ja' },
    { input: 'Wei',   gender: 'male',   language: 'zh' },
  ];

  for (const { input, gender, language } of cases) {
    it(`${input} → { gender: '${gender}', language: '${language}' }`, () => {
      const result = determineNameInfo(input);
      expect(result).not.toBeNull();
      expect(result!.gender).toBe(gender);
      expect(result!.language).toBe(language);
    });
  }

  it('returns null for unknown name', () => {
    expect(determineNameInfo('Zzzzxxx')).toBeNull();
  });
});

describe('getNameByGender', () => {
  const genders: Gender[] = ['male', 'female'];
  const languages: Language[] = ['en', 'es', 'fr', 'de', 'it', 'zh', 'ja'];

  for (const gender of genders) {
    for (const language of languages) {
      it(`('${gender}', '${language}') returns a name that resolves back to the same gender and language`, () => {
        const name = getNameByGender(gender, language);
        expect(name).not.toBeNull();
        const info = determineNameInfo(name!);
        expect(info).not.toBeNull();
        expect(info!.gender).toBe(gender);
        expect(info!.language).toBe(language);
      });
    }
  }

  it('defaults to English when language is omitted', () => {
    const name = getNameByGender('male');
    expect(name).not.toBeNull();
    const info = determineNameInfo(name!);
    expect(info!.gender).toBe('male');
    expect(info!.language).toBe('en');
  });

  it('defaults to English when language is null', () => {
    const name = getNameByGender('female', null);
    expect(name).not.toBeNull();
    const info = determineNameInfo(name!);
    expect(info!.gender).toBe('female');
    expect(info!.language).toBe('en');
  });

  it('chooses a random gender when gender is omitted', () => {
    const names = Array.from({ length: 50 }, () => getNameByGender(null, 'en'));
    expect(names.every(n => n !== null)).toBe(true);
    const infos = names.map(n => determineNameInfo(n!));
    expect(infos.every(i => i !== null && i.language === 'en')).toBe(true);
    const gendersFound = new Set(infos.map(i => i!.gender));
    expect(gendersFound.size).toBe(2);
  });

  it('works with no arguments', () => {
    const name = getNameByGender();
    expect(name).not.toBeNull();
    const info = determineNameInfo(name!);
    expect(info).not.toBeNull();
    expect(info!.language).toBe('en');
  });
});
