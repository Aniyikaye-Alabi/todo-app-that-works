import { useId, type ReactElement, cloneElement } from 'react';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  /** A single input/textarea/select; receives id + aria wiring. */
  children: ReactElement<Record<string, unknown>>;
  className?: string;
}

export function Field({ label, error, hint, children, className = '' }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field${error ? ' field--error' : ''} ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <div className="field__control">
        {cloneElement(children, {
          id,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
        })}
      </div>
      {hint && !error && (
        <p className="hint" id={hintId}>
          {`// ${hint}`}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          [ERR] {error}
        </p>
      )}
    </div>
  );
}
