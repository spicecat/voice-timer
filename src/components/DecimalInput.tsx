import {useEffect, useState} from 'react';

export interface DecimalInputProps {
  'aria-label'?: string;
  className?: string;
  disabled?: boolean;
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
  disabled = false,
  'aria-label': ariaLabel,
}: DecimalInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localVal, setLocalVal] = useState<string>(() => value.toString());

  // Only synchronize from external value prop when the user is not actively editing
  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setLocalVal(text);
    if (text === '' || text === '.') {
      onChange(0);
      return;
    }
    const parsed = Number.parseFloat(text);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localVal === '' || localVal === '.') {
      setLocalVal('0');
      onChange(0);
    } else {
      const parsed = Number.parseFloat(localVal);
      if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
        setLocalVal(value.toString());
      } else {
        const clamped = Math.max(min, Math.min(max, parsed));
        const rounded = Math.round(clamped * 100) / 100;
        setLocalVal(rounded.toString());
        onChange(rounded);
      }
    }
  };

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      max={max}
      min={min}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      step={step}
      type="number"
      value={localVal}
    />
  );
}
