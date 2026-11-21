import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-[#D6CBB8] bg-white px-3.5 py-2 text-sm text-[#241A13] placeholder:text-[#8E7F70] focus:border-[#A46B29] focus:outline-none disabled:bg-[#FAF7F1] disabled:text-[#66584B]',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-[#D6CBB8] bg-white p-3.5 text-sm text-[#241A13] placeholder:text-[#8E7F70] focus:border-[#A46B29] focus:outline-none disabled:bg-[#FAF7F1]',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full rounded-xl border border-[#D6CBB8] bg-white px-3 py-2 text-sm text-[#241A13] focus:border-[#A46B29] focus:outline-none',
      className
    )}
    {...props}
  />
));
Select.displayName = 'Select';
