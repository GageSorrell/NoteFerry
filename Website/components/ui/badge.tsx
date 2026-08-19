import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&_svg]:size-3",
    {
        defaultVariants:
        {
            variant: "default"
        },
        variants:
        {
            variant:
            {
                default: "border-border bg-muted text-muted-foreground",
                outline: "border-border text-foreground",
                primary: "border-transparent bg-primary text-primary-foreground",
                warning: "border-transparent bg-warning/15 text-warning"
            }
        }
    }
);

/**
 *
 */
export interface BadgeProps
    extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants>
{
    asChild?: boolean;
}

/**
 *
 */
function Badge({ className, variant, asChild = false, ...props }: BadgeProps)
{
    const Comp = asChild ? Slot : "span";

    return (
        <Comp
            className={ cn(badgeVariants({ className, variant })) }
            data-slot="badge"
            { ...props } />
    );
}

export { Badge, badgeVariants };
