import { Radio } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useSwitchScanning } from '@/hooks/useSwitchScanning';

// Unica responsabilidad: el boton grande de "activar" del barrido de
// switch access (Sesion 22, item 45), para quien usa un switch fisico
// tactil en vez de teclado. Se monta una sola vez, global (App.tsx),
// igual que AccessibilityWidget — asi el barrido funciona en cualquier
// pantalla sin que cada una lo tenga que agregar.
export default function SwitchScanningOverlay() {
  const { settings } = useAccessibility();
  const { activate } = useSwitchScanning(settings.switchScanningEnabled);

  if (!settings.switchScanningEnabled) return null;

  return (
    <button
      type="button"
      onClick={activate}
      aria-label="Activar (barrido de switch access)"
      className="fixed bottom-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#6b4c9a] px-6 py-4 text-base font-bold text-white shadow-xl"
    >
      <Radio size={20} /> Activar
    </button>
  );
}
