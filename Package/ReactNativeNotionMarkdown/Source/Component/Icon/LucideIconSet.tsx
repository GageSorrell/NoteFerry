import * as React from "react";
import type { LucideIcon } from "lucide-react-native";
import ArrowLeft from "lucide-react-native/icons/arrow-left";
import Baseline from "lucide-react-native/icons/baseline";
import Bold from "lucide-react-native/icons/bold";
import Code from "lucide-react-native/icons/code";
import IndentIncrease from "lucide-react-native/icons/list-indent-increase";
import IndentDecrease from "lucide-react-native/icons/list-indent-decrease";
import Italic from "lucide-react-native/icons/italic";
import Link from "lucide-react-native/icons/link";
import Plus from "lucide-react-native/icons/plus";
import Repeat2 from "lucide-react-native/icons/repeat-2";
import Sigma from "lucide-react-native/icons/sigma";
import Strikethrough from "lucide-react-native/icons/strikethrough";
import Text from "lucide-react-native/icons/type";
import Underline from "lucide-react-native/icons/underline";
import X from "lucide-react-native/icons/x";
import type { IconComponent, IconProps, IconSet } from "./IconSet.js";

const Adapt = (Icon: LucideIcon): IconComponent => {
    const Component = ({ Size = 18, Color = "#37352F" }: IconProps): React.ReactElement => <Icon color={Color} size={Size} />;
    return Component;
};

export/** Lucide-backed icons, published separately so the main entry never imports the optional peer. */
const LucideIconSet: IconSet =
    {
        Insert: Adapt(Plus),
        Formatting: Adapt(Text),
        TurnInto: Adapt(Repeat2),
        DismissKeyboard: Adapt(X),
        Back: Adapt(ArrowLeft),
        TextColor: Adapt(Baseline),
        Bold: Adapt(Bold),
        Italic: Adapt(Italic),
        Underline: Adapt(Underline),
        Strikethrough: Adapt(Strikethrough),
        Link: Adapt(Link),
        Code: Adapt(Code),
        Equation: Adapt(Sigma),
        Close: Adapt(X),
        Indent: Adapt(IndentIncrease),
        Outdent: Adapt(IndentDecrease),
    };
