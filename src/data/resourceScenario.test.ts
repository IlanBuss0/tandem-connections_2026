import { describe, expect, it } from 'vitest';
import { GAME_TEMPLATES } from './miniGames';
import type { LegacyResourceScenarioData } from './resourceScenario';
import { applyResourceDeltas, emptyResourceScenario, resourceScenarioScore, validateResourceScenario } from './resourceScenario';

const legacyScenario = (): LegacyResourceScenarioData => ({
  startNodeId: 'start',
  resources: [{ id: 'energy', name: 'Energía', icon: '⚡', min: 0, max: 10, initial: 5 }],
  nodes: [
    { id: 'start', prompt: 'Elegí', terminal: false, options: [
      { id: 'a', label: 'A', score: 50, resourceDeltas: {}, nextNodeId: 'end' },
      { id: 'b', label: 'B', score: 50, resourceDeltas: {}, nextNodeId: 'end' },
    ] },
    { id: 'end', prompt: 'Final', terminal: true, options: [] },
  ],
});

describe('resource scenario', () => {
  it('includes a valid precreated template for the tutor activity gallery', () => {
    const templates = GAME_TEMPLATES.filter(item => item.gameType === 'resource-scenario');

    expect(templates.map(template => template.name)).toEqual(['Compra básica en el supermercado', 'Ingredientes para preparar panqueques']);
    expect(templates.map(template => validateResourceScenario(template.gameData.resourceScenario))).toEqual([null, null]);
  });

  it('creates a simple editable shopping activity by default', () => {
    const data = emptyResourceScenario();
    data.products[0].name = 'Pan';
    data.products[1].name = 'Leche';
    data.products[2].name = 'Arroz';
    expect(validateResourceScenario(data)).toBeNull();
  });

  it('requires the shopping list to fit the budget and include a distractor', () => {
    const data = emptyResourceScenario();
    data.products = [
      { id: 'a', name: 'Pan', image: '🍞', price: 8, required: true },
      { id: 'b', name: 'Leche', image: '🥛', price: 5, required: true },
      { id: 'c', name: 'Arroz', image: '🍚', price: 1, required: false },
    ];
    expect(validateResourceScenario(data)).toMatch(/presupuesto/);
    data.budget = 20;
    data.products[2].required = true;
    expect(validateResourceScenario(data)).toMatch(/producto extra/);
  });

  it('rejects cycles', () => {
    const data = legacyScenario();
    data.nodes[1] = {
      id: 'end', prompt: 'Otra decisión', terminal: false,
      options: [
        { id: 'a', label: 'A', score: 50, resourceDeltas: {}, nextNodeId: 'start' },
        { id: 'b', label: 'B', score: 50, resourceDeltas: {}, nextNodeId: 'start' },
      ],
    };
    expect(validateResourceScenario(data)).toMatch(/ciclos/);
  });

  it('clamps resources and averages scores', () => {
    const resources = [{ id: 'energy', name: 'Energía', icon: '⚡', min: 0, max: 10, initial: 5 }];
    expect(applyResourceDeltas(resources, { energy: 9 }, { energy: 5 })).toEqual({ values: { energy: 10 }, warnings: ['Energía llegó a su límite.'] });
    expect(resourceScenarioScore([80, 40, 90])).toBe(70);
  });
});
