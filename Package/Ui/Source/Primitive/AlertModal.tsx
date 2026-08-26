/**
 * A small confirmation dialog (title + primary/secondary buttons), composed on top
 * of `Dialog` (as opposed to `Modal`).  This renders as a `DialogContent`, so it is
 * meant to be used as a `Dialog`'s child, not mounted as a standalone component.
 *
 * @module @noteferry/ui/Primitive/AlertModal
 *
 * @file      AlertModal.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as React from "react";
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./Dialog.js";
import { MakeStyles, TextStyle, ViewStyle } from "../MakeStyles.js";
import { Button } from "./Button.js";

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
    const Styles = useStyles();
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

const useStyles = MakeStyles({
    Content: ViewStyle({
        width: 300
    }),
    Footer: ViewStyle({
        alignItems: "stretch",
        paddingVertical: 6
    }),
    FullWidth: ViewStyle({
        width: "100%"
    }),
    Header: ViewStyle({
        alignSelf: "flex-start"
    }),
    Title: TextStyle({
        textAlign: "left"
    })
});
