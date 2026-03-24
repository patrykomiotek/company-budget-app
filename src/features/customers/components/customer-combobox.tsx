'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface CustomerOption {
  id: string;
  name: string;
  nip?: string | null;
}

interface CustomerComboboxProps {
  value: string;
  onChange: (value: string) => void;
  customers: CustomerOption[];
}

export function CustomerCombobox({ value, onChange, customers }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setInputValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filtered = inputValue
    ? customers.filter((c) => c.name.toLowerCase().includes(inputValue.toLowerCase()))
    : customers;

  const showCreateOption = inputValue && !customers.some(
    (c) => c.name.toLowerCase() === inputValue.toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between font-normal"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {value || 'Wybierz lub dodaj klienta...'}
        </span>
        <div className="flex items-center gap-1 ml-2">
          {value && (
            <X
              className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
            />
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Szukaj klienta..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {!showCreateOption && filtered.length === 0 && (
                <CommandEmpty>
                  {inputValue ? 'Brak wyników' : 'Wpisz nazwę klienta'}
                </CommandEmpty>
              )}
              <CommandGroup>
                {showCreateOption && (
                  <CommandItem
                    value={`create-${inputValue}`}
                    onSelect={() => {
                      onChange(inputValue);
                      setOpen(false);
                      setInputValue('');
                    }}
                  >
                    <span>Dodaj: <strong>{inputValue}</strong></span>
                  </CommandItem>
                )}
                {filtered.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => {
                      onChange(customer.name === value ? '' : customer.name);
                      setOpen(false);
                      setInputValue('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === customer.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span>{customer.name}</span>
                    {customer.nip && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        NIP: {customer.nip}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
