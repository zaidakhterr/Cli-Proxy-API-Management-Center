import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const listStyles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listStyles(path);
    return /\.(scss|css)$/.test(name) ? [path] : [];
  });

describe('square corners', () => {
  test('every radius token is 2px', () => {
    const variables = readFileSync('src/styles/variables.scss', 'utf8');
    const themes = readFileSync('src/styles/themes.scss', 'utf8');
    for (const match of variables.matchAll(/^\$radius-[a-z]+:\s*([^;]+);/gm)) {
      expect(['2px', '$radius-pill']).toContain(match[1].trim());
    }
    for (const match of themes.matchAll(/--radius-[a-z]+:\s*([^;]+);/g)) {
      expect(match[1].trim()).toBe('2px');
    }
  });

  test('no stylesheet hard-codes a radius above 2px', () => {
    for (const file of listStyles('src')) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/border-[a-z-]*radius:\s*([^;]+);/g)) {
        for (const px of match[1].matchAll(/(\d+(?:\.\d+)?)px/g)) {
          expect({ file, value: Number(px[1]) <= 2 }).toEqual({ file, value: true });
        }
      }
    }
  });
});
