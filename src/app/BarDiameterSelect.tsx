const labels: Record<string, string> = {
  "5": '5,0 mm (3/16")',
  "6,3": '6,3 mm (1/4")',
  "8": '8,0 mm (5/16")',
  "10": '10,0 mm (3/8")',
  "12,5": '12,5 mm (1/2")',
};

export function BarDiameterSelect({
  value,
  options,
  onChange,
  label,
  disabled = false,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {!options.includes(value) && (
        <option value={value} disabled>
          {value} mm (valor salvo)
        </option>
      )}
      {options.map((d) => (
        <option key={d} value={d}>
          {labels[d] ?? `${d} mm`}
        </option>
      ))}
    </select>
  );
}
