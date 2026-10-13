import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const tabsStyles = readFileSync(
  'src/features/authFiles/components/ProviderTabs.module.scss',
  'utf8'
);
const controlStyles = readFileSync('src/styles/controls.scss', 'utf8');
const quotaStyles = readFileSync('src/features/quota/QuotaPage.module.scss', 'utf8');

describe('provider filter overflow', () => {
  test('constrains the strip and preserves native horizontal scrolling', () => {
    // The strip uses the shared tab primitives, which carry the overflow rules.
    expect(tabsStyles).toMatch(/\.tabs\s*\{\s*@include controls\.tab-list;/);
    expect(tabsStyles).toMatch(/\.tab\s*\{\s*@include controls\.tab;/);
    expect(controlStyles).toMatch(/@mixin tab-list\s*\{[^}]*min-width: 0;/);
    expect(controlStyles).toMatch(/@mixin tab-list\s*\{[^}]*max-width: 100%;/);
    expect(controlStyles).toMatch(/@mixin tab-list\s*\{[^}]*overflow-x: auto;/);
    expect(controlStyles).toMatch(/@mixin tab\s*\{[^}]*flex-shrink: 0;/);
  });

  test('hides the scrollbar while using a cancellable local wheel listener', () => {
    expect(controlStyles).toContain('scrollbar-width: none;');
    expect(controlStyles).toMatch(/&::-webkit-scrollbar\s*\{[^}]*display: none/);
    const source = readFileSync('src/features/authFiles/components/ProviderTabs.tsx', 'utf8');
    expect(source).toContain("strip.addEventListener('wheel', onWheel, { passive: false })");
    expect(source).toContain("strip.removeEventListener('wheel', onWheel)");
  });

  test('allocates remaining quota toolbar width without shrinking the sort control', () => {
    expect(quotaStyles).toMatch(/> :first-child\s*\{\s*flex: 1 1 auto;\s*min-width: 0;/);
    expect(quotaStyles).toMatch(/\.sort\s*\{\s*flex: 0 0 auto;/);
  });
});
