import {useEffect, useState} from 'react';

export interface DecimalInputProps {
  'aria-label'?: string;
  className?: string;
  max?: number;
  min?: number;
  onChange: (val: number) => void;
  step?: string | number;
  value: number;
}

export function DecimalInput({
  value,
  min = 0,
  max = 59.99,
  step = 'any',
  onChange,
  className,
  'aria-label': ariaLabel,
}: DecimalInputProps) {
  const [localVal, setLocalVal] = useState<string>(() => value.toString());

  useEffect(() => {
    const parsed = Number.parseFloat(localVal);
    if (parsed !== value && !Number.isNaN(value)) {
      setLocalVal(value.toString());
    }
  }, [value, localVal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setLocalVal(text);
    if (text === '' || text === '.') {
      onChange(0);
      return;
    }
    const parsed = Number.parseFloat(text);
    if (!Number.isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  const handleBlur = () => {
    if (localVal === '' || localVal === '.') {
      setLocalVal('0');
      onChange(0);
    } else {
      const parsed = Number.parseFloat(localVal);
      if (Number.isNaN(parsed)) {
        setLocalVal(value.toString());
      } else {
        const clamped = Math.max(min, Math.min(max, parsed));
        setLocalVal(clamped.toString());
        onChange(clamped);
      }
    }
  };

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      max={max}
      min={min}
      onBlur={handleBlur}
      onChange={handleChange}
      step={step}
      type="number"
      value={localVal}
    />
  );
}
