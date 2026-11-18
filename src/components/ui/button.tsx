import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "btn inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-none text-xs font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-[var(--secondary)] hover:text-[var(--secondary-foreground)] hover:shadow active:translate-y-[1px]",
        destructive:
          "bg-destructive text-primary-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 active:translate-y-[1px]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent/10 hover:text-accent dark:bg-input/30 dark:border-input dark:hover:bg-input/50 active:translate-y-[1px]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] hover:shadow active:translate-y-[1px]",
        ghost:
          "hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/30 active:translate-y-[1px]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3 rounded-xl",
        sm: "h-8 rounded-lg gap-1.5 px-3 text-xs has-[>svg]:px-2 font-medium",
        lg: "h-12 rounded-xl px-7 text-sm font-bold has-[>svg]:px-5",
        xl: "h-14 rounded-xl px-9 text-base font-bold has-[>svg]:px-6",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
