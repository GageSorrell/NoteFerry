import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
    {
        defaultVariants:
        {
            size: "default",
            variant: "default"
        },
        variants:
        {
            size:
            {
                default: "h-10 px-5 py-2",
                icon: "size-10",
                lg: "h-12 rounded-lg px-7 text-base",
                sm: "h-8 rounded-md gap-1.5 px-3 text-xs"
            },
            variant:
            {
                default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover",
                destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
                ghost: "hover:bg-muted",
                outline: "border border-border bg-background hover:bg-muted",
                secondary: "bg-muted text-foreground hover:bg-muted/70"
            }
        }
    }
);

/**
 *
 */
export interface ButtonProps
    extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants>
{
    asChild?: boolean;
}

/**
 *
 */
function Button({ className, variant, size, asChild = false, ...props }: ButtonProps)
{
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            className={ cn(buttonVariants({ className, size, variant })) }
            data-slot="button"
            { ...props } />
    );
}

export { Button, buttonVariants };
