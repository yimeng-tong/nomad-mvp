// Nomad's label/description/error composition of the reviewed shadcn Field source.
import { useId, type ReactNode } from 'react';

export type FieldControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true };
export type FormFieldProps = {
  id?: string;
  label: string;
  description?: string;
  error?: string | null;
  className?: string;
  children: (props: FieldControlProps) => ReactNode;
};

export function FormField({ id: suppliedId, label, description, error, className = '', children }: FormFieldProps) {
  const generatedId = useId(); const id = suppliedId ?? generatedId;
  const descriptionId = `${id}-description`, errorId = `${id}-error`;
  const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return <div data-slot="field" className={`nomad-field grid gap-2 ${className}`}>
    <label className="nomad-field-label" htmlFor={id}>{label}</label>
    {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
    {description ? <p id={descriptionId} className="nomad-control-note">{description}</p> : null}
    {error ? <p id={errorId} role="alert" className="nomad-field-error">{error}</p> : null}
  </div>;
}

export { FormField as Field };
