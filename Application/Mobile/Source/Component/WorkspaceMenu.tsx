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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    Pressable
} from "@noteferry/ui/Primitive";
import { Building2, LogOut, Plus } from "lucide-react-native";
import { Alert } from "react-native";
import type { Thunk } from "@sorrell/effect/Function";
import { useTheme } from "@noteferry/ui";

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
            "Log out?",
            "You'll need to sign back in with Notion to use NoteFerry again.",
            [
                { style: "cancel", text: "Cancel" },
                { onPress: OnLogOut, style: "destructive", text: "Log out" }
            ]
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger AsChild>
                <Pressable Accessibility={ { Label: "Switch workspace", Role: "button" } }>
                    { children }
                </Pressable>
            </DropdownMenuTrigger>
            <DropdownMenuContent MatchTriggerWidth={ false } Style={ { minWidth: 220 } }>
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
                            Label="Workspaces"
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
                    Label="Add workspace"
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
                    Label="Log out"
                    OnSelect={ HandleLogOut }
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

WorkspaceMenu.displayName = "WorkspaceMenu";
