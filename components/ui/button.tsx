import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire/50 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-fire text-bone hover:bg-fire-glow shadow-[0_0_0_0_rgba(214,40,40,0.5)] hover:shadow-[0_0_40px_0_rgba(214,40,40,0.4)]",
        outline:
          "border border-ink-700 bg-transparent text-bone hover:border-fire hover:text-fire",
        ghost: "hover:bg-ink-900 text-bone",
        secondary: "bg-ink-900 text-bone hover:bg-ink-800",
        link: "text-bone underline-offset-4 hover:text-fire hover:underline",
      },
      size: {
        default: "h-12 px-7 py-2 rounded-full",
        sm: "h-9 px-4 rounded-full text-xs",
        lg: "h-14 px-9 rounded-full text-base",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
