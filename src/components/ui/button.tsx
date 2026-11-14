import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Buttons: pill-shaped (fully rounded), 44px default height, flat colour change on hover, focus ring from the --ring token. `loading` (or a disabled button whose label ends in "…", which is how every
// busy state in this app is written) shows a spinner and keeps the button's width, so nothing jumps while it works.
const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[15px] font-medium tracking-[-0.003em] cursor-pointer select-none touch-manipulation transition-[background-color,border-color,color,transform,box-shadow] duration-[160ms] ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-foreground disabled:border-transparent aria-busy:pointer-events-none aria-busy:opacity-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-shine bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive",
        positive: "bg-positive text-primary-foreground hover:bg-positive/90 focus-visible:ring-positive",
        outline: "border border-border bg-card text-foreground hover:border-foreground/30 hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        soft: "bg-accent text-accent-foreground hover:bg-accent/70",
        ghost: "font-medium text-foreground/80 hover:bg-accent hover:text-accent-foreground",
        link: "font-medium text-primary underline underline-offset-4 hover:decoration-2 motion-safe:hover:translate-y-0",
      },
      size: { default: "h-11 px-4", sm: "h-9 px-3.5 text-sm", lg: "h-12 px-6 text-base", xl: "h-12 px-8 text-base", icon: "h-11 w-11" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; loading?: boolean }

const Spinner = () => <span aria-hidden className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  if (asChild) return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>{children}</Comp>;
  const busy = loading ?? (!!disabled && typeof children === "string" && /(…|\.\.\.)$/.test(children.trim()));
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>
      {busy && <Spinner />}
      {children}
    </Comp>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
