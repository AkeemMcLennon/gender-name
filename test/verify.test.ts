import { describe, it, expect } from 'bun:test';
import { determineNameInfo, getNameByGender } from '../src/index.js';
import type { Gender, Language } from '../src/index.js';

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
