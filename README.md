# gender-name

A TypeScript library for detecting a first name's likely gender and language origin, with support for common nicknames and abbreviations. Also supports inverse lookup: get a random name for a given gender and language.

## Languages

`en` · `es` · `fr` · `de` · `it` · `zh` · `ja`

## Installation

```bash
bun add gender-name
```

## Usage

### `determineNameInfo(name)`

Returns the gender and language for a given name, or `null` if the name is not in the database.

```ts
import { determineNameInfo } from 'gender-name';

determineNameInfo('Juan');  // { name: 'Juan',  gender: 'male',   language: 'es' }
determineNameInfo('Mary');  // { name: 'Mary',  gender: 'female', language: 'en' }
determineNameInfo('Yuki');  // { name: 'Yuki',  gender: 'female', language: 'ja' }
determineNameInfo('Matt');  // { name: 'Matt',  gender: 'male',   language: 'en' }
determineNameInfo('Bob');   // { name: 'Bob',   gender: 'male',   language: 'en' }
determineNameInfo('Xyz');   // null
```

Input is case-insensitive and whitespace-trimmed.

When a name exists in multiple languages, origin is resolved by priority: `es > it > fr > de > zh > ja > en`.

### `getNameByGender(gender?, language?)`

Returns a random name for the given gender and language. Both arguments are optional.

```ts
import { getNameByGender } from 'gender-name';

getNameByGender('female', 'es');  // e.g. 'Carmen'
getNameByGender('male', 'ja');    // e.g. 'Haruki'
getNameByGender('male');          // random English male name
getNameByGender('female', null);  // random English female name
getNameByGender();                // random English name, gender chosen at random
```

- If `language` is falsy, defaults to `'en'`
- If `gender` is falsy, a gender is chosen at random

Returns `null` if no names are found for the given combination.

## Types

```ts
type Gender   = 'male' | 'female';
type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'zh' | 'ja';

interface NameInfo {
  name: string;      // capitalized
  gender: Gender;
  language: Language;
}
```

## Database

~720 entries covering full names and common nicknames/abbreviations:

| Language | Examples (full names) | Examples (nicknames) |
|----------|-----------------------|----------------------|
| `en`     | James, Mary, Elizabeth | Bob, Matt, Liz, Becky |
| `es`     | Juan, Carmen, Santiago | Paco, Lola, Nacho |
| `fr`     | Pierre, Marie, Camille | — |
| `de`     | Hans, Hildegard, Lukas | — |
| `it`     | Giancarlo, Giulia, Marco | Beppe, Gia, Sandro |
| `zh`     | Wei, Mei, Haoran | — |
| `ja`     | Hiroshi, Sakura, Kaito | — |

## Development

```bash
bun test      # run tests
bun run build # compile to dist/
```

## License

[MIT](LICENSE)
