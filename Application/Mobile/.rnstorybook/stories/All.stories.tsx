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

import * as React from "react";
import {
    AlertModal,
    Autocomplete,
    AutocompleteContent,
    AutocompleteEmpty,
    AutocompleteInput,
    AutocompleteItem,
    AutocompleteList,
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
    Calendar,
    Checkbox,
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxTrigger,
    ComboboxValue,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    Description,
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
    Form,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Heading3,
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
    ScrollArea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Separator,
    Skeleton,
    Sortable,
    Spinner,
    Switch,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    TagsInput,
    Text,
    Textarea,
    Toast,
    Toaster,
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@notivex/ui/Primitive";
import type { Meta, StoryObj } from "@storybook/react-native";
import { ScrollView, View } from "react-native";
import { Array } from "effect";
import type { Thunk } from "@sorrell/effect/Function";
import { useForm } from "react-hook-form";

interface SectionProps extends React.PropsWithChildren
{
    readonly Title: string;
}

const Section = ({ Title, children }: SectionProps): React.JSX.Element =>
    <View style={ { gap: 12 } }>
        <Heading3>
            { Title }
        </Heading3>
        { children }
        <Separator />
    </View>;

// `TooltipTrigger`/`ContextMenuTrigger` need to own their `Pressable`
// (long-press/hover), so their demo content here is inert — see
// `Tooltip.tsx`/`ContextMenu.tsx`'s doc comments.
const InertBadge = ({ Label: LabelText }: { readonly Label: string }): React.JSX.Element => (
    <View style={ {
        alignItems: "center",
        borderRadius: 14,
        borderWidth: 1,
        height: 28,
        justifyContent: "center",
        width: 28
    } }>
        <Text Variant="Label">
            { LabelText }
        </Text>
    </View>
);

const Fruits = [ "Apple", "Apricot", "Banana", "Blueberry", "Cherry" ];
const SortableItemExtent = 40;

interface AllExampleFormValues
{
    readonly Name: string;
}

const AllExample = (): React.JSX.Element =>
{
    const [ CheckboxChecked, SetCheckboxChecked ] = React.useState(false);
    const [ InputValue, SetInputValue ] = React.useState("");
    const [ RadioValue, SetRadioValue ] = React.useState("A");
    const [ SwitchValue, SetSwitchValue ] = React.useState(false);
    const [ TextareaValue, SetTextareaValue ] = React.useState("");
    const [ WrapChecked, SetWrapChecked ] = React.useState(true);
    const [ SelectValueState, SetSelectValueState ] = React.useState("board");
    const BottomSheetRef = React.useRef<BottomSheet>(null);
    const [ ComboboxValueState, SetComboboxValueState ] = React.useState("UTC");
    const [ CommandOpen, SetCommandOpen ] = React.useState(false);
    const [ CalendarValue, SetCalendarValue ] = React.useState<Date | undefined>(new Date());
    const [ TagsValue, SetTagsValue ] = React.useState<ReadonlyArray<string>>([ "Design", "Engineering" ]);
    const [ SortableOrder, SetSortableOrder ] =
        React.useState<ReadonlyArray<string>>([ "Introduction", "Getting Started", "FAQ" ]);
    const FormMethods = useForm<AllExampleFormValues>({ defaultValues: { Name: "" } });

    const OnPressBottomSheet = () =>
    {
        if (BottomSheetRef.current !== null && BottomSheetRef.current)
        {
            BottomSheetRef.current.present();
            setTimeout(BottomSheetRef.current.expand, 500);
        }
    };

    return (
        <View style={ { flex: 1 } }>
            <ScrollView contentContainerStyle={ {
                gap: 28,
                padding: 16,
                paddingBottom: 64
            } }>
                <Section Title="Avatar">
                    <Avatar Size={ 40 }>
                        <AvatarImage Source="https://picsum.photos/seed/notivex/128" />
                        <AvatarFallback>
                            <Text Variant="Label">NX</Text>
                        </AvatarFallback>
                    </Avatar>
                </Section>

                <Section Title="Badge">
                    <View style={ { flexDirection: "row", flexWrap: "wrap", gap: 8 } }>
                        <Badge>Default</Badge>
                        <Badge Variant="Gray">Gray</Badge>
                        <Badge Variant="Blue">Blue</Badge>
                        <Badge Variant="Orange">Orange</Badge>
                        <Badge Variant="Tag">Tag</Badge>
                    </View>
                </Section>

                <Section Title="Button">
                    <View style={ { flexDirection: "row", flexWrap: "wrap", gap: 8 } }>
                        <Button>Primary</Button>
                        <Button Appearance="Blue">Blue</Button>
                        <Button Appearance="Red">Red</Button>
                        <Button Appearance="RedFill">Red Fill</Button>
                    </View>
                </Section>

                <Section Title="Checkbox">
                    <Checkbox
                        AccessibilityLabel="Checkbox"
                        Checked={ CheckboxChecked }
                        OnCheckedChange={ SetCheckboxChecked }
                    />
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
                        Clear
                        OnCancel={ () => SetInputValue("") }
                        OnChangeText={ SetInputValue }
                        Placeholder="Search…"
                        Search
                        Value={ InputValue }
                    />
                </Section>

                <Section Title="Label">
                    <Label>Field label</Label>
                </Section>

                <Section Title="Meter">
                    <View style={ { gap: 12 } }>
                        <MeterBar Value={ 60 } />
                        <View style={ { flexDirection: "row", gap: 12 } }>
                            <MeterRing
                                Size={ 32 }
                                Value={ 25 }
                            />
                            <MeterRing
                                Size={ 32 }
                                Value={ 60 }
                            />
                            <MeterRing
                                Size={ 32 }
                                Value={ 100 }
                            />
                        </View>
                    </View>
                </Section>

                <Section Title="RadioGroup">
                    <RadioGroup
                        OnValueChange={ SetRadioValue }
                        Value={ RadioValue }>
                        <View style={ {
                            alignItems: "center",
                            flexDirection: "row",
                            gap: 8
                        } }>
                            <RadioGroupItem Value="A" />
                            <Label>Option A</Label>
                        </View>
                        <View style={ {
                            alignItems: "center",
                            flexDirection: "row",
                            gap: 8
                        } }>
                            <RadioGroupItem Value="B" />
                            <Label>Option B</Label>
                        </View>
                    </RadioGroup>
                </Section>

                <Section Title="Skeleton">
                    <View style={ { gap: 8, width: 200 } }>
                        <Skeleton
                            Style={ {
                                borderRadius: 20,
                                height: 40,
                                width: 40
                            } }
                        />
                        <Skeleton
                            Style={ {
                                height: 12,
                                width: "80%"
                            } }
                        />
                    </View>
                </Section>

                <Section Title="Spinner">
                    <View style={ { flexDirection: "row", gap: 24 } }>
                        <Spinner
                            Size={ 24 }
                            Variant="Solid"
                        />
                        <Spinner
                            Size={ 24 }
                            Variant="Dashed"
                        />
                    </View>
                </Section>

                <Section Title="Switch">
                    <Switch
                        AccessibilityLabel="Switch"
                        OnValueChange={ SetSwitchValue }
                        Value={ SwitchValue }
                    />
                </Section>

                <Section Title="Text">
                    <View style={ { alignItems: "flex-start", gap: 8 } }>
                        <Text Variant="Heading1">Heading1</Text>
                        <Text Variant="Body">Body text.</Text>
                        <Text Variant="Description">Description text.</Text>
                    </View>
                </Section>

                <Section Title="Textarea">
                    <Textarea
                        NumberOfLines={ 3 }
                        OnChangeText={ SetTextareaValue }
                        Placeholder="Write something…"
                        Value={ TextareaValue }
                    />
                </Section>

                <Section Title="Dialog">
                    <Dialog>
                        <DialogTrigger AsChild>
                            <Button>Open dialog</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete this page?</DialogTitle>
                                <DialogDescription>
                                    This can be undone from Trash for 30 days.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose
                                    Size="Small"
                                    Style={ { width: "100%" } }
                                    Variant="RedFill">
                                    Delete
                                </DialogClose>
                                <DialogClose
                                    Size="Small"
                                    Style={ { width: "100%" } }>
                                    Cancel
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </Section>

                <Section Title="AlertModal">
                    <Dialog>
                        <DialogTrigger AsChild>
                            <Button Appearance="Red">Delete workspace…</Button>
                        </DialogTrigger>
                        <AlertModal
                            OnTrigger={ () => new Promise<void>(
                                (Resolve: Thunk) => setTimeout(Resolve, 800)
                            ) }
                            Primary="Delete"
                            Secondary="Cancel"
                            Title="Delete this workspace?"
                        />
                    </Dialog>
                </Section>

                <Section Title="Popover">
                    <Popover>
                        <PopoverTrigger AsChild>
                            <Button>Open popover</Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <View style={ { alignItems: "flex-start", gap: 8 } }>
                                <Heading3>Popover title</Heading3>
                                <Description>Anchored to the trigger.</Description>
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
                                <DropdownMenuItem
                                    Label="Rename"
                                    OnSelect={ () => {} }
                                />
                                <DropdownMenuItem
                                    Label="Delete"
                                    OnSelect={ () => { } }
                                    Variant="Error"
                                />
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                Checked={ WrapChecked }
                                Label="Wrap text"
                                OnCheckedChange={ SetWrapChecked }
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Section>

                <Section Title="ContextMenu">
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <View style={ {
                                alignItems: "center",
                                borderRadius: 8,
                                borderWidth: 1,
                                height: 80,
                                justifyContent: "center",
                                width: 220
                            } }>
                                <Text Variant="Description">
                                    Long-press this card
                                </Text>
                            </View>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem
                                Label="Copy"
                                OnSelect={ () => { } }
                            />
                            <ContextMenuItem
                                Label="Delete"
                                OnSelect={ () => { } }
                                Variant="Error"
                            />
                        </ContextMenuContent>
                    </ContextMenu>
                </Section>

                <Section Title="Select">
                    <View style={ { width: 220 } }>
                        <Select
                            OnValueChange={ SetSelectValueState }
                            Value={ SelectValueState }>
                            <SelectTrigger>
                                <SelectValue Placeholder="Choose a view" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    Label="Board"
                                    Value="board"
                                />
                                <SelectItem
                                    Label="Table"
                                    Value="table"
                                />
                                <SelectItem
                                    Label="Calendar"
                                    Value="calendar"
                                />
                            </SelectContent>
                        </Select>
                    </View>
                </Section>

                <Section Title="Toast">
                    <Button OnPress={ () => Toast.Success("Page published") }>Trigger toast</Button>
                </Section>

                <Section Title="BottomSheet">
                    <Button OnPress={ OnPressBottomSheet }>Open bottom sheet</Button>
                    <BottomSheet Ref={ BottomSheetRef }>
                        <BottomSheetHeader>
                            <BottomSheetTitle>
                                Share this page
                            </BottomSheetTitle>
                            <BottomSheetDescription>
                                Anyone with the link can view.
                            </BottomSheetDescription>
                        </BottomSheetHeader>
                        <BottomSheetFooter>
                            <Button
                                Appearance="Blue"
                                OnPress={ () => BottomSheetRef.current?.dismiss() }>
                                Copy link
                            </Button>
                        </BottomSheetFooter>
                    </BottomSheet>
                </Section>

                <Section Title="Tabs">
                    <View style={ { width: 260 } }>
                        <Tabs DefaultValue="board">
                            <TabsList>
                                <TabsTrigger Value="board">
                                    Board
                                </TabsTrigger>
                                <TabsTrigger Value="table">
                                    Table
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent Value="board">
                                <Text Style={ { paddingTop: 12 } }
                                    Variant="Body">
                                    Board view content.
                                </Text>
                            </TabsContent>
                            <TabsContent Value="table">
                                <Text Style={ { paddingTop: 12 } }
                                    Variant="Body">
                                    Table view content.
                                </Text>
                            </TabsContent>
                        </Tabs>
                    </View>
                </Section>

                <Section Title="Autocomplete">
                    <View style={ { width: 240 } }>
                        <Autocomplete>
                            <AutocompleteInput Placeholder="Search fruit…" />
                            <AutocompleteContent Variant="Inline">
                                <AutocompleteList>
                                    { Fruits.map((Fruit: string) =>
                                        <AutocompleteItem
                                            Value={ Fruit }
                                            key={ Fruit }
                                        />
                                    ) }
                                    <AutocompleteEmpty />
                                </AutocompleteList>
                            </AutocompleteContent>
                        </Autocomplete>
                    </View>
                </Section>

                <Section Title="Combobox">
                    <View style={ { width: 220 } }>
                        <Combobox
                            OnValueChange={ SetComboboxValueState }
                            Value={ ComboboxValueState }>
                            <ComboboxTrigger>
                                <ComboboxValue Placeholder="Choose a timezone" />
                            </ComboboxTrigger>
                            <ComboboxContent>
                                <ComboboxInput Placeholder="Search timezone…" />
                                <ComboboxList>
                                    { [ "UTC", "America/New_York", "Europe/London" ].map((Timezone: string) =>
                                        <ComboboxItem
                                            Value={ Timezone }
                                            key={ Timezone }
                                        />
                                    ) }
                                    <ComboboxEmpty />
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </View>
                </Section>

                <Section Title="Command">
                    <Button OnPress={ () => SetCommandOpen(true) }>Open command palette</Button>
                    <CommandDialog
                        OnOpenChange={ SetCommandOpen }
                        Open={ CommandOpen }>
                        <CommandInput />
                        <CommandList>
                            <CommandEmpty />
                            <CommandGroup Heading="Actions">
                                <CommandItem
                                    OnSelect={ () => SetCommandOpen(false) }
                                    Shortcut="⌘N"
                                    Value="New page"
                                />
                                <CommandItem
                                    OnSelect={ () => SetCommandOpen(false) }
                                    Shortcut="⌘K"
                                    Value="Search"
                                />
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup Heading="Navigate">
                                <CommandItem
                                    OnSelect={ () => SetCommandOpen(false) }
                                    Value="Go to Settings"
                                />
                            </CommandGroup>
                        </CommandList>
                    </CommandDialog>
                </Section>

                <Section Title="Calendar">
                    <View style={ { gap: 8, width: 300 } }>
                        <Calendar
                            OnValueChange={ SetCalendarValue }
                            Value={ CalendarValue }
                        />
                        <Text Variant="Description">
                            { CalendarValue ? CalendarValue.toDateString() : "No date selected" }
                        </Text>
                    </View>
                </Section>

                <Section Title="Form">
                    <View style={ { width: 260 } }>
                        <Form { ...FormMethods }>
                            <FormField
                                control={ FormMethods.control }
                                name="Name"
                                render={ ({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <Input
                                            OnChangeText={ field.onChange }
                                            Placeholder="Ada Lovelace"
                                            Value={ field.value }
                                        />
                                        <FormDescription>
                                            Shown on your public profile.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                ) }
                                rules={ { required: "Name is required." } }
                            />
                        </Form>
                    </View>
                </Section>

                <Section Title="TagsInput">
                    <View style={ { width: 260 } }>
                        <TagsInput
                            OnValueChange={ SetTagsValue }
                            Placeholder="Add a tag…"
                            Value={ TagsValue }
                        />
                    </View>
                </Section>

                <Section Title="Sortable">
                    <View style={ { width: 260 } }>
                        <Sortable.Root
                            ItemExtent={ SortableItemExtent }
                            OnValueChange={ SetSortableOrder }
                            Value={ SortableOrder }>
                            <Sortable.List>
                                {SortableOrder.map((Id: string) => (
                                    <Sortable.Item
                                        Id={ Id }
                                        key={ Id }>
                                        <View
                                            style={ {
                                                alignItems: "center",
                                                borderBottomColor: "rgba(0, 0, 0, 0.08)",
                                                borderBottomWidth: 1,
                                                flexDirection: "row",
                                                height: SortableItemExtent,
                                                paddingHorizontal: 8
                                            } }>
                                            <Sortable.Handle />
                                            <Text Style={ { marginLeft: 8 } }
                                                Variant="Body">
                                                {Id}
                                            </Text>
                                        </View>
                                    </Sortable.Item>
                                ))}
                            </Sortable.List>
                        </Sortable.Root>
                    </View>
                </Section>

                <Section Title="ScrollArea">
                    <View style={ {
                        borderColor: "rgba(0, 0, 0, 0.08)",
                        borderWidth: 1,
                        height: 120,
                        width: 260
                    } }>
                        <ScrollArea>
                            { Array.range(0, 11)
                                .map((Index: number) => `Row ${ Index + 1 }`)
                                .map((Row: string) =>
                                    <View
                                        key={ Row }
                                        style={ {
                                            borderBottomColor: "rgba(0, 0, 0, 0.05)",
                                            borderBottomWidth: 1,
                                            padding: 10
                                        } }>
                                        <Text Variant="Body">{ Row }</Text>
                                    </View>
                                )
                            }
                        </ScrollArea>
                    </View>
                </Section>
            </ScrollView>
            <Toaster />
        </View>
    );
};

const meta =
    {
        component: AllExample,
        title: "All"
    } satisfies Meta<typeof AllExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story =
    {
        name: "All"
    } as const;
