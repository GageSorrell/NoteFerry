/**
 * Ported from `@notion-kit/ui`'s `alert-modal/index.tsx` — a small
 * confirmation dialog (title + primary/secondary buttons), composed on top
 * of `Dialog.tsx` rather than talking to `Modal` directly. Renders as a
 * `DialogContent`, so it's meant to be used as a `Dialog`'s child, not
 * mounted standalone.
 *
 * @module @notivex/ui/Primitive/AlertModal
 *
 * @file      AlertModal.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./Dialog.js";
import { Button } from "./Button.js";
import { StyleSheet } from "react-native";

/** {@inheritDoc AlertModel} */
export interface AlertModalProps
{
    readonly Title: string;
    readonly Primary: string;
    readonly Secondary: string;
    readonly OnTrigger?: () => void | Promise<void>;
}

export/**
       * A `Dialog.Content` preset for "are you sure?" confirmations — use inside a `<Dialog>`.
       *
       * @category Component
       * @since 1.0.0
       */
const AlertModal = ({ Title, Primary, Secondary, OnTrigger }: AlertModalProps): React.JSX.Element =>
{
    const [ Loading, SetLoading ] = React.useState(false);

    const Trigger = React.useCallback(async () =>
    {
        SetLoading(true);

        try
        {
            await OnTrigger?.();
        }
        finally
        {
            SetLoading(false);
        }
    }, [ OnTrigger ]);

    return (
        <DialogContent
            HideClose
            Style={ Styles.Content }>
            <DialogHeader Style={ Styles.Header }>
                <DialogTitle Style={ Styles.Title }>{ Title }</DialogTitle>
            </DialogHeader>
            <DialogFooter Style={ Styles.Footer }>
                <Button
                    Appearance="Red"
                    Loading={ Loading }
                    OnPress={ Trigger }
                    Size="Small"
                    Style={ Styles.FullWidth }>
                    { Primary }
                </Button>
                <DialogClose
                    Size="Small"
                    Style={ Styles.FullWidth }>
                    { Secondary }
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
};

const Styles = StyleSheet.create({
    Content:
    {
        width: 300
    },
    Footer:
    {
        alignItems: "stretch",
        paddingVertical: 6
    },
    FullWidth:
    {
        width: "100%"
    },
    Header:
    {
        alignSelf: "flex-start"
    },
    Title:
    {
        textAlign: "left"
    }
});
