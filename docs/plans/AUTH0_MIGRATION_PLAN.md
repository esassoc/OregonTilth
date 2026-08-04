# Auth0 Migration Plan (Keystone → Auth0)

Branch: `feature/auth0`
Reference implementation: [esassoc/noria](https://github.com/esassoc/noria)

## Goal

Replace Keystone (self-hosted IdentityServer) with Auth0 as the identity provider for both
`OregonTilth.API` (JWT bearer validation) and `OregonTilth.Web` (Angular 21 SPA), following the
patterns already proven in noria.

The core insight is that almost nothing about *authorization* changes. OregonTilth already
validates a bearer JWT against an OIDC authority and resolves the caller to a `dbo.User` row by
the `sub` claim; the `RoleEnum`/`*Feature` attribute stack sits entirely downstream of that. The
migration is therefore mostly: point at a new authority, and widen the identity key from a
`uniqueidentifier` to a string.

---

## Current state (what we have today)

### API — `OregonTilth.API`

| Concern | Today |
| --- | --- |
| Token validation | `Startup.cs:78-101` — `AddJwtBearer`, `Authority = FrescaConfiguration.KEYSTONE_HOST`, `ValidateAudience = false`, `MapInboundClaims = false` |
| Identity → user | `Services/UserContext.cs` — `Guid.Parse(claims.Single(c => c.Type == "sub"))` → `User.GetByUserGuid` |
| Keystone API client | `Services/KeystoneService.cs` — only live use is `Invite()` from `UserController.InviteUser` |
| Base controller | `Controllers/SitkaController.cs:16` takes `KeystoneService`; **13 controllers** pass it through, only `UserController` uses it |
| Authorization | `Services/Authorization/{Admin,UserView,WorkbookEdit,LoggedInUnclassified}Feature.cs` — role checks, IdP-agnostic |
| Config | `FrescaConfiguration.KEYSTONE_HOST`, `KEYSTONE_REDIRECT_URL` |

### Web — `OregonTilth.Web`

| Concern | Today |
| --- | --- |
| OIDC library | `angular-oauth2-oidc` ^21.0.3 (+ `-jwks`) |
| Bootstrap | `src/main.ts` — `bootstrapApplication`, `provideOAuthClient()` |
| Client config | `app.component.ts:54` — `oauthService.configure(environment.keystoneAuthConfiguration)`, manual `tryLogin`/`setupAutomaticSilentRefresh`/event switchboard |
| Token storage | `shared/services/cookies/cookie-storage.service.ts` — `OAuthStorage` over cookies |
| Token attachment | `shared/interceptors/auth-interceptor.ts` — reads `access_token` cookie, sets `Authorization` header |
| User resolution | `services/authentication.service.ts:70-101` — `GET /user-claims/{globalID}`, and **on 404** builds a `UserCreateDto` client-side and `POST /users` |
| Runtime config | `app.init.ts` `APP_INITIALIZER` fetches `assets/config.json`; served dynamically by `OregonTilth.Web/Startup.cs:51-59` (`ConfigDto` built from env vars / helm configmap) |
| Callback routes | `/login-callback`, `/logout-callback`, `/create-user-callback` (`app.routes.ts:90-92`) |

### Database

`OregonTilth.Database/dbo/Tables/dbo.User.sql:4` — `[UserGuid] [uniqueidentifier] NULL`, plus
`AK_User_Email` unique constraint on `[Email]`.

### Deployment

- `charts/kyctg/charts/kyctg-api/templates/configmap.yaml` — `KEYSTONE_HOST`, `KEYSTONE_REDIRECT_URL`
- `charts/kyctg/charts/kyctg-web/templates/configmap.yaml` — 11 `keystone_*` keys
- `docker-compose/.env`, `.env.template`, `docker-compose.override.yml`

---

## Target state (what noria does)

| Concern | noria |
| --- | --- |
| Token validation | `Noria.API/Startup.cs:126-134` — `AddJwtBearer` with `Authority` + `Audience` (Auth0 tenant + API identifier). Dev adds a `DualAuth` policy scheme forwarding to a `TestAuthHandler` for e2e |
| Identity → user | `Noria.API/Services/UserContext.cs` — `claims.Single(c => c.Type == ClaimsConstants.Sub).Value` (string) → `Users.GetByUserGlobalID` |
| Claim names | Default .NET inbound mapping **on**; `Noria.Models/Helpers/ClaimsConstants.cs` uses the WS-Fed URIs (`.../nameidentifier`, `.../emailaddress`, `.../givenname`, `.../surname`) |
| User upsert | `POST /user-claims` (`UserClaimsController.PostUserClaims`) → `Users.UpdateClaims` upserts from the token's claims. **Falls back to matching on `Email`** when no user row is known |
| Identity column | `[GlobalID] VARCHAR(255) NULL` + `AK_User_GlobalID` unique |
| SPA library | `@auth0/auth0-angular` ^2.4.0 |
| SPA config | `Noria.Web/src/app/app.config.ts:42-64` — `provideAuth0({domain, clientId, authorizationParams: {redirect_uri, audience, scope: "openid profile email offline_access"}, useRefreshTokens: true, cacheLocation: "localstorage", httpInterceptor: {allowedList: [...]}})` |
| Token attachment | `authHttpInterceptorFn` from `@auth0/auth0-angular` via `provideHttpClient(withInterceptors([...]))` |
| Auth service | `shared/services/authentication.service.ts` — subscribes `auth0.user$`, calls `POST /user-claims`; `login()` → `loginWithRedirect()`, `logout()` → `auth0.logout({logoutParams:{returnTo}})`, sign-up → `screen_hint: "signup"`, password reset → `screen_hint: "reset-password"` |
| Invite | **None.** No Management API usage anywhere in noria |

---

## Decision points

These are the places where noria's shape and OregonTilth's shape genuinely differ, so a copy-paste
port has to make a call. **All four recommendations below were accepted on 2026-07-29**; the
alternatives are kept for the record of why each was not taken.

### D1 — Where does Auth0 client config come from? → **Option A**

noria hardcodes `domain`/`clientId`/`audience` in `src/environments/environment*.ts` at build time
(only `redirectUri` is runtime, via `assets/env.template.js` → `window.__env`). OregonTilth has a
*fully* runtime config model: helm configmap → env vars → `ConfigDto` → `GET /assets/config.json`
→ `window.config`, fetched in an `APP_INITIALIZER`.

`provideAuth0(config)` wants its config at provider-construction time, which is **before**
`APP_INITIALIZER` runs — so the existing fetch point is too late.

- **Option A (recommended).** Keep the runtime config model; move the `config.json` fetch out of
  `APP_INITIALIZER` and `await` it at the top of `main.ts` *before* `bootstrapApplication`, then
  pass real values straight into `provideAuth0({...})`. One small structural change, no new
  machinery, no initialization-order hazard, and the helm/`ConfigDto` deploy pipeline keeps
  working unchanged. `app.init.ts` can be deleted.
- **Option B.** Keep `APP_INITIALIZER` and set config imperatively via `AuthClientConfig.set()`
  (the library supports this — `AuthClientConfig` has `set()`/`get()` and `AuthConfigService` is
  `@Optional()`). Fragile: correctness depends on nothing injecting `AuthService` before the
  initializer resolves, and Auth0's own interceptor and guards inject it.
- **Option C.** Adopt noria's build-time `environment.*.ts` values. Cleanest code, but it means
  per-environment builds for values that today are pure config, and it partially abandons a
  deploy pipeline that already works.

### D2 — Claim type mapping → **adopt noria's `ClaimsConstants`**

OregonTilth sets `MapInboundClaims = false` and reads the short `"sub"`. noria leaves mapping on
and reads the WS-Fed URIs via `ClaimsConstants`.

- **Recommended:** adopt noria's `ClaimsConstants` + default mapping. It costs one new file and
  removing two lines from `Startup.cs`, and it means `UserContext`/`UpdateClaims` can be lifted
  from noria verbatim — which matters for every future cross-repo port. Keeping
  `MapInboundClaims = false` also works; it just guarantees a permanent small divergence.

### D3 — What replaces the Keystone invite? → **Option A**

`KeystoneService.Invite()` (create the identity + send the invite email) has no Auth0 equivalent
without the Management API. noria simply has no invite feature.

- **Option A (recommended) — pre-provisioned rows, adopted by email on first login.** Admin fills
  in the existing invite form; instead of calling Keystone we insert a `dbo.User` row with the
  email + chosen role and a `NULL` GlobalID, and send the invite email ourselves via the existing
  `SitkaSmtpClientService`, linking to Auth0 sign-up. The recipient signs up through Universal
  Login; `UpdateClaims`' email fallback finds the pre-provisioned row and stamps its GlobalID —
  so they land with the role the admin intended, already assigned. This keeps the admin UX and the
  `UserInviteDto` contract intact, and it reuses the exact mechanism that migrates existing users
  (D4). No M2M credentials, no new external dependency.
- **Option B.** Implement Auth0 Management API invite (M2M client + client secret, create user,
  generate a password-change ticket). Genuinely more capable — the account exists in Auth0 the
  moment the admin submits — but it adds a secret to manage, a rate-limited external call in the
  request path, and real error-handling surface.
- **Option C.** Drop invite entirely and match noria: self-signup only, admin assigns role
  afterwards. Least code; loses the "invite a specific person at a specific role" workflow, and
  new users sit in `Unassigned` until an admin notices.

### D4 — `UserGuid` → `GlobalID` and existing accounts → **email-adoption re-link**

Auth0 `sub` values (`auth0|68f...`, `google-oauth2|...`) are not GUIDs, so the column type has to
change: `[UserGuid] uniqueidentifier` → `[GlobalID] varchar(255)`, plus a unique constraint.

Existing production users keep their `dbo.User` rows. Because `Email` is already unique
(`AK_User_Email`) and noria's `UpdateClaims` falls back to `x.Email == email` when it has no user
row, **the re-link is automatic**: an existing user signs in with Auth0, `UpdateClaims` matches by
email, stamps the new `GlobalID`, and their role/history are preserved. No bulk data mapping
between Keystone GUIDs and Auth0 subs is required.

This depends on Auth0 accounts being created with the same email addresses (bulk import or
first-login self-signup) — see prerequisites.

### D5 — Access-token claims → **satisfied by the tenant's existing post-login Action**

`Users.UpdateClaims` in noria reads `email`, `given_name` and `family_name` off the
`ClaimsPrincipal` built from the **access token**, and an Auth0 access token carries only
`sub`/`iss`/`aud`/`scope`/`azp` by default. noria's repo contains no Action code and its
`TestAuthHandler` injects only `sub`, so the reference implementation does not show where those
claims come from.

The answer is a post-login Action on the tenant, which already exists and sets `email`, `name`,
`given_name`, `family_name` and `nickname` on the access token. Those names are **not** namespaced,
so ASP.NET Core's inbound claim mapping rewrites them to the WS-Fed URIs and the standard
`ClaimsConstants` entries resolve them — which is also how noria works. No tenant change was needed.

`ClaimsConstants.FindFirstValue` additionally accepts URI-namespaced equivalents, so the same code
holds up if a tenant is ever configured that way instead. `POST /user-claims` fails loudly with a
diagnostic rather than inserting a half-populated row if no email claim arrives at all.

Note for future changes: the SPA must **not** send profile fields in the request body instead. D3's
invite adoption matches on email to decide which pre-provisioned row — and therefore which
admin-granted role — a caller receives, so a client-supplied email would be a privilege-escalation
hole. Email stays signed.

---

## Work plan

### Phase 0 — Auth0 tenant setup (prerequisite, outside the repo)

A single tenant, `knowyourcosttogrow.us.auth0.com`, serves every environment. Client ID
`NMcg7B6cTWgARMnzK6GLSULHtXXtjOvh`, API identifier / audience `KnowYourCostToGrowAPI`. These are
committed to `charts/kyctg/values.yaml` and the two `config.json.template` files; none are secrets.

Remaining tenant-side items:

1. Allowed Callback URLs, Allowed Logout URLs and Allowed Web Origins must list the bare origins —
   `http://localhost:11852`, `https://kyctg.esa-qa.sitkatech.com`, and the prod web
   domain. There is no `/login-callback` path any more; `redirect_uri` is `window.location.origin`.
2. `offline_access` must be enabled on the registered API, since the SPA uses `useRefreshTokens`.
3. The post-login Action supplying profile claims is already in place — see D5.
4. Decide user seeding: bulk-import existing Keystone users by email, or let them self-signup and
   re-link via the email fallback (D4).

### Phase 1 — Database

- `dbo.User.sql`: `[UserGuid] uniqueidentifier` → `[GlobalID] varchar(255) NULL`; add
  `CONSTRAINT AK_User_GlobalID UNIQUE NONCLUSTERED ([GlobalID] ASC)`.
- Release script under `OregonTilth.Database/Scripts` to add the column, and drop `UserGuid`.
- Regenerate EF models (`Build/efcorepocogenerator`) → `Entities/Generated/User.cs`,
  `UserExtensionMethods.cs`, `Models/DataTransferObjects/Generated/UserDto.cs`.

### Phase 2 — API

1. `Startup.cs` — replace the Keystone `AddJwtBearer` block with Auth0 `Authority` + `Audience`
   from config; drop the dev `BackchannelHttpHandler` self-signed-cert workaround, the
   `ValidateAudience = false` line, and (per D2) the `MapInboundClaims`/claim-type lines. Remove
   the `KeystoneService` registration.
2. Add `OregonTilth.Models/Helpers/ClaimsConstants.cs` (port from noria).
3. `FrescaConfiguration` — `KEYSTONE_HOST`/`KEYSTONE_REDIRECT_URL` → an `Auth0Configuration`
   (`Authority`, `Audience`), mirroring `Noria.API/Services/NoriaConfiguration.cs`.
4. `Services/UserContext.cs` — `Guid.Parse(...)` → string `sub`; `GetByUserGuid` →
   `GetByUserGlobalID`. Same for `GetUserFromAuthorizationHandlerContext`.
5. `EFModels/Entities/User.cs` — `GetByUserGuid`/`UpdateUserGuid` → GlobalID equivalents; port
   `UpdateClaims` from noria (mapping `RoleEnum.PendingLogin`/`Patron` → OregonTilth's
   `RoleEnum.Unassigned`/`Normal`); update `ValidateCreateUnassignedUser`'s duplicate-identity
   check.
6. `Controllers/UserClaimsController.cs` (new) — `POST /user-claims` per noria. Keep
   `GET /user-claims/{globalID}` but drop its `Guid.TryParse` guard.
7. `Controllers/UserController.cs` — rework `InviteUser` per the D3 decision.
8. Delete `Services/KeystoneService.cs`; drop the parameter from `SitkaController` and all 13
   subclass constructors (mechanical).

### Phase 3 — Web

1. `package.json` — add `@auth0/auth0-angular` ^2.4.0; remove `angular-oauth2-oidc` and
   `angular-oauth2-oidc-jwks`.
2. `main.ts` — per D1, `await` the config fetch, then add `provideAuth0({...})` and
   `provideHttpClient(withInterceptorsFromDi(), withInterceptors([authHttpInterceptorFn]))`;
   remove `provideOAuthClient()` and the `AppInitService`/`APP_INITIALIZER` pair.
3. Delete `app.init.ts`, `shared/interceptors/auth-interceptor.ts`,
   `shared/services/cookies/cookie-storage.service.ts` (and the `ngx-cookie-service` dependency if
   nothing else uses it).
4. `app.component.ts` — delete `configureAuthService()` and the whole OAuth event switchboard;
   `@auth0/auth0-angular` handles redirect callback, silent refresh, and storage.
5. `services/authentication.service.ts` — port noria's version: inject Auth0 `AuthService`,
   subscribe `user$`, call `POST /user-claims` (replacing the `GET`-then-404-then-`POST /users`
   dance), and route `login`/`logout`/`createAccount`/`resetPassword` through
   `loginWithRedirect`/`logout`/`screen_hint`.
6. `shared/services/api/api.service.ts` — drop the `OAuthService` dependency; the 401 branch calls
   `authenticationService.forcedLogout()` instead of `initImplicitFlow()`.
7. `environments/dynamic-environment.ts` — `keystoneAuthConfiguration` → `auth0`; drop
   `keystoneSupportBaseUrl`, `createAccountUrl`, `createAccountRedirectUrl` if unused after the
   D3 decision.
8. Routes — `/login-callback` and `/logout-callback` become unnecessary (Auth0 returns to the app
   origin); keep or repoint `/create-user-callback` per D3. Audit `pages/user-invite`
   (`user-invite.component.ts:64` reads `user.UserGuid`).
9. `assets/config.json` + `config.json.template` (both `src/` and `wwwroot/`) — swap the
   `keystoneAuthConfiguration` block for `auth0: {domain, clientId, audience}`.
10. `OregonTilth.Web/Startup.cs` — `KeystoneAuthConfigurationDto` → `Auth0ConfigurationDto`
    (`Auth0_Domain`, `Auth0_ClientID`, `Auth0_Audience`).

### Phase 4 — Deployment config

- `charts/kyctg/charts/kyctg-api/templates/configmap.yaml` — `KEYSTONE_*` → `Auth0__Authority`,
  `Auth0__Audience`.
- `charts/kyctg/charts/kyctg-web/templates/configmap.yaml` — 11 `keystone_*` keys → 3 `auth0_*`.
- `docker-compose/.env`, `.env.template`, `docker-compose.override.yml` — same swap.

### Phase 5 — Verification

- Local: sign in, sign out, sign up, password reset, refresh-token renewal across an expired
  access token.
- Existing-user re-link: a `dbo.User` row with a `NULL` GlobalID and a matching email gets adopted
  on first Auth0 login, preserving role and workbook data.
- Each `*Feature` authorization attribute still gates correctly per role
  (Admin / Normal / Unassigned / Disabled).
- Invite flow end-to-end per the D3 decision.

---

## Out of scope

- **Impersonation.** noria has `ImpersonationService` + `ImpersonatedUserGlobalID`; OregonTilth has
  no impersonation today and this migration does not add it.
- **E2E test auth.** noria's `DualAuth`/`TestAuthHandler` scheme exists to support Playwright. The
  `OregonTilth.Web/e2e` folder is legacy Protractor and effectively dead; no test-auth handler is
  planned. Worth revisiting if/when Playwright arrives.
- **Client-credentials / API-key access.** noria supports M2M callers (`gty`/`azp` claims,
  `IsClientUser`, `ApiKey`); OregonTilth has no such callers.

## Risks

| Risk | Mitigation |
| --- | --- |
| Access token lacks profile claims (D5) | Resolved — the tenant's post-login Action already supplies them; the claim lookup accepts standard or namespaced, and `POST /user-claims` fails loudly rather than inserting a partial row |
| Users whose Auth0 email differs from their `dbo.User` email won't auto-link | Reconcile the email list before cutover; admin can correct `GlobalID` after the fact |
| Two Auth0 identities for one person (e.g. Google + password) produce two `sub`s for one email | Enable Auth0 account linking, or treat email as the identity of record |
| `UserGuid` drop is destructive | Keep the column through one release before dropping it, so a rollback is possible |
| Config plumbing spans 6+ files across helm/compose/`ConfigDto` | Phase 4 as a single reviewable commit; `GET /assets/config.json` is the one place to verify |
