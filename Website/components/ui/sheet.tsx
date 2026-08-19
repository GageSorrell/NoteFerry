import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 *
 */
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>)
{
    return <SheetPrimitive.Root data-slot="sheet"
        { ...props } />;
}

/**
 *
 */
function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>)
{
    return <SheetPrimitive.Trigger data-slot="sheet-trigger"
        { ...props } />;
}

/**
 *
 */
function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>)
{
    return <SheetPrimitive.Close data-slot="sheet-close"
        { ...props } />;
}

/**
 *
 */
function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>)
{
    return <SheetPrimitive.Portal data-slot="sheet-portal"
        { ...props } />;
}

/**
 *
 */
function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>)
{
    return (
        <SheetPrimitive.Overlay
            className={ cn(
                "fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                className
            ) }
            data-slot="sheet-overlay"
            { ...props } />
    );
}

/**
 *
 */
function SheetContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof SheetPrimitive.Content>)
{
    return (
        <SheetPortal>
            <SheetOverlay />
            <SheetPrimitive.Content
                className={ cn(
                    "fixed inset-x-0 top-0 z-50 flex flex-col gap-4 border-b border-border bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top data-[state=closed]:duration-200 data-[state=open]:duration-300",
                    className
                ) }
                data-slot="sheet-content"
                { ...props }>
                { children }
                <SheetPrimitive.Close className="absolute right-6 top-6 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <XIcon className="size-5" />
                    <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
            </SheetPrimitive.Content>
        </SheetPortal>
    );
}

/**
 *
 */
function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>)
{
    return (
        <SheetPrimitive.Title
            className={ cn("text-base font-semibold text-foreground", className) }
            data-slot="sheet-title"
            { ...props } />
    );
}

export {
    Sheet,
    SheetClose,
    SheetContent,
    SheetOverlay,
    SheetPortal,
    SheetTitle,
    SheetTrigger
};
