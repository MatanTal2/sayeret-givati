'use client';

import React from 'react';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<T extends string> {
  value: T | null;
  onChange: (value: T | null) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  /** When true, an explicit empty/clear row is rendered. Default false. */
  clearable?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  ariaLabel?: string;
}

const NULL_SENTINEL = '__null__';

export default function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = '—',
  clearable = false,
  disabled,
  id,
  className,
  ariaLabel,
}: SelectProps<T>) {
  const selected = options.find((o) => o.value === value) ?? null;

  const handleChange = (next: string) => {
    onChange(next === NULL_SENTINEL ? null : (next as T));
  };

  return (
    <Listbox
      value={value ?? NULL_SENTINEL}
      onChange={handleChange}
      disabled={disabled}
    >
      <ListboxButton
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'input-base flex items-center text-start text-sm',
          !selected && 'text-neutral-400',
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className="ms-auto h-4 w-4 text-neutral-500"
          aria-hidden
        />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        className="w-[var(--button-width)] mt-1 max-h-60 overflow-auto rounded-xl border border-neutral-300 bg-white shadow-medium z-50 py-1 focus:outline-none"
      >
        {clearable && (
          <ListboxOption
            value={NULL_SENTINEL}
            className="cursor-pointer select-none px-3 py-2 text-sm text-start text-neutral-500 data-[focus]:bg-primary-50"
          >
            {placeholder}
          </ListboxOption>
        )}
        {options.map((opt) => (
          <ListboxOption
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className="flex items-center gap-2 cursor-pointer select-none px-3 py-2 text-sm text-start text-neutral-900 data-[focus]:bg-primary-50 data-[selected]:bg-primary-100 data-[selected]:text-primary-700 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
          >
            {({ selected: isSel }) => (
              <>
                <span className="truncate">{opt.label}</span>
                {isSel && (
                  <Check
                    className="ms-auto h-4 w-4 text-primary-600"
                    aria-hidden
                  />
                )}
              </>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
