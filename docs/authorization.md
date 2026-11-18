# Authorization

How this app decides who can see and change what. Written with `/compass:authz-profile`; questions in [compass](https://github.com/esassoc/compass/blob/master/tracks/authz-triage/questionnaire.md).

<!-- compass:authz:begin -->
| Field | Value |
|---|---|
| **Role model** | fixed |
| **External users** | invited, auto-provisioned |
| **Pending role** | no access |
| **Record scoping** | enforced |
| **Anonymous endpoints** | 12 |
| **Public uploads** | n/a |
| **External uploads** | no |
| **Upload scanning** | n/a |
| **Tenant isolation** | n/a |
| **Open findings** | 0 |
| **Reviewed** | 2026-11-18, Stewart Gordon |
<!-- compass:authz:end -->

## Roles

Roles are fixed, seeded by `OregonTilth.Database/Scripts/LookupTables/dbo.Role.sql`.

| Role | Staff / external | How the account is created | Sees |
|---|---|---|---|
| Admin | staff (Oregon Tilth staff and ESA staff) | Invited by an admin, or promoted from Unassigned | Everything. Manages users, roles, rich text, field definitions and CMS pages. Sees only their own workbooks. |
| Normal | external (farmers taking a class) | Invited by an admin with the role chosen up front, or promoted from Unassigned by an admin | Their own workbooks, the curriculum pages, and their own user record |
| Unassigned | external, pending | Anyone who signs up through Auth0 without an invite gets this role on first sign-in (`User.cs`, `UpdateClaims`) | A waiting message on the home page and their own user record. No side nav, pages or workbooks. |
| Disabled | either, deactivated | Set by an admin | A disabled message on the home page and nothing else |

The role checks live in `OregonTilth.API/Services/Authorization/`. `AdminFeature` grants Admin. `WorkbookEditFeature` grants Admin and Normal. `UserViewFeature` grants Admin, Normal and Unassigned, and the one endpoint that uses it, `GET users/{userID}`, adds a check that non-admins can read only their own record.

Auth0 authenticates users. An invite pre-creates the user row with a role; the user's Auth0 sign-up then attaches to that row, and `UpdateClaims` leaves the role alone. Anyone can create an Auth0 account and sign in without an invite. They get a user row as Unassigned, and the support admins get an email.

In the web app, the side nav renders only for Admin and Normal users (`app.component.ts`). `ApprovedUserGuard` (Admin or Normal) protects the page detail route, and `ManagerOnlyGuard` (Admin) protects the admin screens. The API enforces all of these checks independently of the UI.

## Tenancy

Single tenant.

## How ownership is enforced

A global action filter. A workbook belongs to one user. `WorkbookOwnershipFilter` (`OregonTilth.API/Services/Filters/`), registered in `Startup.cs`, runs on every action and gathers every workbook the request touches:
- the `{workbookID}` route value
- any `WorkbookID` in the bound request body
- any workbook-scoped record ID (`CropID`, `FieldLaborActivityID`, `TimeStudyID` and so on) in the route or body, looked up to its workbook

They must all resolve to one workbook owned by the caller. Otherwise the request gets a 404, or a 400 when it mixes workbooks. Requests that touch no workbook pass through. `GET workbooks` lists only the caller's workbooks.

What it relies on:
- **The lookup list.** It maps each workbook child table's key name to its table. A new child table needs an entry, or its IDs aren't checked.
- **Naming.** Route parameters and DTO properties must use the table's key name.
- **Admins** are held to the same rule: an admin sees only their own workbooks.

User records: `GET users/{userID}` and `GET user-claims/{globalID}` return the caller's own record, and anyone's only to an Admin. The disclaimer-date and activity-date endpoints act on the signed-in caller.

## Anonymous endpoints

`Startup.cs` sets a fallback policy that requires a signed-in user, so an action is anonymous only if it is marked `[AllowAnonymous]`.

| Endpoint | Why |
|---|---|
| `GET /health-check` (and `/healthz`) | Health monitoring |
| `GET /` (SystemInfo) | Version and system info |
| `GET lookupTable/field-labor-activity-categories`, `labor-types`, `field-unit-types`, `phases`, `harvest-types`, `tp-or-ds-types` (6) | Public lookup lists |
| `GET customRichText/{customRichTextTypeID}` | Home page, About, and status messages, which render before and after sign-in |
| `GET /fieldDefinitions`, `GET fieldDefinitions/{fieldDefinitionTypeID}` | Field help text |
| `GET FileResource/{guid}` | Serves images embedded in content (image MIME types only) |

## Uploads

The API has no file-upload endpoint (no `IFormFile`, multipart or SAS issuance). Rich-text editors (TinyMCE) can embed images in admin-edited content. `FileResource/{guid}` serves stored images inline, and only for image MIME types (`FileResourceController.cs`). Public uploads are `n/a` because no external user has a working role on first sign-in: sign-ups land in Unassigned. Nothing is scanned, and nothing needs to be today.

## Open findings

| # | Finding | Evidence | Ticket |
|---|---|---|---|

None.

<When a finding is fixed, delete its row, lower the count, and update the summary.>

