export const reminderChoices = [
  { value: -60, label: '1 hora antes' }, { value: -30, label: '30 min antes' },
  { value: -15, label: '15 min antes' }, { value: -10, label: '10 min antes' },
  { value: -5, label: '5 min antes' }, { value: 0, label: 'En el momento' },
  { value: 5, label: '5 min después' }, { value: 10, label: '10 min después' },
  { value: 15, label: '15 min después' },
];

export default function ReminderPicker({ value = [], onChange }: { value?: number[]; onChange: (value: number[]) => void }) {
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
    </div>
  );
}
