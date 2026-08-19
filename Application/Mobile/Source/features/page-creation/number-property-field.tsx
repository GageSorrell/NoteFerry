/**
 * Numeric input for Notion Number properties. Renders a numeric-keyboard
 * field and, when the property's `Format` carries a unit (a currency or
 * percent), shows that unit alongside the entered value.
 *
 * @module notivex/features/page-creation/number-property-field
 *
 * @file      number-property-field.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@notivex/domain";
import { Body, Input } from "@notivex/ui/Primitive";
import { MakeStyles, Token, ViewStyle } from "@notivex/ui";
import { PropertyLabel } from "@/features/page-creation/property-label";
import { View } from "react-native";

interface NumberUnit
{
    readonly Position: "Prefix" | "Suffix";
    readonly Symbol: string;
}

/**
 * Notion number `Format` values that carry a visible unit, mapped to that
 * unit's symbol and where it sits relative to the value. Formats absent here
 * (e.g. `number`, `number_with_commas`) have no unit.
 */
const NumberUnits: Readonly<Record<string, NumberUnit>> = Object.freeze({
    argentine_peso: { Position: "Prefix", Symbol: "ARS" },
    australian_dollar: { Position: "Prefix", Symbol: "A$" },
    baht: { Position: "Prefix", Symbol: "฿" },
    canadian_dollar: { Position: "Prefix", Symbol: "CA$" },
    chilean_peso: { Position: "Prefix", Symbol: "CLP" },
    colombian_peso: { Position: "Prefix", Symbol: "COL$" },
    danish_krone: { Position: "Prefix", Symbol: "kr" },
    dirham: { Position: "Prefix", Symbol: "AED" },
    dollar: { Position: "Prefix", Symbol: "$" },
    euro: { Position: "Prefix", Symbol: "€" },
    forint: { Position: "Prefix", Symbol: "Ft" },
    franc: { Position: "Prefix", Symbol: "CHF" },
    hong_kong_dollar: { Position: "Prefix", Symbol: "HK$" },
    koruna: { Position: "Prefix", Symbol: "Kč" },
    krona: { Position: "Prefix", Symbol: "kr" },
    leu: { Position: "Prefix", Symbol: "lei" },
    mexican_peso: { Position: "Prefix", Symbol: "MX$" },
    new_taiwan_dollar: { Position: "Prefix", Symbol: "NT$" },
    new_zealand_dollar: { Position: "Prefix", Symbol: "NZ$" },
    norwegian_krone: { Position: "Prefix", Symbol: "kr" },
    percent: { Position: "Suffix", Symbol: "%" },
    philippine_peso: { Position: "Prefix", Symbol: "₱" },
    pound: { Position: "Prefix", Symbol: "£" },
    rand: { Position: "Prefix", Symbol: "R" },
    real: { Position: "Prefix", Symbol: "R$" },
    ringgit: { Position: "Prefix", Symbol: "RM" },
    ruble: { Position: "Prefix", Symbol: "₽" },
    rupee: { Position: "Prefix", Symbol: "₹" },
    rupiah: { Position: "Prefix", Symbol: "Rp" },
    shekel: { Position: "Prefix", Symbol: "₪" },
    singapore_dollar: { Position: "Prefix", Symbol: "S$" },
    uruguayan_peso: { Position: "Prefix", Symbol: "$U" },
    won: { Position: "Prefix", Symbol: "₩" },
    yen: { Position: "Prefix", Symbol: "¥" },
    yuan: { Position: "Prefix", Symbol: "CN¥" },
    zloty: { Position: "Prefix", Symbol: "zł" }
});

/** Props for a Notion Number property field. */
export interface NumberPropertyFieldProps
{
    readonly Disabled?: boolean | undefined;
    readonly Inline?: boolean | undefined;
    readonly OnValueChange: (Value: string) => void;
    readonly Property: Domain.Property.NumberPropertyDefinition;
    readonly Value?: string | undefined;
}

/** Renders a labeled numeric field, annotated with the property's unit. */
export function NumberPropertyField({
    Disabled = false,
    Inline = false,
    OnValueChange,
    Property,
    Value
}: NumberPropertyFieldProps): React.JSX.Element
{
    const Styles = useStyles();
    const Unit = NumberUnits[Property.Format];
    const HasValue = (Value ?? "").trim() !== "";

    return (
        <View style={ [ Styles.Field, Inline && Styles.InlineField ] }>
            { Inline ? null : <PropertyLabel Property={ Property } /> }
            <View style={ Styles.InputRow }>
                { Unit?.Position === "Prefix" && HasValue
                    ? <Body Color={ Token.Semantic.Muted }>{ Unit.Symbol }</Body>
                    : null }
                <Input
                    Disabled={ Disabled }
                    KeyboardType="numeric"
                    OnChangeText={ OnValueChange }
                    Placeholder="Empty"
                    Style={ Styles.Input }
                    Value={ Value }
                    Variant={ Inline ? "Flat" : "Default" }
                />
                { Unit?.Position === "Suffix" && HasValue
                    ? <Body Color={ Token.Semantic.Muted }>{ Unit.Symbol }</Body>
                    : null }
            </View>
        </View>
    );
}

const useStyles = MakeStyles({
    Field: ViewStyle({
        gap: 6
    }),
    InlineField: ViewStyle({
        flex: 1,
        minWidth: 0
    }),
    Input: ViewStyle({
        flex: 1,
        minWidth: 0
    }),
    InputRow: ViewStyle({
        alignItems: "center",
        flexDirection: "row",
        gap: 4
    })
});
