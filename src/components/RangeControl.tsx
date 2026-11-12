import { useId } from 'react';
interface Props { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }
export function RangeControl({ label, value, min, max, step, unit = '', onChange }: Props) {
  const id = useId();
  const position = (value - min) / step;
  const exactStep = Math.abs(position - Math.round(position)) < 1e-8;
  return <div className="range-control">
    <div className="range-control__head"><label htmlFor={id}>{label}</label><output htmlFor={id} dir="ltr">{value} <span>{unit}</span></output></div>
    <input id={id} type="range" min={min} max={max} step={exactStep ? step : 'any'} value={value} onChange={(event) => onChange(Number(event.target.value))} onKeyDown={(event) => {
      const direction = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -1 : 0;
      if (!direction || exactStep) return;
      event.preventDefault();
      onChange(Math.min(max, Math.max(min, Number((value + direction * step).toFixed(10)))));
    }} dir="ltr" />
  </div>;
}
