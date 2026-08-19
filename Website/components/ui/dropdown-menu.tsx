import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>)
{
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" { ...props } />;
}

function DropdownMenuTrigger({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>)
{
    return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" { ...props } />;
}

function DropdownMenuPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>)
{
    return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" { ...props } />;
}

function DropdownMenuContent({
    className,
    sideOffset = 8,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>)
{
    return (
        <DropdownMenuPortal>
            <DropdownMenuPrimitive.Content
                className={ cn(
                    "z-50 min-w-40 overflow-hidden rounded-lg border border-border bg-card p-1 text-card-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
                    className
                ) }
                data-slot="dropdown-menu-content"
                sideOffset={ sideOffset }
                { ...props } />
        </DropdownMenuPortal>
    );
}

function DropdownMenuItem({
    className,
    inset,
    variant = "default",
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
})
{
    return (
        <DropdownMenuPrimitive.Item
            className={ cn(
                "relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 data-[variant=destructive]:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus:bg-muted",
                className
            ) }
            data-inset={ inset }
            data-slot="dropdown-menu-item"
            data-variant={ variant }
            { ...props } />
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>)
{
    return (
        <DropdownMenuPrimitive.CheckboxItem
            checked={ checked }
            className={ cn(
                "relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-muted",
                className
            ) }
            data-slot="dropdown-menu-checkbox-item"
            { ...props }>
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CheckIcon className="size-4" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            { children }
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioGroup({
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>)
{
    return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" { ...props } />;
}

function DropdownMenuRadioItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>)
{
    return (
        <DropdownMenuPrimitive.RadioItem
            className={ cn(
                "relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-muted",
                className
            ) }
            data-slot="dropdown-menu-radio-item"
            { ...props }>
            <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CircleIcon className="size-2 fill-current" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            { children }
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean })
{
    return (
        <DropdownMenuPrimitive.Label
            className={ cn(
                "px-2 py-1.5 text-xs font-medium text-muted-foreground data-[inset]:pl-8",
                className
            ) }
            data-inset={ inset }
            data-slot="dropdown-menu-label"
            { ...props } />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>)
{
    return (
        <DropdownMenuPrimitive.Separator
            className={ cn("-mx-1 my-1 h-px bg-border", className) }
            data-slot="dropdown-menu-separator"
            { ...props } />
    );
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>)
{
    return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" { ...props } />;
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean })
{
    return (
        <DropdownMenuPrimitive.SubTrigger
            className={ cn(
                "flex cursor-default items-center rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 data-[state=open]:bg-muted focus:bg-muted",
                className
            ) }
            data-inset={ inset }
            data-slot="dropdown-menu-sub-trigger"
            { ...props }>
            { children }
            <ChevronRightIcon className="ml-auto size-4" />
        </DropdownMenuPrimitive.SubTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>)
{
    return (
        <DropdownMenuPrimitive.SubContent
            className={ cn(
                "z-50 min-w-32 overflow-hidden rounded-lg border border-border bg-card p-1 text-card-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                className
            ) }
            data-slot="dropdown-menu-sub-content"
            { ...props } />
    );
}

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
};
