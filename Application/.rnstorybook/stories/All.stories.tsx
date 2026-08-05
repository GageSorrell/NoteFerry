/**
 * A single scrollable story containing a compact demo of every
 * `@notivex/ui` primitive at once, for eyeballing the whole library on one
 * screen. Every primitive still has its own dedicated, interactive story
 * (with controls) elsewhere — this just gives a fast overview, so (per
 * scope) it skips Storybook args/controls and just renders static/locally-
 * stateful demo content directly. Deliberately self-contained (imports only
 * from `@notivex/ui/Primitive`, not from any other `.stories.tsx` file) so
 * it has no dependency on — and can't be broken by editing — any other
 * story file.
 *
 * @module notivex/app/.rnstorybook/stories/All
 *
 * @file      All.stories.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import {
    AlertModal,
    Avatar,
    AvatarFallback,
    AvatarImage,
    Badge,
    BottomSheet,
    BottomSheetDescription,
    BottomSheetFooter,
    BottomSheetHeader,
    BottomSheetTitle,
    Button,
    Checkbox,
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    Input,
    Label,
    MeterBar,
    MeterRing,
    Popover,
    PopoverClose,
    PopoverContent,
    PopoverTrigger,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Separator,
    Skeleton,
    Spinner,
    Switch,
    Text,
    Textarea,
    Toast,
    Toaster,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import * as React from "react";
import { ScrollView, View } from "react-native";

interface SectionProps {
    readonly Title: string;
    readonly children?: React.ReactNode;
}

const Section = ({ Title, children }: SectionProps): React.JSX.Element => (
    <View style={{ gap: 12 }}>
        <Text Variant="Heading3">{Title}</Text>
        {children}
        <Separator />
    </View>
);

// `TooltipTrigger`/`ContextMenuTrigger` need to own their `Pressable`
// (long-press/hover), so their demo content here is inert — see
// `Tooltip.tsx`/`ContextMenu.tsx`'s doc comments.
const InertBadge = ({ Label: LabelText }: { readonly Label: string }): React.JSX.Element => (
    <View style={{ alignItems: "center", borderRadius: 14, borderWidth: 1, height: 28, justifyContent: "center", width: 28 }}>
        <Text Variant="Label">{LabelText}</Text>
    </View>
);

const AllExample = (): React.JSX.Element => {
    const [CheckboxChecked, SetCheckboxChecked] = React.useState(false);
    const [InputValue, SetInputValue] = React.useState("");
    const [RadioValue, SetRadioValue] = React.useState("A");
    const [SwitchValue, SetSwitchValue] = React.useState(false);
    const [TextareaValue, SetTextareaValue] = React.useState("");
    const [WrapChecked, SetWrapChecked] = React.useState(true);
    const [SelectValueState, SetSelectValueState] = React.useState("board");
    const [SheetPresented, SetSheetPresented] = React.useState(false);

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ gap: 28, padding: 16, paddingBottom: 64 }}>
                <Section Title="Avatar">
                    <Avatar Size={40}>
                        <AvatarImage Source="https://picsum.photos/seed/notivex/128" />
                        <AvatarFallback>
                            <Text Variant="Label">NX</Text>
                        </AvatarFallback>
                    </Avatar>
                </Section>

                <Section Title="Badge">
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        <Badge>Default</Badge>
                        <Badge Variant="Gray">Gray</Badge>
                        <Badge Variant="Blue">Blue</Badge>
                        <Badge Variant="Orange">Orange</Badge>
                        <Badge Variant="Tag">Tag</Badge>
                    </View>
                </Section>

                <Section Title="Button">
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        <Button>Primary</Button>
                        <Button Variant="Blue">Blue</Button>
                        <Button Variant="Red">Red</Button>
                        <Button Variant="RedFill">Red Fill</Button>
                    </View>
                </Section>

                <Section Title="Checkbox">
                    <Checkbox Checked={CheckboxChecked} OnCheckedChange={SetCheckboxChecked} AccessibilityLabel="Checkbox" />
                </Section>

                <Section Title="Field">
                    <FieldSet>
                        <FieldLegend>Profile</FieldLegend>
                        <FieldGroup>
                            <Field>
                                <FieldContent>
                                    <FieldLabel>Name</FieldLabel>
                                    <Input Placeholder="Ada Lovelace" />
                                    <FieldDescription>Shown on your public profile.</FieldDescription>
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </FieldSet>
                </Section>

                <Section Title="Input">
                    <Input
                        Value={InputValue}
                        OnChangeText={SetInputValue}
                        Placeholder="Search…"
                        Search
                        Clear
                        OnCancel={() => SetInputValue("")}
                    />
                </Section>

                <Section Title="Label">
                    <Label>Field label</Label>
                </Section>

                <Section Title="Meter">
                    <View style={{ gap: 12 }}>
                        <MeterBar Value={60} />
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <MeterRing Value={25} Size={32} />
                            <MeterRing Value={60} Size={32} />
                            <MeterRing Value={100} Size={32} />
                        </View>
                    </View>
                </Section>

                <Section Title="RadioGroup">
                    <RadioGroup Value={RadioValue} OnValueChange={SetRadioValue}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <RadioGroupItem Value="A" />
                            <Label>Option A</Label>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <RadioGroupItem Value="B" />
                            <Label>Option B</Label>
                        </View>
                    </RadioGroup>
                </Section>

                <Section Title="Skeleton">
                    <View style={{ gap: 8, width: 200 }}>
                        <Skeleton Style={{ width: 40, height: 40, borderRadius: 20 }} />
                        <Skeleton Style={{ width: "80%", height: 12 }} />
                    </View>
                </Section>

                <Section Title="Spinner">
                    <View style={{ flexDirection: "row", gap: 24 }}>
                        <Spinner Variant="Solid" Size={24} />
                        <Spinner Variant="Dashed" Size={24} />
                    </View>
                </Section>

                <Section Title="Switch">
                    <Switch Value={SwitchValue} OnValueChange={SetSwitchValue} AccessibilityLabel="Switch" />
                </Section>

                <Section Title="Text">
                    <View style={{ gap: 8, alignItems: "flex-start" }}>
                        <Text Variant="Heading1">Heading1</Text>
                        <Text Variant="Body">Body text.</Text>
                        <Text Variant="Description">Description text.</Text>
                    </View>
                </Section>

                <Section Title="Textarea">
                    <Textarea Value={TextareaValue} OnChangeText={SetTextareaValue} Placeholder="Write something…" NumberOfLines={3} />
                </Section>

                <Section Title="Dialog">
                    <Dialog>
                        <DialogTrigger AsChild>
                            <Button>Open dialog</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete this page?</DialogTitle>
                                <DialogDescription>This can be undone from Trash for 30 days.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose Variant="RedFill" Size="Small" Style={{ width: "100%" }}>
                                    Delete
                                </DialogClose>
                                <DialogClose Size="Small" Style={{ width: "100%" }}>
                                    Cancel
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </Section>

                <Section Title="AlertModal">
                    <Dialog>
                        <DialogTrigger AsChild>
                            <Button Variant="Red">Delete workspace…</Button>
                        </DialogTrigger>
                        <AlertModal
                            Title="Delete this workspace?"
                            Primary="Delete"
                            Secondary="Cancel"
                            OnTrigger={() => new Promise<void>((Resolve) => setTimeout(Resolve, 800))}
                        />
                    </Dialog>
                </Section>

                <Section Title="Popover">
                    <Popover>
                        <PopoverTrigger AsChild>
                            <Button>Open popover</Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <View style={{ gap: 8, alignItems: "flex-start" }}>
                                <Text Variant="Heading3">Popover title</Text>
                                <Text Variant="Description">Anchored to the trigger.</Text>
                                <PopoverClose />
                            </View>
                        </PopoverContent>
                    </Popover>
                </Section>

                <Section Title="Tooltip">
                    <Tooltip>
                        <TooltipTrigger>
                            <InertBadge Label="i" />
                        </TooltipTrigger>
                        <TooltipContent>Long-press (or hover, on web) to reveal this hint.</TooltipContent>
                    </Tooltip>
                </Section>

                <Section Title="DropdownMenu">
                    <DropdownMenu>
                        <DropdownMenuTrigger AsChild>
                            <Button>Options</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem Label="Rename" OnSelect={() => {}} />
                                <DropdownMenuItem Label="Delete" Variant="Error" OnSelect={() => {}} />
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem Label="Wrap text" Checked={WrapChecked} OnCheckedChange={SetWrapChecked} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Section>

                <Section Title="ContextMenu">
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <View style={{ width: 220, height: 80, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" }}>
                                <Text Variant="Description">Long-press this card</Text>
                            </View>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem Label="Copy" OnSelect={() => {}} />
                            <ContextMenuItem Label="Delete" Variant="Error" OnSelect={() => {}} />
                        </ContextMenuContent>
                    </ContextMenu>
                </Section>

                <Section Title="Select">
                    <View style={{ width: 220 }}>
                        <Select Value={SelectValueState} OnValueChange={SetSelectValueState}>
                            <SelectTrigger>
                                <SelectValue Placeholder="Choose a view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem Value="board" Label="Board" />
                                <SelectItem Value="table" Label="Table" />
                                <SelectItem Value="calendar" Label="Calendar" />
                            </SelectContent>
                        </Select>
                    </View>
                </Section>

                <Section Title="Toast">
                    <Button OnPress={() => Toast.Success("Page published")}>Trigger toast</Button>
                </Section>

                <Section Title="BottomSheet">
                    <Button OnPress={() => SetSheetPresented(true)}>Open bottom sheet</Button>
                    <BottomSheet IsPresented={SheetPresented} OnDismiss={() => SetSheetPresented(false)} SnapPoints={["Half"]}>
                        <BottomSheetHeader>
                            <BottomSheetTitle>Share this page</BottomSheetTitle>
                            <BottomSheetDescription>Anyone with the link can view.</BottomSheetDescription>
                        </BottomSheetHeader>
                        <BottomSheetFooter>
                            <Button Variant="Blue" OnPress={() => SetSheetPresented(false)}>
                                Copy link
                            </Button>
                        </BottomSheetFooter>
                    </BottomSheet>
                </Section>
            </ScrollView>
            <Toaster />
        </View>
    );
};

const meta = {
    component: AllExample,
    title: "All",
} satisfies Meta<typeof AllExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
