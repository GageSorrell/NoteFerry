/**
 * Shared "what happens next" choices used by both a destination's
 * post-creation behavior and the app's global launch behavior.
 *
 * @module @noteferry/domain/Behavior
 *
 * @file      Behavior.ts
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

import * as Id from "./Id.js";
import * as Schema from "effect/Schema";

export/**
       * Where the app lands after it launches: the home screen, or straight
       * into page creation for a chosen database. `CloseApp` is not a launch
       * option — a freshly launched app has nothing to close.
       *
       * @category Behavior
       * @since 1.0.0
       */
const LaunchBehavior = Schema.Union([
    Schema.Struct({ Type: Schema.tag("Home") }),
    Schema.Struct({
        DataSourceId: Id.NotionDataSourceId,
        Type: Schema.tag("SelectedDatabase")
    })
]);

/** {@inheritDoc LaunchBehavior} */
export type LaunchBehavior = Schema.Schema.Type<typeof LaunchBehavior>;

export/**
       * Where the app goes after a page is successfully created from a
       * destination. `CloseApp` is offered in the UI on Android only — iOS
       * does not allow an app to terminate itself.
       *
       * @category Behavior
       * @since 1.0.0
       */
const PostCreationBehavior = Schema.Union([
    Schema.Struct({ Type: Schema.tag("Home") }),
    Schema.Struct({
        DataSourceId: Id.NotionDataSourceId,
        Type: Schema.tag("SelectedDatabase")
    }),
    Schema.Struct({ Type: Schema.tag("CloseApp") })
]);

/** {@inheritDoc PostCreationBehavior} */
export type PostCreationBehavior = Schema.Schema.Type<typeof PostCreationBehavior>;
