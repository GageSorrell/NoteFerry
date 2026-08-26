I would architect NoteFerry as a **three-tier system with a shared Effect domain layer**:

```text
┌─────────────────────────────────────────────┐
│ Expo / React Native                         │
│                                             │
│ UI → Application services → Repositories    │
│                  │                          │
│        Effect Schema domain model           │
│                  │                          │
│    ┌─────────────┴──────────────┐           │
│    │                            │           │
│ Supabase Auth            NoteFerry HTTP API   │
│ directly                 typed by Effect    │
└────┬────────────────────────────┬────────────┘
     │                            │
     │ JWT                        │ JWT
     │                            │
     ▼                            ▼
┌─────────────┐      ┌────────────────────────┐
│ Supabase    │      │ Supabase Edge Function │
│ Auth        │      │                        │
└─────────────┘      │ Effect HttpApi          │
                     │ Application services    │
                     │ Repositories            │
                     │ Notion service          │
                     └──────┬──────────┬────────┘
                            │          │
                            ▼          ▼
                       PostgreSQL    Notion API
                            │
                       private secrets
```

The most important boundary is this:

> **The Expo app should know that a user has a Notion connection, but it should never possess the Notion OAuth access token, refresh token, Notion client secret, or Supabase server/secret key.**

That immediately determines quite a lot of the rest of the architecture.

Effect is particularly well suited here because you have multiple boundaries containing untrusted data: React forms, local persistence, your HTTP API, Postgres rows, Supabase Auth responses, and the Notion API. Effect v4's `Schema` explicitly models both a decoded application type and its encoded representation, so you can use the same schema for validation, serialization and boundary transformations. ([Effect][1])

One caveat: Effect v4 is still explicitly documented as work-in-progress, and modules such as HTTP API and SQL are currently under `effect/unstable/...`. I would absolutely use it if you're comfortable tracking v4, but isolate those unstable APIs behind a few packages and **pin the exact Effect version** rather than letting a caret update change the architecture underneath you. ([Effect][2])

---

# 1. Give each system one source of truth

I would resist the temptation to make Effect Schema the literal source of truth for *everything*. It should be the source of truth for your **TypeScript/domain/wire model**, but the physical systems should retain their own native sources of truth.

| Concern                               | Source of truth                               |
| ------------------------------------- | --------------------------------------------- |
| NoteFerry domain types                  | Effect `Schema`                               |
| HTTP request/response contracts       | Effect `Schema` / `HttpApi`                   |
| Runtime validation                    | Effect `Schema`                               |
| Error model                           | `Schema.TaggedErrorClass`                     |
| PostgreSQL physical schema            | Supabase SQL migrations                       |
| RLS/security                          | PostgreSQL policies                           |
| Notion database/data-source structure | Notion itself                                 |
| Authentication identity               | Supabase Auth                                 |
| Notion authorization                  | Stored server-side Notion OAuth installation  |
| Local pending/draft state             | Expo SQLite/local storage                     |
| Secrets on device                     | SecureStore                                   |
| Server secrets                        | Supabase secrets / private DB storage / Vault |

This avoids a common failure mode where you try to generate a Postgres database automatically from TypeScript schemas and discover that the generator has no good model for foreign keys, indexes, partial indexes, RLS, triggers, check constraints, views, extensions, authorization semantics, migration ordering, etc.

Effect v4 does have schema-aware SQL facilities such as `SqlSchema`, `SqlModel`, and repositories, which are useful for decoding rows and encoding query parameters. I would use those where they fit, but keep **Supabase SQL migrations as the canonical DDL**. ([Effect][3])

---

# 2. Monorepo layout

Conceptually, I would use something close to:

```text
noteferry/
├─ apps/
│  └─ mobile/
│     ├─ app/                     # Expo Router routes
│     └─ src/
│        ├─ components/
│        ├─ features/
│        ├─ runtime/
│        └─ providers/
│
├─ packages/
│  ├─ domain/
│  │  └─ src/
│  │     ├─ User.ts
│  │     ├─ NotionConnection.ts
│  │     ├─ DataSource.ts
│  │     ├─ Destination.ts
│  │     ├─ PageDraft.ts
│  │     ├─ Property.ts
│  │     ├─ Id.ts
│  │     └─ Error.ts
│  │
│  ├─ api/
│  │  └─ src/
│  │     ├─ Api.ts
│  │     ├─ ConnectionsApi.ts
│  │     ├─ DataSourcesApi.ts
│  │     └─ PagesApi.ts
│  │
│  ├─ application/
│  │  └─ src/
│  │     ├─ ConnectionService.ts
│  │     ├─ DestinationService.ts
│  │     └─ PageCreationService.ts
│  │
│  ├─ notion/
│  │  └─ src/
│  │     ├─ Notion.ts
│  │     ├─ NotionSchema.ts
│  │     ├─ NotionError.ts
│  │     └─ NotionMapper.ts
│  │
│  ├─ mobile-runtime/
│  │  └─ src/
│  │     ├─ SecureStorage.ts
│  │     ├─ LocalDatabase.ts
│  │     ├─ Session.ts
│  │     └─ NoteFerryApiClient.ts
│  │
│  └─ ui/
│
├─ supabase/
│  ├─ migrations/
│  ├─ seed.sql
│  ├─ config.toml
│  └─ functions/
│     ├─ _shared/
│     │  ├─ Runtime.ts
│     │  ├─ Database.ts
│     │  ├─ Authentication.ts
│     │  └─ Notion.ts
│     ├─ api/
│     │  ├─ index.ts
│     │  └─ deno.json
│     ├─ notion-oauth-callback/
│     │  ├─ index.ts
│     │  └─ deno.json
│     └─ notion-webhook/
│        ├─ index.ts
│        └─ deno.json
│
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.json
```

The important separation is more important than those exact names.

`domain` should contain almost no infrastructure. It should be portable TypeScript plus Effect. `api` contains the shared HTTP contract. `application` contains use cases. `notion` defines the Notion-facing abstraction and mappings. `mobile-runtime` contains native implementations.

Supabase recommends reusable Edge Function code in `functions/_shared`, and currently recommends a function-specific `deno.json` for dependency isolation. Edge Functions run in Supabase's Deno-compatible runtime and can import npm packages. ([Supabase][4])

I would therefore keep the **server implementations** under `supabase/functions/_shared`, but keep your portable domain/contracts outside of Supabase. Your deployment pipeline should explicitly verify that your shared workspace packages bundle correctly into the Edge Functions. If Supabase's bundling ever makes arbitrary workspace packages painful, package the portable contracts as an internal npm package rather than duplicating them.

---

# 3. Make Effect Schema the language of the application

Your domain package is where I would lean hardest into Schema.

For example, don't represent every ID as `string`:

```ts
import { Schema } from "effect";

export const UserId = Schema.String.pipe(
    Schema.brand("UserId"),
);

export const NotionConnectionId = Schema.String.pipe(
    Schema.brand("NotionConnectionId"),
);

export const NotionWorkspaceId = Schema.String.pipe(
    Schema.brand("NotionWorkspaceId"),
);

export const NotionDataSourceId = Schema.String.pipe(
    Schema.brand("NotionDataSourceId"),
);

export const NotionPageId = Schema.String.pipe(
    Schema.brand("NotionPageId"),
);

export const NotionPropertyId = Schema.String.pipe(
    Schema.brand("NotionPropertyId"),
);
```

This matters more here than in many applications because otherwise there are dozens of semantically unrelated UUID-shaped strings floating around.

Then use tagged unions for Notion properties.

Conceptually:

```ts
export const PropertyDefinition = Schema.Union([
    TitlePropertyDefinition,
    RichTextPropertyDefinition,
    NumberPropertyDefinition,
    CheckboxPropertyDefinition,
    DatePropertyDefinition,
    SelectPropertyDefinition,
    MultiSelectPropertyDefinition,
    StatusPropertyDefinition,
    RelationPropertyDefinition,
    PeoplePropertyDefinition,
    UrlPropertyDefinition,
    EmailPropertyDefinition,
    PhoneNumberPropertyDefinition,
    FilesPropertyDefinition,
]);
```

And separately:

```ts
export const PropertyInput = Schema.Union([
    TitlePropertyInput,
    RichTextPropertyInput,
    NumberPropertyInput,
    CheckboxPropertyInput,
    DatePropertyInput,
    SelectPropertyInput,
    MultiSelectPropertyInput,
    StatusPropertyInput,
    RelationPropertyInput,
    PeoplePropertyInput,
    UrlPropertyInput,
    EmailPropertyInput,
    PhoneNumberPropertyInput,
]);
```

That distinction is valuable:

**property definition** = “what this Notion property is”

**property input** = “what the user wants to put into it”

**Notion API property value** = provider-specific JSON required by Notion.

Don't use one giant Notion-shaped type for all three.

Your mapping becomes:

```text
Notion API DataSource
        │
        ▼ decode
NotionExternalDataSource
        │
        ▼ normalize
NoteFerry DataSourceSchema
        │
        ▼ drives UI
PropertyInput[]
        │
        ▼ validate
CreatePageCommand
        │
        ▼ map
NotionCreatePageRequest
```

That gives you a clean anti-corruption layer around Notion.

Notion now explicitly says that pages belong to **data sources**, and page properties must conform to the parent data source's property schema. Creating a page under one now uses `parent.data_source_id`. ([Notion Docs][5])

---

# 4. Don't leak `@notionhq/client` types throughout the app

This is one of the architectural choices I would feel strongest about.

Do not have components consuming things like:

```ts
GetDataSourceResponse
CreatePageParameters
PageObjectResponse
```

directly.

Keep Notion's model inside `packages/notion`.

Your UI should receive something like:

```ts
DataSourceSchema
Destination
PropertyDefinition
PropertyInput
```

The server-side Notion adapter then translates those into the exact current Notion API format.

That protects the rest of NoteFerry from changes like the fairly significant 2025 Notion API split between databases and data sources. The old database-query endpoint is now deprecated; the current API version is `2026-03-11`, and querying table contents is done through `/data_sources/{data_source_id}/query`. ([Notion Docs][6])

This adapter is also the right place to handle weird provider-specific cases such as a relation target not being shared with the Notion connection. Notion notes that related database schemas may not be returned unless that related database is also shared. ([Notion Docs][7])

---

# 5. Supabase Auth should identify the NoteFerry user

I would not use the Notion OAuth installation itself as your NoteFerry account.

Instead:

```text
Supabase user
     │
     ├── Notion connection A → Personal workspace
     │
     ├── Notion connection B → Work workspace
     │
     └── Notion connection C → Another Notion user/workspace
```

Supabase Auth answers:

> “Who is this NoteFerry user?”

Notion OAuth answers:

> “Which Notion resources has this user authorized NoteFerry to operate on?”

Those are fundamentally different concepts.

This also lets a user disconnect Notion without deleting their NoteFerry account, connect multiple workspaces, switch Notion accounts, retain subscription/configuration data, or later use NoteFerry without Notion for some feature.

Supabase Auth stores users in its protected `auth` schema and issues JWTs that integrate with RLS. ([Supabase][8])

---

# 6. The Expo app can talk directly to Supabase Auth

This is one place where I would **not** unnecessarily wrap everything through your backend.

The Expo app can contain:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Those are designed to be present in public clients, provided your actual data access is protected by RLS. Server/secret/service-role credentials absolutely must not be present. ([Supabase][9])

For the Supabase session, use the current documented React Native/Expo storage arrangement and favor SecureStore for sensitive native session material. Expo explicitly distinguishes SecureStore from AsyncStorage and recommends it for things such as tokens and keys. ([Expo Documentation][10])

But do not use SecureStore as a general database. It's for small secrets.

---

# 7. Notion OAuth should go through the backend

The flow I recommend is:

```text
Expo
 │
 │ POST /notion/connections/start
 │ Supabase JWT
 ▼
NoteFerry API
 │
 │ Create one-time OAuth state
 │
 │ Return Notion authorization URL
 ▼
Expo opens browser
 │
 ▼
Notion authorization screen
 │
 │ user selects pages/databases
 ▼
HTTPS callback:
notion-oauth-callback Edge Function
 │
 │ verify one-time state
 │ exchange code + client secret
 ▼
Notion OAuth token endpoint
 │
 │ access_token
 │ refresh_token
 │ bot_id
 │ workspace_id
 │ owner
 │ workspace_name
 ▼
Supabase private storage
 │
 ▼
HTTP redirect to
noteferry://notion/connected
```

The critical part is that **Notion redirects to your server first, not directly to a piece of client code that exchanges the authorization code**.

Notion's token exchange uses the public connection's `CLIENT_ID:CLIENT_SECRET` via HTTP Basic authentication. That client secret cannot safely exist in a distributed mobile binary. ([Notion Docs][11])

This matches Expo's general OAuth guidance as well: if an authorization-code flow requires a client secret, exchange the code server-side because client application code is not a secure place to hold the secret. ([Expo Documentation][10])

Your server callback should then redirect back into the Expo app using a NoteFerry custom scheme/universal link.

---

# 8. Store Notion connections, not merely “the Notion token”

The current Notion OAuth response gives you substantially more than an access token:

```text
access_token
refresh_token
bot_id
workspace_id
workspace_name
workspace_icon
owner
duplicated_template_id
```

Notion explicitly recommends storing the full authorization information and calls out `bot_id` as an identifier that should be retained. It also now issues a refresh token, and refreshing produces a new token pair. ([Notion Docs][12])

I would represent this as two pieces.

### User-visible metadata

Something like:

```text
app.notion_connections
─────────────────────────────────────
id
user_id
bot_id
workspace_id
workspace_name
workspace_icon_url
notion_owner_user_id
connected_at
last_used_at
status
revoked_at
```

The Expo client can read these rows.

### Private credentials

Something like:

```text
private.notion_connection_credentials
─────────────────────────────────────
connection_id
access_token
refresh_token
updated_at
```

The Expo client should have **zero access** to this table.

For additional hardening you can put the token values into Supabase Vault and store their Vault IDs instead:

```text
private.notion_connection_credentials
─────────────────────────────────────
connection_id
access_token_secret_id
refresh_token_secret_id
```

Supabase currently recommends Vault rather than `pgsodium` for database-managed secrets; `pgsodium` is pending deprecation. Vault encrypts secrets on disk and in backups/replication. ([Supabase][13])

I wouldn't make Vault integration block your MVP, though. A non-exposed private schema plus Supabase's normal encryption at rest is already a reasonable architecture. Vault is the stronger version.

---

# 9. Use separate public/app and private schemas

Rather than putting everything casually into `public`, I would probably use:

```text
app.*
private.*
auth.*       # Supabase-owned
vault.*      # Supabase-owned if used
```

Expose `app` to the Data API if you want direct client access.

Do **not** expose `private`.

Supabase supports custom exposed schemas, while private schemas can remain outside the Data API entirely. ([Supabase][14])

There is also a very current Supabase change worth knowing: new tables are no longer necessarily automatically exposed to the Data/GraphQL APIs. That behavior changed for new projects beginning May 30, 2026 and is scheduled to become universal later in 2026. So explicitly manage Data API exposure and grants rather than relying on old Supabase defaults. ([Supabase][15])

---

# 10. Suggested database model

I would start approximately here:

| Table                                   | Purpose                                                         |
| --------------------------------------- | --------------------------------------------------------------- |
| `app.profiles`                          | NoteFerry-specific user information not belonging in `auth.users` |
| `app.notion_connections`                | Non-secret metadata about each authorized Notion connection     |
| `private.notion_connection_credentials` | Access/refresh credentials                                      |
| `private.notion_oauth_states`           | Short-lived OAuth state/CSRF records                            |
| `app.data_sources`                      | Cached Notion data-source metadata                              |
| `app.destinations`                      | User-configured NoteFerry destinations/forms                      |
| `app.operations`                        | Page-creation attempts/history/idempotency metadata             |
| `app.user_preferences`                  | Cross-device NoteFerry preferences                                |
| `app.devices`                           | Only if you later need device-specific/push data                |

I would **not** replicate all of the user's Notion pages into Supabase.

Notion should remain authoritative for:

```text
actual page contents
actual page properties
actual data-source schema
relations
people
Notion-generated fields
templates
```

Supabase should primarily contain:

```text
authorization
NoteFerry configuration
cached metadata
user preferences
operational state
history/audit information that NoteFerry actually needs
```

That keeps your liability, synchronization complexity and storage usage dramatically smaller.

---

# 11. Cache Notion data-source schemas

One thing I *would* store from Notion is enough data-source metadata to render NoteFerry quickly.

For example:

```text
app.data_sources
────────────────────────────────────
connection_id
notion_data_source_id
notion_database_id
title
icon
property_schema jsonb
schema_hash
notion_last_edited_time
refreshed_at
```

The canonical source is still Notion.

But the cached version means opening your quick-add interface doesn't require:

```text
launch app
→ backend
→ Notion
→ retrieve data source
→ decode
→ build form
```

every single time.

Instead:

```text
launch app
→ render cached schema immediately
→ refresh in background when stale
```

The `property_schema` JSON should not simply be an opaque dump of Notion's response. I'd store your **normalized NoteFerry schema**.

That means when Notion changes its API representation, you update one mapper.

---

# 12. Keep the normalized schema versioned

For example:

```ts
export const CachedDataSourceSchema = Schema.Struct({
    Version: Schema.Literal(1),
    DataSourceId: NotionDataSourceId,
    Properties: Schema.Array(PropertyDefinition),
});
```

Then later:

```text
Version 1 → Version 2
```

can be handled explicitly.

This is an ideal use of Effect Schema transformations.

It also makes local Expo caches much safer. Every persisted blob should be considered `unknown` after an app update and decoded through Schema before use.

---

# 13. Use Effect Schema at every boundary

The useful rule is:

> **Inside the program, trust types. At every boundary, trust nothing.**

So decode:

```text
HTTP request body
Supabase row
Notion response
SecureStore value
SQLite row
deep-link parameters
environment/configuration values
```

And encode:

```text
HTTP responses
database JSON
local persisted data
Notion request bodies
```

Effect Schema's decoded/encoded distinction is particularly nice for values such as:

```text
Date              ↔ ISO-8601 string
branded ID        ↔ string
Set<OptionId>     ↔ string[]
domain class      ↔ JSON object
```

Effect v4 also derives JSON Schema from schemas, so the same contracts can eventually power API docs or even tooling around your forms. ([Effect][16])

---

# 14. Use `Schema.TaggedErrorClass` aggressively

Don't let raw exceptions from Supabase, `fetch`, Deno, or Notion flow through the application.

I would have things like:

```text
AuthenticationRequired
NotionConnectionNotFound
NotionConnectionRevoked
NotionResourceNotShared
NotionUnauthorized
NotionRateLimited
NotionValidationError
NotionUnavailable
DataSourceNotFound
DataSourceSchemaChanged
InvalidPageDraft
DatabaseError
NetworkError
```

and define them as schema-backed tagged errors.

Your Notion adapter translates:

```text
HTTP 401
```

into:

```text
NotionUnauthorized
```

and:

```text
HTTP 429
```

into:

```text
NotionRateLimited
```

while preserving useful provider metadata internally.

Your UI therefore never needs logic like:

```ts
if (Error.status === 429)
```

It handles:

```ts
Effect.catchTag("NotionRateLimited", ...)
```

Effect v4 specifically promotes schema-defined tagged errors for this style of typed error channel. ([Effect][2])

---

# 15. Model infrastructure as Effect services

Your application code should depend on interfaces such as:

```text
Notion
NotionConnectionRepository
DestinationRepository
DataSourceRepository
OperationRepository
CurrentUser
SecureStorage
LocalDatabase
NoteFerryApi
Clock
IdGenerator
```

rather than concrete clients.

For example:

```text
PageCreationService
    requires
        Notion
        DestinationRepository
        OperationRepository
        CurrentUser
```

The production server layer supplies:

```text
NotionLive
PostgresDestinationRepository
PostgresOperationRepository
SupabaseCurrentUser
```

Tests can supply:

```text
NotionTest
InMemoryDestinationRepository
InMemoryOperationRepository
TestCurrentUser
```

That's exactly the seam-oriented use of Effect Services/Layers that v4 encourages. ([Effect][17])

---

# 16. I would use Effect `HttpApi` for your backend contract

For NoteFerry specifically, I think Effect's typed HTTP API fits very well.

Define something conceptually like:

```text
NoteFerryApi
│
├─ Connections
│  ├─ GET    /
│  ├─ POST   /notion/start
│  └─ DELETE /:connectionId
│
├─ DataSources
│  ├─ GET    /
│  ├─ POST   /refresh
│  └─ GET    /:dataSourceId
│
├─ Destinations
│  ├─ GET    /
│  ├─ POST   /
│  ├─ PATCH  /:destinationId
│  └─ DELETE /:destinationId
│
└─ Pages
   └─ POST   /
```

Every request, success and typed error can be defined using the same schemas used by the rest of the application.

Effect can then derive a typed HTTP client from the same `HttpApi`, and the current v4 HTTP stack explicitly supports creating a Fetch-compatible:

```ts
(request: Request) => Promise<Response>
```

handler for serverless/edge environments. That maps conceptually very well onto Supabase Edge Functions. ([Effect][18])

That means you don't need:

```text
frontend request type
backend request type
frontend response type
backend response type
Zod schema
API documentation schema
```

all defined independently.

---

# 17. But split authenticated and unauthenticated Edge Functions

I would probably deploy:

```text
api
notion-oauth-callback
notion-webhook
```

rather than putting literally everything into one Edge Function.

`api` should require a valid Supabase user.

`notion-oauth-callback` must accept a browser redirect coming from Notion, so it cannot rely on a Supabase JWT. Its authorization mechanism is the short-lived OAuth `state`.

`notion-webhook`, if you use Notion webhooks, would similarly authenticate the webhook itself rather than a Supabase user.

Supabase's current Edge Functions stack supports authenticated user functions and server-side access to Supabase services, and the platform can validate caller JWTs before your handler runs. ([Supabase][19])

Keeping the unauthenticated ingress points physically separate reduces the chance of accidentally making your whole application API public.

---

# 18. RLS should still protect all app-visible tables

Even if you have an API server, don't throw away Supabase's defense in depth.

For user-owned rows:

```sql
user_id = (select auth.uid())
```

should be the basic ownership model.

For example:

```sql
create policy "Users can read their destinations"
on app.destinations
for select
to authenticated
using ((select auth.uid()) = user_id);
```

And put an index on `user_id`.

Supabase explicitly recommends both indexing columns used by RLS policies and wrapping `auth.uid()` in `select` for better policy performance. ([Supabase][20])

For an update, use both ownership checks:

```sql
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id)
```

and remember that PostgreSQL requires a corresponding select policy for updates. ([Supabase][20])

Also don't use user-editable `user_metadata` for authorization. Supabase specifically warns against it; use database ownership or trusted `app_metadata`. ([Supabase][20])

---

# 19. What the Expo app should store

I would divide client state into four categories.

| Data                                    | Storage                             |
| --------------------------------------- | ----------------------------------- |
| React/UI transient state                | memory                              |
| Supabase session secrets                | SecureStore-compatible auth storage |
| cached destinations/data-source schemas | SQLite                              |
| unfinished page drafts                  | SQLite                              |
| pending offline operations              | SQLite                              |
| purely device-specific UI settings      | SQLite/AsyncStorage                 |
| cross-device preferences                | Supabase                            |
| Notion OAuth access token               | **never**                           |
| Notion refresh token                    | **never**                           |
| Supabase server key                     | **never**                           |
| Notion client secret                    | **never**                           |

SQLite makes more sense than SecureStore for your cache and drafts. SecureStore is intended for small secrets and can reject large payloads on some platforms. ([Expo Documentation][21])

I would wrap local storage in an Effect service as well:

```text
LocalDatabase
├─ GetDestinationCache
├─ SaveDestinationCache
├─ GetDraft
├─ SaveDraft
├─ EnqueueOperation
└─ RemoveOperation
```

The rest of the mobile application doesn't need to know whether that's Expo SQLite today or something else later.

---

# 20. Offline operation support is worth designing now

For a quick-entry mobile application, unreliable connectivity is one of the few cases where I'd intentionally add a little architecture early.

Have the client create:

```text
OperationId
```

before sending a page creation.

Locally:

```text
Operation
────────────────
id
destination_id
payload
created_at
state = pending
```

The request might look conceptually like:

```text
CreatePageCommand
───────────────────────────
operationId
destinationId
properties
template?
```

The backend records the operation before making the Notion request.

Once successful:

```text
state = succeeded
notion_page_id = ...
```

This gives you replay detection, useful telemetry and a good UI model.

One caution is important: Notion's documented Create Page API does not expose an application idempotency-key parameter, so you cannot promise true exactly-once behavior across a crash occurring after Notion creates the page but before your server records success. ([Notion Docs][22])

Because of that, **do not blindly retry an ambiguous timed-out Create Page request**. Retry known pre-request failures and rate limits safely; treat ambiguous POST outcomes specially.

---

# 21. Don't have the frontend construct raw Notion JSON

This is another boundary I would keep strict.

The Expo app should submit:

```text
{
    destinationId,
    properties: [
        {
            propertyId,
            value
        }
    ]
}
```

or an equivalent strongly typed model.

It should **not** submit:

```text
{
    parent: {
        data_source_id: "..."
    },
    properties: {
        "My property": {
            rich_text: [...]
        }
    }
}
```

The first is a **NoteFerry command**.

The second is a **Notion API request**.

Only the backend should construct the latter.

This means that if Notion changes the API representation, you change the backend adapter without shipping a new mobile build.

---

# 22. Prefer property IDs internally rather than names

When NoteFerry stores a configuration like:

```text
"Due Date"
```

that's fragile because the user can rename it.

Notion property IDs exist specifically as stable resource identifiers.

So your normalized representation should usually look more like:

```text
PropertyDefinition
─────────────────────
id
name
type
configuration
```

and a destination's configuration should refer to:

```text
property_id
```

rather than property name.

The name is presentation.

The ID is identity.

Notion's current query APIs accept property IDs as well as names for various property-related parameters, and retrieving a data source provides its property schema. ([Notion Docs][6])

---

# 23. Let the current Notion schema drive your form

When a destination opens:

```text
Destination
    │
    ▼
Cached DataSourceSchema
    │
    ├─ title       → text input
    ├─ rich_text   → text input
    ├─ number      → numeric input
    ├─ checkbox    → switch
    ├─ select      → select picker
    ├─ multi_select→ multi picker
    ├─ status      → status picker
    ├─ date        → date/time picker
    ├─ relation    → searchable page picker
    ├─ people      → person picker
    └─ url/email…  → specialized text inputs
```

You can then layer NoteFerry-specific configuration on top:

```text
visible?
required by NoteFerry?
order
default value
quick value
placeholder
remember previous value?
```

Do not modify the Notion schema itself to represent those.

Store that configuration in `app.destinations`.

---

# 24. `Destination` should be a first-class domain concept

I would distinguish:

```text
NotionConnection
DataSource
Destination
```

A connection answers:

> Which Notion authorization do I use?

A data source answers:

> Which Notion table/schema is this?

A destination answers:

> How has this NoteFerry user configured a quick-entry experience for this data source?

So:

```text
Destination
──────────────────────────
id
userId
connectionId
dataSourceId
name
icon
position
template
fieldConfiguration
defaults
createdAt
updatedAt
```

This avoids turning NoteFerry itself into just a thin browser over Notion databases.

---

# 25. Store destination configuration as a mix of relational columns and JSONB

I wouldn't either fully normalize it or dump everything into JSON.

Use normal columns for things you query or constrain:

```text
id
user_id
connection_id
data_source_id
name
position
enabled
created_at
updated_at
```

Use a schema-versioned JSONB object for flexible UI configuration:

```text
configuration
```

containing things like:

```text
field order
hidden fields
defaults
presentation preferences
template choice
```

Then decode that JSONB using Effect Schema every time it enters application code.

This is a perfect example of a place where `jsonb` + Effect Schema is better than designing fifteen tiny SQL tables.

---

# 26. Notion schema refresh should be explicit and opportunistic

I'd use roughly:

```text
cached schema fresh
        │
        └── render immediately

cached schema somewhat stale
        │
        ├── render immediately
        └── refresh asynchronously

no cache
        │
        └── fetch before rendering

Notion says schema invalid
        │
        ├── fetch new schema
        └── reconcile destination configuration
```

If a user deletes or changes a property, your normalized schema changes.

When refreshing, reconcile stored destination configuration by **property ID**.

For example:

```text
property still exists + same compatible type
    → retain setting

property exists + incompatible type
    → clear incompatible default

property deleted
    → remove from active configuration

new property
    → add with default visibility behavior
```

This makes schema drift a normal expected condition instead of an exception.

---

# 27. Relation queries belong on the server

For a relation picker:

```text
Expo search text
       │
       ▼
NoteFerry API
       │
       ▼
Notion service
       │
       ▼
Query related data source
```

Do not give the Expo app credentials and let it query arbitrary related Notion resources.

The backend already knows:

```text
current NoteFerry user
connection
target data source
relation property
related data source
Notion authorization
```

and can enforce all of those constraints.

Notion's current data-source query endpoint also provides `filter_properties`, which can significantly reduce response size for data sources containing lots of properties. That's useful for relation search where you might only need title + a tiny amount of identifying metadata. ([Notion Docs][6])

---

# 28. Notion templates now fit naturally into this design

Current Notion Create Page supports:

```text
no template
default data-source template
specific template_id
```

and supports a timezone when resolving variables such as `@now` and `@today`. ([Notion Docs][22])

So your destination could contain:

```text
Template =
    None
  | Default
  | TemplateId
```

as a tagged Effect Schema union.

Then the backend maps that into the appropriate Notion API representation.

That keeps template behavior out of the UI components.

---

# 29. Use Supabase directly only where it genuinely helps

I would use this hybrid rule:

```text
Expo → Supabase Auth
    YES

Expo → Supabase Data API for simple user-owned data
    MAYBE

Expo → Notion
    NO

Expo → private credentials
    NO

Expo → business operations
    NoteFerry Effect API
```

For example, a simple `user_preferences` read could reasonably go through `supabase-js` under RLS.

But I would send things like:

```text
connect Notion
refresh a data source
search relation values
create a page
disconnect Notion
```

through the NoteFerry server API.

Even if you allow direct Data API access, hide `supabase-js` behind an Effect repository:

```text
DestinationRepository
```

rather than sprinkling:

```ts
Supabase.from("destinations")
```

through React components.

Supabase itself explicitly supports both the two-tier model of direct client→Data API and the three-tier model with your own server. ([Supabase][23])

---

# 30. Database access inside Edge Functions

There are two sensible implementations.

For most queries, `supabase-js` is the easiest. Supabase's current recommendation for most Edge Function database access is its server-side Supabase client, including an RLS-scoped client and an admin client for privileged work. ([Supabase][24])

If you need:

```text
complex transactions
row locks
private-schema access
Vault access
advanced SQL
```

a direct Postgres client is reasonable. Supabase explicitly supports direct Postgres connections from Edge Functions; for serverless/edge traffic it recommends transaction-mode pooling. ([Supabase][24])

That is also where `@effect/sql-pg` becomes architecturally appealing, because the rest of your repository layer could depend upon Effect's `SqlClient`.

I would start with `supabase-js` unless you have an immediate transaction requirement, though. Don't introduce direct Postgres connections solely because Effect has a SQL package.

---

# 31. Treat token refresh as a server concern

Your `Notion` service should encapsulate:

```text
load credentials
→ make request
→ detect invalid/expired authorization
→ refresh if appropriate
→ atomically store replacement token pair
→ retry safe operation
```

The application layer should never do:

```text
refreshNotionToken()
```

directly.

It should merely call:

```text
Notion.CreatePage(...)
```

Notion now explicitly documents refresh-token rotation: refreshing generates a **new access token and new refresh token**, so you should replace the pair together rather than treating the refresh token as permanent. ([Notion Docs][25])

If two concurrent requests try to refresh one connection simultaneously, serialize that refresh around the connection row so one request cannot overwrite the other with an obsolete refresh token.

---

# 32. Make your `Notion` interface deliberately small

Don't reproduce the entire Notion SDK.

For the initial application, the service might only need:

```text
Notion
├─ SearchDataSources
├─ RetrieveDataSource
├─ QueryDataSource
├─ CreatePage
├─ ExchangeAuthorizationCode
├─ RefreshAuthorization
└─ RevokeAuthorization
```

That is enough of a seam.

The current Notion API has many more endpoints, but your domain layer should represent what **NoteFerry requires**, not everything Notion happens to offer.

---

# 33. Keep provider DTOs separate from API DTOs

I'd use four categories of Schema.

| Category        | Example                                           |
| --------------- | ------------------------------------------------- |
| Domain          | `Destination`, `PropertyDefinition`, `PageDraft`  |
| NoteFerry HTTP    | `CreatePageRequest`, `CreatePageResponse`         |
| Notion external | `NotionDataSourceResponse`, `NotionOAuthResponse` |
| Persistence     | `DestinationRow`, `ConnectionRow`                 |

They can reuse primitives and transformations.

But don't force them to be identical.

For example:

```text
Postgres
created_at timestamptz
        │
        ▼
Persistence schema
ISO string
        │
        ▼
Domain transformation
Date
```

while:

```text
HTTP response
Date
        │
        ▼
encoded Schema
ISO string
```

That is precisely the distinction Effect Schema's encoded and decoded representations are intended to handle. ([Effect][1])

---

# 34. React should sit at the outside edge of Effect

I wouldn't try to make every `useState` into an Effect concept.

A clean direction is:

```text
React component
     │
     ▼
hook/controller
     │
     ▼
Effect program
     │
     ▼
service
     │
     ▼
repository/API/storage
```

For example:

```text
<CreatePageScreen>
        │
        ▼
useCreatePage()
        │
        ▼
PageCreationService.Create()
        │
        ├─ LocalDatabase
        └─ NoteFerryApi
```

React remains React.

Effect owns:

```text
async work
resource management
retries
timeouts
validation
dependency injection
typed failure
concurrency
```

This tends to be much easier to maintain than attempting to make Effect itself your view-state framework.

---

# 35. My recommended final boundary

If I compress the entire architecture into one rule set, it becomes:

| Layer                    | Knows about                                    |
| ------------------------ | ---------------------------------------------- |
| React UI                 | Domain values and application operations       |
| Mobile application layer | Effect services                                |
| Mobile runtime           | Expo, SecureStore, SQLite, Supabase Auth, HTTP |
| Shared domain            | Effect, Schema, domain concepts                |
| Shared API               | Effect `HttpApi` + Schema                      |
| Backend application      | Domain services/use cases                      |
| Backend infrastructure   | Supabase, Postgres, Notion HTTP API            |
| PostgreSQL               | durable NoteFerry state                          |
| Notion                   | canonical Notion content/schema                |

Dependencies should point inward:

```text
Expo ────────────────┐
Supabase ────────────┤
Notion ──────────────┤
Postgres ────────────┤
                     ▼
                infrastructure
                     │
                     ▼
                application
                     │
                     ▼
                   domain
```

`domain` should never import Expo, Supabase or the Notion SDK.

That rule alone will prevent most of the architectural mess that otherwise develops.

---

# 36. What I would build first

If I were implementing this from a clean repository, I would do it in this order:

1. Create `@noteferry/domain` with branded IDs, `NotionConnection`, `DataSourceSchema`, property definition/input unions, `Destination`, `PageDraft`, and tagged errors. Then create `@noteferry/api` with an Effect `HttpApi` defining connections, data sources, destinations and page creation. Set up Supabase Auth in Expo with secure native session persistence. Create the `app` and `private` database schemas and SQL migrations, with RLS on everything client-readable. Implement `Notion` as a server-only Effect service. Build the Notion OAuth start/callback flow and persist connection metadata plus server-only credentials. Add data-source discovery and normalized schema caching. Implement destination configuration. Build schema-driven Expo form rendering. Implement page creation through the Effect API. Finally, add SQLite caching/offline drafts/pending operations and then webhooks/background synchronization if they actually become necessary.

That sequence gives you a usable vertical slice quite early without committing you to synchronization infrastructure before you need it.

The result is essentially **Effect at the center, Expo and Supabase/Notion at the edges**. `Schema` becomes the vocabulary with which those edges communicate, but you avoid trying to force Postgres or Notion themselves to become manifestations of an Effect schema. For this application, I think that is the sweet spot between “lean into Effect” and “don't fight the platforms you're integrating with.”

[1]: https://effect.plants.sh/schema/?utm_source=chatgpt.com "Schema | Effect"
[2]: https://effect.plants.sh/?utm_source=chatgpt.com "Effect v4 Documentation | Effect"
[3]: https://effect.plants.sh/sql/schema-queries/?utm_source=chatgpt.com "Schema-mapped queries and resolvers | Effect"
[4]: https://supabase.com/docs/guides/functions/dependencies?utm_source=chatgpt.com "Managing dependencies | Supabase Docs"
[5]: https://developers.notion.com/reference/data-source?utm_source=chatgpt.com "Data source - Notion Docs"
[6]: https://developers.notion.com/reference/query-a-data-source?utm_source=chatgpt.com "Query a data source - Notion Docs"
[7]: https://developers.notion.com/reference/retrieve-a-data-source?utm_source=chatgpt.com "Retrieve a data source - Notion Docs"
[8]: https://supabase.com/docs/guides/auth/users?utm_source=chatgpt.com "Users | Supabase Docs"
[9]: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native?utm_source=chatgpt.com "Use Supabase with Expo React Native | Supabase Docs"
[10]: https://docs.expo.dev/guides/authentication/?utm_source=chatgpt.com "Authentication with OAuth or OpenID providers - Expo Documentation"
[11]: https://developers.notion.com/docs/authorization "Authorization - Notion Docs"
[12]: https://developers.notion.com/reference/create-a-token?utm_source=chatgpt.com "Create a token - Notion Docs"
[13]: https://supabase.com/docs/guides/database/extensions/pgsodium?utm_source=chatgpt.com "pgsodium (pending deprecation): Encryption Features | Supabase Docs"
[14]: https://supabase.com/docs/guides/api/using-custom-schemas?utm_source=chatgpt.com "Using Custom Schemas | Supabase Docs"
[15]: https://supabase.com/changelog?types=breaking-change&utm_source=chatgpt.com "Changelog"
[16]: https://effect.plants.sh/schema/json-schema/?utm_source=chatgpt.com "JSON Schema | Effect"
[17]: https://effect.plants.sh/services-and-layers/services/?utm_source=chatgpt.com "Services | Effect"
[18]: https://effect.plants.sh/http-api/serving-and-clients/?utm_source=chatgpt.com "Serving & Clients | Effect"
[19]: https://supabase.com/docs/guides/functions/auth?utm_source=chatgpt.com "Securing Edge Functions | Supabase Docs"
[20]: https://supabase.com/docs/guides/database/postgres/row-level-security?utm_source=chatgpt.com "Row Level Security | Supabase Docs"
[21]: https://docs.expo.dev/versions/v54.0.0/sdk/securestore/?utm_source=chatgpt.com "SecureStore - Expo Documentation"
[22]: https://developers.notion.com/reference/post-page?utm_source=chatgpt.com "Create a page - Notion Docs"
[23]: https://supabase.com/docs/guides/api?utm_source=chatgpt.com "Data REST API | Supabase Docs"
[24]: https://supabase.com/docs/guides/functions/connect-to-postgres?utm_source=chatgpt.com "Integrating with Supabase Database (Postgres) | Supabase Docs"
[25]: https://developers.notion.com/guides/get-started/authorization?utm_source=chatgpt.com "Authorization - Notion Docs"
