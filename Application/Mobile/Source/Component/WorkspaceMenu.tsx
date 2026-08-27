/**
 * The workspace switcher anchored to the home screen's avatar: lists the
 * user's other connected workspaces (or, when every workspace's databases
 * are shown together, a single link to the Workspaces setting), followed by
 * "Add workspace" and "Log out".
 *
 * @module noteferry/Component/WorkspaceMenu
 *
 * @file      WorkspaceMenu.tsx
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import type * as Domain from "@noteferry/domain";
import * as React from "react";
import Building2 from "lucide-react-native/icons/building-2";
import LogOut from "lucide-react-native/icons/log-out";
import Plus from "lucide-react-native/icons/plus";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@noteferry/ui/Primitive/DropdownMenu";
import { Pressable } from "@noteferry/ui/Primitive/Pressable";
import { Alert } from "react-native";
import type { Thunk } from "@sorrell/effect/Function";
import { useTheme } from "@noteferry/ui/Core";
import { useTranslation } from "react-i18next";

/** {@inheritDoc WorkspaceMenu} */
export interface WorkspaceMenuProps extends React.PropsWithChildren
{
    readonly Connections: ReadonlyArray<Domain.NotionConnection.NotionConnection>;
    readonly CurrentConnectionId: Domain.Id.NotionConnectionId | undefined;
    readonly ShowAllWorkspaceDatabases: boolean;
    readonly OnAddWorkspace: Thunk;
    readonly OnLogOut: Thunk;
    readonly OnOpenWorkspaceSettings: Thunk;
    readonly OnSelectWorkspace: (ConnectionId: Domain.Id.NotionConnectionId) => void;
}

export/**
       * Wraps `children` (the home screen's avatar) with a dropdown that
       * switches or adds a Notion workspace, or signs the user out.
       *
       * @category Component
       * @since 1.0.0
       */
const WorkspaceMenu = ({
    Connections,
    CurrentConnectionId,
    ShowAllWorkspaceDatabases,
    OnAddWorkspace,
    OnLogOut,
    OnOpenWorkspaceSettings,
    OnSelectWorkspace,
    children
}: WorkspaceMenuProps): React.JSX.Element =>
{
    "use no memo";

    const Theme = useTheme();
    const { t } = useTranslation("component");
    const OtherWorkspaces = ShowAllWorkspaceDatabases
        ? [ ]
        : [ ...Connections ]
            .filter((Connection: Domain.NotionConnection.NotionConnection) =>
                Connection.Id !== CurrentConnectionId)
            .sort((
                Left: Domain.NotionConnection.NotionConnection,
                Right: Domain.NotionConnection.NotionConnection
            ) => Left.WorkspaceName.localeCompare(Right.WorkspaceName, undefined, {
                sensitivity: "base"
            }));

    const HandleLogOut = (): void =>
    {
        Alert.alert(
            t("workspaceMenu.logOutConfirm.title"),
            t("workspaceMenu.logOutConfirm.message"),
            [
                { style: "cancel", text: t("workspaceMenu.logOutConfirm.cancel") },
                { onPress: OnLogOut, style: "destructive", text: t("workspaceMenu.logOutConfirm.confirm") }
            ]
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger AsChild>
                <Pressable Accessibility={ { Label: t("workspaceMenu.accessibilityLabel"), Role: "button" } }>
                    { children }
                </Pressable>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                MatchTriggerWidth={ false }
                Style={ { minWidth: 220 } }>
                { ShowAllWorkspaceDatabases
                    ? (
                        <DropdownMenuItem
                            Icon={
                                <Building2
                                    color={ Theme.Semantic.IconSecondary }
                                    size={ 18 }
                                    strokeWidth={ 1.8 }
                                />
                            }
                            Label={ t("workspaceMenu.workspaces") }
                            OnSelect={ OnOpenWorkspaceSettings }
                        />
                    )
                    : OtherWorkspaces.map((Connection: Domain.NotionConnection.NotionConnection) => (
                        <DropdownMenuItem
                            Label={ Connection.WorkspaceName }
                            OnSelect={ () => OnSelectWorkspace(Connection.Id) }
                            key={ Connection.Id }
                        />
                    )) }
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    Icon={
                        <Plus
                            color={ Theme.Semantic.IconSecondary }
                            size={ 18 }
                            strokeWidth={ 1.8 }
                        />
                    }
                    Label={ t("workspaceMenu.addWorkspace") }
                    OnSelect={ OnAddWorkspace }
                />
                <DropdownMenuItem
                    Icon={
                        <LogOut
                            color={ Theme.Semantic.IconSecondary }
                            size={ 18 }
                            strokeWidth={ 1.8 }
                        />
                    }
                    Label={ t("workspaceMenu.logOut") }
                    OnSelect={ HandleLogOut }
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

WorkspaceMenu.displayName = "WorkspaceMenu";
