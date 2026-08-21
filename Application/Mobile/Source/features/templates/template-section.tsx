/**
 * The "Templates" section of the database settings sub-screen
 * (`destination-config.tsx`): a "No template" row, a drag-reorderable list
 * of a data source's non-hidden Notion templates (each with a 3-dot menu to
 * hide it or select it as Notivex's default), and a collapsed-by-default
 * list of the templates that have been hidden, each with a button to
 * restore it to the main list.
 *
 * @module notivex/features/templates/template-section
 *
 * @file      template-section.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import {
    Body,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    Heading2,
    LabelText,
    Pressable,
    Sortable
} from "@notivex/ui/Primitive";
import { Ban, Check, ChevronDown, ChevronUp, EllipsisVertical, Eye, EyeOff, Star } from "lucide-react-native";
import { MakeStyles, TextStyle, Token, ViewStyle, useTheme, useToken } from "@notivex/ui";
import { IconBlock } from "@notivex/ui/Block";
import { ApplyVisibleReorder } from "./template-values";
import { ResolveTemplateIconData } from "./template-icon";
import { useCallback, useState } from "react";
import { View } from "react-native";

const Semantic = Token.Semantic;

const ItemExtent = 52;

/** {@inheritDoc TemplateSection} */
export interface TemplateSectionProps
{
    readonly Templates: ReadonlyArray<Domain.DataSource.CachedDataSourceTemplate>;
    readonly Template: Domain.Destination.DestinationTemplate;
    readonly OnTemplateChange: (Value: Domain.Destination.DestinationTemplate) => void;
    readonly TemplateConfiguration: Domain.Destination.TemplateConfiguration;
    readonly OnTemplateConfigurationChange: (Value: Domain.Destination.TemplateConfiguration) => void;
}

interface TemplateRowProps
{
    readonly IsSelected: boolean;
    readonly OnHide: () => void;
    readonly OnSelectDefault: () => void;
    readonly Template: Domain.DataSource.CachedDataSourceTemplate;
}

const TemplateRow = ({ IsSelected, OnHide, OnSelectDefault, Template }: TemplateRowProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <View style={ Styles.Row }>
            <Sortable.Handle />
            <Pressable
                Accessibility={ { Label: `Select ${ Template.Name } as default`, Role: "button" } }
                OnPress={ OnSelectDefault }
                style={ Styles.RowMain }>
                <IconBlock
                    Icon={ ResolveTemplateIconData(Template.Icon, Template.IconType) }
                    Size="Small"
                />
                <Body
                    NumberOfLines={ 1 }
                    Style={ Styles.RowName }>
                    { Template.Name }
                </Body>
                { IsSelected ? <Check size={ 16 } /> : null }
            </Pressable>
            <DropdownMenu>
                <DropdownMenuTrigger AccessibilityLabel={ `More options for ${ Template.Name }` }>
                    <View style={ Styles.MenuButton }>
                        <EllipsisVertical size={ 18 } />
                    </View>
                </DropdownMenuTrigger>
                <DropdownMenuContent MatchTriggerWidth={ false }>
                    <DropdownMenuItem
                        Icon={ <EyeOff size={ 16 } /> }
                        Label="Hide"
                        OnSelect={ OnHide }
                    />
                    <DropdownMenuItem
                        Icon={ <Star size={ 16 } /> }
                        Label="Select as default"
                        OnSelect={ OnSelectDefault }
                    />
                </DropdownMenuContent>
            </DropdownMenu>
        </View>
    );
};

export/**
       * The templates section of the database settings sub-screen. Renders
       * nothing when the data source has no Notion templates at all.
       *
       * @category Component
       * @since 1.0.0
       */
const TemplateSection = ({
    Templates,
    Template,
    OnTemplateChange,
    TemplateConfiguration,
    OnTemplateConfigurationChange
}: TemplateSectionProps): React.JSX.Element | null =>
{
    const Styles = useStyles();
    const Theme = useTheme();
    const [ IsHiddenExpanded, SetIsHiddenExpanded ] = useState(false);
    const { [Semantic.Muted]: MutedColor } = useToken(Semantic.Muted);

    const TemplateById = new Map(Templates.map((Entry) => [ Entry.TemplateId, Entry ] as const));
    const VisibleIds = TemplateConfiguration.TemplateOrder.filter((Id) =>
        !TemplateConfiguration.Hidden.includes(Id) && TemplateById.has(Id));
    const HiddenIds = TemplateConfiguration.TemplateOrder.filter((Id) =>
        TemplateConfiguration.Hidden.includes(Id) && TemplateById.has(Id));

    const Reorder = useCallback((NextVisibleOrder: ReadonlyArray<string>) =>
    {
        OnTemplateConfigurationChange({
            ...TemplateConfiguration,
            TemplateOrder: ApplyVisibleReorder(
                TemplateConfiguration.TemplateOrder,
                TemplateConfiguration.Hidden,
                NextVisibleOrder
            )
        });
    }, [ OnTemplateConfigurationChange, TemplateConfiguration ]);

    const Hide = useCallback((TemplateId: Domain.Id.NotionTemplateId) =>
    {
        OnTemplateConfigurationChange({
            ...TemplateConfiguration,
            Hidden: [ ...TemplateConfiguration.Hidden, TemplateId ]
        });
    }, [ OnTemplateConfigurationChange, TemplateConfiguration ]);

    const Unhide = useCallback((TemplateId: Domain.Id.NotionTemplateId) =>
    {
        OnTemplateConfigurationChange({
            ...TemplateConfiguration,
            Hidden: TemplateConfiguration.Hidden.filter((Id) => Id !== TemplateId)
        });
    }, [ OnTemplateConfigurationChange, TemplateConfiguration ]);

    if (Templates.length === 0)
    {
        return null;
    }

    return (
        <View>
            <Heading2 Style={ Styles.SectionHeading }>Templates</Heading2>

            <Pressable
                Accessibility={ { Label: "Use no template", Role: "button" } }
                OnPress={ () => OnTemplateChange({ Type: "None" }) }
                style={ Styles.Row }>
                <Ban
                    color={ Theme.Semantic.IconSecondary }
                    size={ 18 }
                />
                <Body Style={ Styles.RowName }>No template</Body>
                { Template.Type === "None" ? <Check size={ 16 } /> : null }
            </Pressable>

            <Sortable.Root
                ItemExtent={ ItemExtent }
                OnValueChange={ Reorder }
                Value={ VisibleIds }>
                <Sortable.List>
                    { VisibleIds.map((Id) =>
                    {
                        const Entry = TemplateById.get(Id);

                        if (!Entry)
                        {
                            return null;
                        }

                        return (
                            <Sortable.Item
                                Id={ Id }
                                key={ Id }>
                                <TemplateRow
                                    IsSelected={ Template.Type === "Specific" && Template.TemplateId === Id }
                                    OnHide={ () => Hide(Id) }
                                    OnSelectDefault={ () => OnTemplateChange({ TemplateId: Id, Type: "Specific" }) }
                                    Template={ Entry }
                                />
                            </Sortable.Item>
                        );
                    }) }
                </Sortable.List>
            </Sortable.Root>

            { HiddenIds.length > 0
                ? (
                    <View style={ Styles.HiddenSection }>
                        <Pressable
                            Accessibility={ {
                                Label: undefined,
                                Role: "button",
                                State: { expanded: IsHiddenExpanded }
                            } }
                            OnPress={ () => SetIsHiddenExpanded((Current) => !Current) }
                            style={ Styles.DisclosureTrigger }>
                            <LabelText Color={ Semantic.Muted }>
                                Hidden templates ({ HiddenIds.length })
                            </LabelText>
                            { IsHiddenExpanded
                                ? <ChevronUp color={ MutedColor } size={ 16 } />
                                : <ChevronDown color={ MutedColor } size={ 16 } /> }
                        </Pressable>

                        { IsHiddenExpanded
                            ? HiddenIds.map((Id) =>
                            {
                                const Entry = TemplateById.get(Id);

                                if (!Entry)
                                {
                                    return null;
                                }

                                return (
                                    <View
                                        key={ Id }
                                        style={ Styles.Row }>
                                        <IconBlock
                                            Icon={ ResolveTemplateIconData(Entry.Icon, Entry.IconType) }
                                            Muted
                                            Size="Small"
                                        />
                                        <Body
                                            Color={ Semantic.Muted }
                                            NumberOfLines={ 1 }
                                            Style={ Styles.RowName }>
                                            { Entry.Name }
                                        </Body>
                                        <Pressable
                                            Accessibility={ {
                                                Label: `Unhide ${ Entry.Name }`,
                                                Role: "button"
                                            } }
                                            OnPress={ () => Unhide(Id) }
                                            style={ Styles.MenuButton }>
                                            <Eye
                                                color={ MutedColor }
                                                size={ 18 }
                                            />
                                        </Pressable>
                                    </View>
                                );
                            })
                            : null }
                    </View>
                )
                : null }
        </View>
    );
};

const useStyles = MakeStyles({
    DisclosureTrigger: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.Xs,
        paddingVertical: Token.Spacing.S
    }),
    HiddenSection: ViewStyle({
        marginTop: Token.Spacing.S
    }),
    MenuButton: ViewStyle({
        alignItems: "center",
        height: 32,
        justifyContent: "center",
        width: 32
    }),
    Row: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: Token.Spacing.S,
        height: ItemExtent
    }),
    RowMain: ViewStyle({
        alignItems: "center",
        flex: 1,
        flexDirection: "row",
        gap: Token.Spacing.S
    }),
    RowName: TextStyle({
        flex: 1
    }),
    SectionHeading: TextStyle({
        marginTop: Token.Spacing.L
    })
});

export default TemplateSection;
