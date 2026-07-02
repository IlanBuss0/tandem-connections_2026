export const reminderChoices = [
  { value: -60, label: '1 hora antes' }, { value: -30, label: '30 min antes' },
  { value: -15, label: '15 min antes' }, { value: -10, label: '10 min antes' },
  { value: -5, label: '5 min antes' }, { value: 0, label: 'En el momento' },
  { value: 5, label: '5 min después' }, { value: 10, label: '10 min después' },
  { value: 15, label: '15 min después' },
];

export default function ReminderPicker({ value = [], onChange }: { value?: number[]; onChange: (value: number[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">Avisarme</p>
      <div className="flex flex-wrap gap-2">
        {reminderChoices.map(choice => {
          const selected = value.includes(choice.value);
          return (
            <button key={choice.value} type="button"
              onClick={() => onChange(selected ? value.filter(item => item !== choice.value) : [...value, choice.value].sort((a, b) => a - b))}
              className={`rounded-xl border px-2.5 py-1.5 text-xs font-medium ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
