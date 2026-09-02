import { describe, expect, it } from 'vitest';
import { activeTabFromPath, pathForActiveTab } from './activeTab';

describe('personal record navigation', () => {
  it('maps the personal record URL to the emotions tab', () => {
    expect(activeTabFromPath('/registro-personal')).toBe('emotions');
  });

  it('generates a stable URL for the emotions tab', () => {
    expect(pathForActiveTab('emotions')).toBe('/registro-personal');
  });

  it('uses home for the other in-shell tabs', () => {
    expect(pathForActiveTab('home')).toBe('/');
  });
});
