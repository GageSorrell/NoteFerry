import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 *
 */
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>)
{
    return <DialogPrimitive.Root data-slot="dialog"
        { ...props } />;
}

/**
 *
 */
function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>)
{
    return <DialogPrimitive.Trigger data-slot="dialog-trigger"
        { ...props } />;
}

/**
 *
 */
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>)
{
    return <DialogPrimitive.Portal data-slot="dialog-portal"
        { ...props } />;
}

/**
 *
 */
function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>)
{
    return <DialogPrimitive.Close data-slot="dialog-close"
        { ...props } />;
}

/**
 *
 */
function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>)
{
    return (
        <DialogPrimitive.Overlay
            className={ cn(
                "fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                className
            ) }
            data-slot="dialog-overlay"
            { ...props } />
    );
}

/**
 *
 */
function DialogContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>)
{
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                className={ cn(
                    "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                    className
                ) }
                data-slot="dialog-content"
                { ...props }>
                { children }
                <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                    <XIcon className="size-4" />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

/**
 *
 */
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>)
{
    return (
        <DialogPrimitive.Title
            className={ cn("text-base font-semibold text-foreground", className) }
            data-slot="dialog-title"
            { ...props } />
    );
}

/**
 *
 */
function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>)
{
    return (
        <DialogPrimitive.Description
            className={ cn("text-sm text-muted-foreground", className) }
            data-slot="dialog-description"
            { ...props } />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger
};
