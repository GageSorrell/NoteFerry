/**
 * A themeable replacement for raw `Alert.alert` on Moderate-severity errors
 * (RELEASE_CHECKLIST.md §D3) -- composes the existing `Dialog`/`DialogContent`/
 * `DialogHeader`/`DialogTitle`/`DialogDescription`/`Button` Primitives rather
 * than introducing new dialog plumbing.
 *
 * Controlled-only (`Open`/`OnOpenChange`): the caller (`PresentError.ts` in
 * `Application/Mobile`) owns *when* an error dialog is showing, since that
 * decision is driven by a module-level error queue, not local component
 * state.
 *
 * @module @noteferry/ui/Block/ErrorDialog
 *
 * @file      ErrorDialog.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { Button } from "../Primitive/Button.js";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "../Primitive/Dialog.js";
import { MakeStyles, ViewStyle } from "../MakeStyles.js";

/** A single `ErrorDialog` action button. */
export interface ErrorDialogAction
{
    readonly Label: string;
    readonly OnPress: () => void;
}

/** {@inheritDoc ErrorDialog} */
export interface ErrorDialogProps
{
    readonly Open: boolean;
    readonly OnOpenChange: (Open: boolean) => void;
    readonly Title: string;
    readonly Message: string;

    /** The dialog's dismissing action -- also fired by the backdrop/close button. */
    readonly Primary: ErrorDialogAction;

    /** An optional second action (e.g. "Reconnect", "Go to Settings"). */
    readonly Secondary?: ErrorDialogAction;
}

export/**
       * A themed modal for Moderate-severity errors: a title, a message, and
       * one or two actions. See the module doc for why it's controlled-only.
       *
       * @category Component
       * @since 1.0.0
       */
const ErrorDialog = ({
    Open,
    OnOpenChange,
    Title,
    Message,
    Primary,
    Secondary
}: ErrorDialogProps): React.JSX.Element =>
{
    const Styles = useStyles();

    return (
        <Dialog
            OnOpenChange={ OnOpenChange }
            Open={ Open }>
            <DialogContent HideClose>
                <DialogHeader>
                    <DialogTitle>{ Title }</DialogTitle>
                    <DialogDescription>{ Message }</DialogDescription>
                </DialogHeader>
                <DialogFooter Style={ Styles.Footer }>
                    { Secondary !== undefined && (
                        <Button
                            Appearance="Hint"
                            OnPress={ Secondary.OnPress }
                            Style={ Styles.Button }>
                            { Secondary.Label }
                        </Button>
                    ) }
                    <Button
                        Appearance="Primary"
                        OnPress={ Primary.OnPress }
                        Style={ Styles.Button }>
                        { Primary.Label }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const useStyles = MakeStyles({
    Button: ViewStyle({
        flex: 1
    }),
    Footer: ViewStyle({
        alignSelf: "stretch",
        flexDirection: "row"
    })
});
