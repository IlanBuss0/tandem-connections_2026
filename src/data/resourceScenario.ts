export interface ResourceScenarioResource {
  id: string;
  name: string;
  icon: string;
  min: number;
  max: number;
  initial: number;
}

export interface ResourceScenarioOption {
  id: string;
  label: string;
  image?: string;
  feedback?: string;
  score: number;
  resourceDeltas: Record<string, number>;
  nextNodeId: string;
}

export interface ResourceScenarioNode {
  id: string;
  prompt: string;
  image?: string;
  terminal: boolean;
  options: ResourceScenarioOption[];
}

export interface LegacyResourceScenarioData {
  startNodeId: string;
  resources: ResourceScenarioResource[];
  nodes: ResourceScenarioNode[];
}

export interface ShoppingBudgetProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  required: boolean;
}

export interface ShoppingBudgetScenarioData {
  kind: 'shopping-budget';
  schemaVersion: 1;
  prompt: string;
  currencySymbol: string;
  budget: number;
  products: ShoppingBudgetProduct[];
}

export type ResourceScenarioData = LegacyResourceScenarioData | ShoppingBudgetScenarioData;

export function isShoppingBudgetScenario(data?: ResourceScenarioData): data is ShoppingBudgetScenarioData {
  return Boolean(data && 'kind' in data && data.kind === 'shopping-budget');
}

export function emptyResourceScenario(): ShoppingBudgetScenarioData {
  return {
    kind: 'shopping-budget',
    schemaVersion: 1,
    prompt: 'Encontrá los productos de la lista sin superar el presupuesto.',
    currencySymbol: '$',
    budget: 10,
    products: [
      { id: 'product-1', name: '', image: '🛒', price: 1, required: true },
      { id: 'product-2', name: '', image: '🛒', price: 1, required: false },
      { id: 'product-3', name: '', image: '🛒', price: 1, required: false },
    ],
  };
}

export function validateResourceScenario(data?: ResourceScenarioData): string | null {
  if (!data) return 'Faltan los datos de la compra.';
  if (isShoppingBudgetScenario(data)) return validateShoppingBudgetScenario(data);
  return validateLegacyResourceScenario(data);
}

export function validateShoppingBudgetScenario(data: ShoppingBudgetScenarioData): string | null {
  if (data.schemaVersion !== 1) return 'La versión de la compra no es válida.';
  if (!data.prompt.trim()) return 'Escribí una consigna para la compra.';
  if (!data.currencySymbol.trim() || data.currencySymbol.length > 4) return 'Ingresá un símbolo monetario válido.';
  if (!Number.isInteger(data.budget) || data.budget <= 0) return 'El presupuesto debe ser un número entero mayor que cero.';
  if (data.products.length < 3 || data.products.length > 12) return 'Configurá entre 3 y 12 productos en el catálogo.';

  const ids = new Set<string>();
  const names = new Set<string>();
  for (const product of data.products) {
    const normalizedName = product.name.trim().toLocaleLowerCase('es');
    if (!product.id || ids.has(product.id)) return 'Cada producto necesita un identificador único.';
    if (!normalizedName || names.has(normalizedName)) return 'Cada producto necesita un nombre diferente.';
    if (!product.image.trim()) return `Agregá un pictograma o emoji para ${product.name || 'cada producto'}.`;
    if (!Number.isInteger(product.price) || product.price <= 0) return `El precio de ${product.name} debe ser un entero mayor que cero.`;
    ids.add(product.id);
    names.add(normalizedName);
  }

  const required = data.products.filter(product => product.required);
  if (required.length === 0) return 'Agregá al menos un producto a la lista de compras.';
  if (required.length === data.products.length) return 'Agregá al menos un producto extra al catálogo.';
  if (required.reduce((sum, product) => sum + product.price, 0) > data.budget) return 'El presupuesto debe alcanzar para comprar todos los productos de la lista.';
  return null;
}

function validateLegacyResourceScenario(data: LegacyResourceScenarioData): string | null {
  if (data.resources.length < 1 || data.resources.length > 3) return 'Configurá entre 1 y 3 recursos.';
  if (data.nodes.length < 2 || data.nodes.length > 12) return 'Configurá entre 2 y 12 nodos.';

  const resourceIds = new Set<string>();
  for (const resource of data.resources) {
    if (!resource.id || resourceIds.has(resource.id) || !resource.name.trim()) return 'Cada recurso necesita un nombre e identificador únicos.';
    if (![resource.min, resource.max, resource.initial].every(Number.isInteger)) return 'Los valores de los recursos deben ser enteros.';
    if (resource.min >= resource.max || resource.initial < resource.min || resource.initial > resource.max) return `Revisá los límites de ${resource.name}.`;
    resourceIds.add(resource.id);
  }

  const nodeById = new Map<string, ResourceScenarioNode>();
  for (const node of data.nodes) {
    if (!node.id || nodeById.has(node.id) || !node.prompt.trim()) return 'Cada nodo necesita una consigna y un identificador únicos.';
    nodeById.set(node.id, node);
  }
  if (!nodeById.has(data.startNodeId)) return 'Elegí un nodo inicial válido.';

  for (const node of data.nodes) {
    if (node.terminal && node.options.length > 0) return 'Los desenlaces no pueden tener opciones.';
    if (!node.terminal && (node.options.length < 2 || node.options.length > 4)) return 'Cada decisión necesita entre 2 y 4 opciones.';
    for (const option of node.options) {
      if (!option.label.trim() || !nodeById.has(option.nextNodeId)) return 'Completá el texto y destino de cada opción.';
      if (!Number.isInteger(option.score) || option.score < 0 || option.score > 100) return 'Cada opción debe tener un puntaje entero entre 0 y 100.';
      for (const [resourceId, delta] of Object.entries(option.resourceDeltas)) {
        if (!resourceIds.has(resourceId) || !Number.isInteger(delta)) return 'Las variaciones deben corresponder a recursos existentes y usar enteros.';
      }
    }
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (nodeId: string): boolean => {
    if (active.has(nodeId)) return false;
    if (visited.has(nodeId)) return true;
    active.add(nodeId);
    const node = nodeById.get(nodeId)!;
    for (const option of node.options) if (!visit(option.nextNodeId)) return false;
    active.delete(nodeId);
    visited.add(nodeId);
    return true;
  };
  if (!visit(data.startNodeId)) return 'El escenario no puede contener ciclos.';
  if (visited.size !== data.nodes.length) return 'Todos los nodos deben ser alcanzables desde el inicio.';
  if (!data.nodes.some(node => node.terminal)) return 'Agregá al menos un desenlace.';
  return null;
}

export function applyResourceDeltas(
  resources: ResourceScenarioResource[],
  values: Record<string, number>,
  deltas: Record<string, number>,
) {
  const next = { ...values };
  const warnings: string[] = [];
  for (const resource of resources) {
    const raw = (values[resource.id] ?? resource.initial) + (deltas[resource.id] ?? 0);
    const clamped = Math.min(resource.max, Math.max(resource.min, raw));
    next[resource.id] = clamped;
    if (raw !== clamped) warnings.push(`${resource.name} llegó a su límite.`);
  }
  return { values: next, warnings };
}

export function resourceScenarioScore(scores: number[]) {
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
}
