import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A46B29] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#A46B29] text-white hover:bg-[#88561D]',
        dark: 'bg-[#241A13] text-white hover:bg-[#A46B29]',
        outline:
          'border border-[#D6CBB8] bg-white text-[#241A13] hover:bg-[#FAF7F1]',
        outlineDark:
          'border border-[#241A13] bg-transparent text-[#241A13] hover:bg-[#241A13] hover:text-white',
        secondary: 'bg-[#F8EFE2] text-[#7C4F1D] border border-[#E4CCA8] hover:bg-[#F1E2CA]',
        destructive: 'bg-red-700 text-white hover:bg-red-800',
        destructiveOutline:
          'border border-red-200 bg-white text-red-700 hover:bg-red-50',
        ghost: 'text-[#66584B] hover:bg-[#F3EDE2] hover:text-[#241A13]',
      },
      size: {
        sm: 'h-8 px-3.5 text-xs',
        default: 'h-9 px-4 text-xs',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';
