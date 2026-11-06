import { useState } from 'react';

export const reminderChoices = [
  { value: -60, label: '1 hora antes' }, { value: -30, label: '30 min antes' },
  { value: -15, label: '15 min antes' }, { value: -10, label: '10 min antes' },
  { value: -5, label: '5 min antes' }, { value: 0, label: 'En el momento' },
  { value: 5, label: '5 min después' }, { value: 10, label: '10 min después' },
  { value: 15, label: '15 min después' },
];

const units = [
  { label: 'minutos', minutes: 1 }, { label: 'horas', minutes: 60 },
  { label: 'días', minutes: 1440 }, { label: 'semanas', minutes: 10080 },
];
const maxNotice = 40320; // Cuatro semanas; mismo límite que el programador de calendario.

function customLabel(offset: number) {
  const minutes = Math.abs(offset);
  const unit = [...units].reverse().find(item => minutes % item.minutes === 0) || units[0];
  const quantity = minutes / unit.minutes;
  return `${quantity} ${quantity === 1 ? unit.label.replace(/s$/, '') : unit.label} ${offset > 0 ? 'después' : 'antes'}`;
}

export default function ReminderPicker({ value = [], onChange, allowCustom = false }: { value?: number[]; onChange: (value: number[]) => void; allowCustom?: boolean }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [unitMinutes, setUnitMinutes] = useState(1);
  const [error, setError] = useState('');
  const addCustom = () => {
    const amount = Number(quantity);
    const minutes = amount * unitMinutes;
    if (!Number.isInteger(amount) || amount <= 0 || minutes > maxNotice) {
      setError('Ingresá una cantidad entera positiva de hasta 4 semanas.');
      return;
    }
    onChange([...new Set([...value, -minutes])].sort((a, b) => a - b));
    setError('');
    setCustomOpen(false);
  };
  return (
    <div className="space-y-2.5">
      <p className="text-base font-bold text-[#5f477c]">Avisarme</p>
      <div className="flex flex-wrap gap-2">
        {reminderChoices.map(choice => {
          const selected = value.includes(choice.value);
          return (
            <button key={choice.value} type="button"
              onClick={() => onChange(selected ? value.filter(item => item !== choice.value) : [...value, choice.value].sort((a, b) => a - b))}
              className={`min-h-11 cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] ${selected ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border bg-[#faf8ff] text-muted-foreground hover:border-[#d8c7ef] hover:bg-[#f3eaff] hover:text-[#5b3784]'}`}>
              {choice.label}
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <>
          {value.filter(offset => !reminderChoices.some(choice => choice.value === offset)).map(offset => (
            <button key={offset} type="button" aria-label={`Quitar aviso ${customLabel(offset)}`} onClick={() => onChange(value.filter(item => item !== offset))} className="mr-2 min-h-11 rounded-xl border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">
              {customLabel(offset)} · Quitar
            </button>
          ))}
          <button type="button" aria-expanded={customOpen} onClick={() => { setCustomOpen(open => !open); setError(''); }} className="min-h-11 rounded-xl border border-[#d8c7ef] px-3 py-2 text-sm font-semibold text-[#6b4c9a] hover:bg-[#f3eaff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">Personalizar aviso</button>
          {customOpen && (
            <fieldset className="space-y-3 rounded-2xl border border-[#eadff5] bg-white p-3">
              <legend className="px-1 text-sm font-semibold text-[#5f477c]">Avisarme antes del evento</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-[#675a78]">Cantidad
                  <input type="number" min="1" max={Math.floor(maxNotice / unitMinutes)} step="1" value={quantity} aria-invalid={Boolean(error)} onChange={event => setQuantity(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#e4d8f2] bg-[#faf8ff] px-3 text-base text-[#4a3a62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]" />
                </label>
                <label className="text-xs font-semibold text-[#675a78]">Unidad
                  <select value={unitMinutes} onChange={event => setUnitMinutes(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-xl border border-[#e4d8f2] bg-[#faf8ff] px-3 text-sm text-[#4a3a62] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">
                    {units.map(unit => <option key={unit.minutes} value={unit.minutes}>{unit.label}</option>)}
                  </select>
                </label>
              </div>
              <p className="text-xs text-[#756a82]">Hasta 4 semanas antes.</p>
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button type="button" onClick={addCustom} className="min-h-11 rounded-full bg-[#6b4c9a] px-4 text-sm font-semibold text-white hover:bg-[#5a3c8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]">Agregar aviso</button>
            </fieldset>
          )}
        </>
      )}
    </div>
  );
}
