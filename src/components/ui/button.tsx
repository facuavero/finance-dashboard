import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background,color,border,opacity,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-fg text-bg hover:opacity-90',
        accent: 'bg-accent-solid text-on-accent shadow-[0_0_24px_-6px_var(--glow-strong)] hover:opacity-90',
        secondary: 'border border-border-strong bg-transparent text-fg hover:bg-surface-2',
        ghost: 'text-fg-2 hover:bg-surface-2 hover:text-fg',
        danger: 'bg-accent-solid text-on-accent hover:opacity-90',
        link: 'text-accent underline-offset-4 hover:underline px-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3.5 text-[13px]',
        md: 'h-9 px-4 text-sm',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }

export const Button = React.forwardRef<HTMLButtonElement, Props>(function Button({ className, variant, size, asChild, loading, children, disabled, ...props }, ref) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  )
})
