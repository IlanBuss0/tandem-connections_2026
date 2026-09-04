// Unica responsabilidad: la maquina de estados pura del barrido de switch
// access (Sesion 22, item 45). No toca el DOM ni timers — eso vive en
// useSwitchScanning.ts, que traduce "grupos" y "activacion" a elementos
// reales y a un setInterval.
//
// Barrido de 2 niveles (el estandar de switch access): primero recorre
// GRUPOS (role="group", contrato fijado en PictogramGrid desde la
// Sesion 10), y al activar sobre un grupo pasa a recorrer sus ITEMS. Una
// segunda activacion selecciona el item actual. Asi alguien con un solo
// switch (o un solo boton grande) puede llegar a cualquier pictograma de
// la pantalla sin necesitar precision motora fina.
export interface ScanState {
  level: 'group' | 'item';
  groupIndex: number;
  itemIndex: number;
}

export function initialScanState(): ScanState {
  return { level: 'group', groupIndex: 0, itemIndex: 0 };
}

/** Avanza el barrido automatico un paso (lo llama el timer). */
export function tick(state: ScanState, groupSizes: number[]): ScanState {
  if (groupSizes.length === 0) return state;

  if (state.level === 'group') {
    const nextGroup = (state.groupIndex + 1) % groupSizes.length;
    return { level: 'group', groupIndex: nextGroup, itemIndex: 0 };
  }

  const size = groupSizes[state.groupIndex] || 1;
  const nextItem = (state.itemIndex + 1) % size;
  return { level: 'item', groupIndex: state.groupIndex, itemIndex: nextItem };
}

/**
 * El usuario activa el switch (toca el boton grande / aprieta la tecla).
 * En nivel grupo: entra a recorrer los items de ese grupo.
 * En nivel item: selecciona el item actual (select=true) y vuelve a nivel grupo.
 */
export function activate(state: ScanState, groupSizes: number[]): { state: ScanState; select: boolean } {
  if (groupSizes.length === 0) return { state, select: false };

  if (state.level === 'group') {
    return { state: { level: 'item', groupIndex: state.groupIndex, itemIndex: 0 }, select: false };
  }

  return { state: { level: 'group', groupIndex: state.groupIndex, itemIndex: 0 }, select: true };
}
