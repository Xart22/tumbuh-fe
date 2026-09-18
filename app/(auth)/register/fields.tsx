'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FieldIcon } from './field-icon';
import type { RegisterValues } from './types';

/** Text-valued fields only — keeps Controller's `field.value` typed string. */
type FieldName =
  | 'ownerName'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirmPassword'
  | 'brandName'
  | 'outletName'
  | 'city'
  | 'address';

const LABEL_CLS = 'text-xs font-bold uppercase tracking-wider text-slate-700';
const MESSAGE_CLS = 'mt-1 text-xs font-medium';
const CONTROL_CLS =
  'rounded-xl border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 sm:py-3';

function RequiredMark() {
  return <span className="text-rose-500">*</span>;
}

export function TextField({
  name,
  label,
  required,
  hint,
  aside,
  icon,
  suffix,
  ...inputProps
}: {
  name: FieldName;
  label: string;
  required?: boolean;
  hint?: string;
  aside?: React.ReactNode;
  icon?: string;
  suffix?: React.ReactNode;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  const { control } = useFormContext<RegisterValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-0">
          {aside ? (
            <div className="mb-1.5 flex items-center justify-between">
              <FormLabel className={LABEL_CLS}>
                {label} {required && <RequiredMark />}
              </FormLabel>
              {aside}
            </div>
          ) : (
            <FormLabel className={`mb-1.5 ${LABEL_CLS}`}>
              {label} {required && <RequiredMark />}
            </FormLabel>
          )}
          <div className="relative">
            {icon && <FieldIcon name={icon} />}
            <FormControl>
              <Input
                {...field}
                {...inputProps}
                className={`${CONTROL_CLS} h-auto${icon ? ' pl-10' : ''}${suffix ? ' pr-10' : ''}`}
              />
            </FormControl>
            {suffix && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">{suffix}</div>
            )}
          </div>
          {hint && <span className="mt-1 block text-[10px] text-slate-400">{hint}</span>}
          <div className="min-h-4"><FormMessage className={MESSAGE_CLS} /></div>
        </FormItem>
      )}
    />
  );
}

export function SelectField({
  name,
  label,
  required,
  placeholder,
  children,
}: {
  name: FieldName;
  label: string;
  required?: boolean;
  placeholder?: string;
  children: React.ReactNode;
}) {
  const { control } = useFormContext<RegisterValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-0">
          <FormLabel className={`mb-1.5 ${LABEL_CLS}`}>
            {label} {required && <RequiredMark />}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value as string}>
            <FormControl>
              <SelectTrigger className={`${CONTROL_CLS} h-auto w-full`}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>{children}</SelectContent>
          </Select>
          <div className="min-h-4"><FormMessage className={MESSAGE_CLS} /></div>
        </FormItem>
      )}
    />
  );
}

export function SelectOption({ value, children }: { value: string; children: React.ReactNode }) {
  return <SelectItem value={value}>{children}</SelectItem>;
}

export function TextAreaField({
  name,
  label,
  required,
  rows = 2,
  placeholder,
}: {
  name: FieldName;
  label: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const { control } = useFormContext<RegisterValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-0">
          <FormLabel className={`mb-1.5 ${LABEL_CLS}`}>
            {label} {required && <RequiredMark />}
          </FormLabel>
          <FormControl>
            <Textarea {...field} rows={rows} placeholder={placeholder} className={CONTROL_CLS} />
          </FormControl>
          <div className="min-h-4"><FormMessage className={MESSAGE_CLS} /></div>
        </FormItem>
      )}
    />
  );
}
