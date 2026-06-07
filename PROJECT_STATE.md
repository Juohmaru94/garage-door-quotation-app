# Project State

Last reviewed: 2026-06-07

This document describes the current application as it exists in the repository today. It is intended to be read together with `spec.md` and `AGENTS.md` by a new Codex session before making changes.

## Current Summary

The project is a Next.js 15 desktop-first web application for creating, calculating, storing, and managing Greek garage-door quotations. It uses Prisma with SQLite for local persistence, a reusable calculation service for quotation pricing, shadcn-style UI primitives, and a single dashboard page with tabs for quotations, orders, and material editing.

The application is still a web app running through Next.js. It is not yet packaged as a Windows desktop application. There is no Electron, Tauri, installer, auto-update system, local desktop shell, or native file integration in the current codebase.

The UI is intended to be Greek, but many strings in the current source are mojibake-encoded Greek text, and some labels remain English. This is a visible quality issue and should be treated as part of the localization cleanup.

## Technology Stack

- Framework: Next.js 15 App Router
- Language: TypeScript
- UI: React 19, Tailwind CSS 4, local shadcn-style component wrappers
- Forms: React Hook Form
- Validation: Zod
- Database: Prisma ORM with SQLite
- Icons: Lucide React
- Package manager: npm
- Main scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run db:generate`
  - `npm run db:push`
  - `npm run db:seed`

## Repository Structure

- `app/page.tsx`
  - Server component for the dashboard route.
  - Loads materials, paint prices, quotations, and accepted orders from Prisma.
  - Falls back to seeded in-memory initial pricing if database reads fail or pricing tables are empty.

- `app/actions.ts`
  - Server actions for quotation persistence, status changes, quotation deletion, order status changes, order notes, pricing updates, material addition, and material deletion.

- `components/dashboard/app-dashboard.tsx`
  - Main client dashboard UI.
  - Owns local state for quotation rows, order rows, quotation dialogs, order notes dialog, and material editing.

- `components/forms/quotation-form.tsx`
  - Client quotation creation/editing form.
  - Supports customer step, multiple quotation items, live totals, per-item analysis, item editing, and item deletion.

- `components/ui/*`
  - Lightweight local shadcn-style wrappers around Radix primitives and HTML elements.
  - Includes button, badge, card, dialog, input, label, select, separator, sheet, switch, table, tabs, and tooltip.

- `lib/calculations/quotationCalculator.ts`
  - Central quotation calculation engine.
  - Converts dimensions, finds materials and paint prices, builds line items, totals cost/sell price/profit.

- `lib/pricing/initialPricing.ts`
  - Initial material and paint pricing seed data.
  - Provides dropdown option arrays for quotation item forms.

- `lib/status.ts`
  - Quotation statuses, order statuses, labels, urgency levels, and urgency calculation.

- `lib/validation/quotation.ts`
  - Zod schemas and default values for customer details and quotation items.

- `lib/database/prisma.ts`
  - Prisma client singleton for development.

- `prisma/schema.prisma`
  - SQLite Prisma schema.

- `prisma/seed.ts`
  - Seeds/upserts initial materials and paint prices.

## Implemented Features

### Dashboard

- Single page dashboard at `/`.
- Top tab navigation currently contains:
  - `Προσφορές`
  - `Παραγγελίες`
  - `Edit Materials`
- The original Home tab from `UPDATE_01.md` is not present in the current UI.
- Dashboard data is loaded server-side in `app/page.tsx`.
- Main dashboard container is desktop-first, centered, and capped at `max-w-[1440px]`.

### Quotations

- Quotations list table shows:
  - ID
  - Customer Name
  - Date Created
  - Date Accepted
  - Last Modified
  - Total sell price
  - Status
  - Actions
- Actions currently include:
  - Delete quotation
  - `PDF` placeholder button with no functionality
  - Edit quotation
- New quotations open in a modal dialog.
- Existing quotations open in an edit modal dialog.
- Quotation deletion uses `window.confirm`.
- Quotation status dropdown supports:
  - `PENDING`
  - `ACCEPTED`
  - `DECLINED`
- Status changes are optimistic in the UI.
- Status update responses replace the affected quotation row and refresh accepted orders.
- Request sequence refs are used to ignore stale status responses if the user changes the same row repeatedly.

### Multi-Item Quotation Form

- Quotation creation starts with a customer prompt requiring:
  - customer name
  - customer phone
  - optional email
- After customer details are entered, the user creates one or more quotation items.
- Each item has its own:
  - width
  - height
  - roller type
  - paint flag
  - guide selection
  - box selection
  - tamplas flag
  - box caps flag
  - strantza selection
  - motor selection
  - accessory toggles
  - installation cost
  - item notes
- Items can be added, edited, selected, and removed from the draft.
- Totals update live from the current draft item list.
- The summary panel shows:
  - item count
  - total cost
  - total sell price
  - profit
  - profit margin
- The analysis panel follows `UPDATE_02.md`:
  - selecting a product row highlights it
  - only the selected item analysis is shown
  - the first item is auto-selected when needed
  - analysis is scrollable

### Orders

- Orders are generated from accepted quotations.
- An order is created or updated by `syncOrderForAcceptedQuotation` when a quotation becomes accepted.
- Orders table shows:
  - ID
  - Customer Name
  - Date Accepted
  - Date Finished
  - Urgency
  - Status
  - Notes action
- Orders are queried only when their related quotation has status `ACCEPTED`.
- Order status dropdown supports:
  - `IN_PROGRESS`
  - `READY`
  - `COMPLETED`
- Order status changes are optimistic in the UI.
- Request sequence refs are used to ignore stale order status responses.
- When an order is changed to `COMPLETED`, `finishedAt` is set if needed.
- In the current code, changing an order away from `COMPLETED` sets `finishedAt` back to `null`.
- Order notes are edited in a modal.
- Order notes are stored on the `Order` model and are separate from quotation notes.

### Materials

- Materials are grouped by category in the `Edit Materials` tab.
- Category buttons show counts and reveal the editable table for that selected category.
- Categories:
  - `ROLLER_CURTAIN`
  - `ROLLER_SHAFT`
  - `GUIDE`
  - `BOX`
  - `TAMPLAS`
  - `STRANTZA`
  - `MOTOR`
  - `ACCESSORY`
  - paint prices as `PAINT`
- Material cost and sell prices can be edited in table inputs.
- Paint cost and paint sell prices can be edited separately.
- Price edits are draft-local until the user clicks `Αποθήκευση`.
- `updatePricing` saves edited material and paint prices in a Prisma transaction.
- Initial synthetic IDs like `initial-material-0` and `initial-paint-0` are supported by `updatePricing`; saving them upserts the initial rows into the database.
- New materials can be added through a modal with:
  - name
  - category
  - unit type
  - cost price
  - sell price
- Adding a material persists immediately through `addMaterial`, then updates local material drafts and refreshes the dashboard.
- Material deletion currently exists, but it is immediate:
  - every material row has a delete button in the `Ενέργειες` column
  - clicking delete asks for confirmation
  - confirmed deletion calls `deleteMaterial` immediately
  - this does not match the newer requested draft-removal workflow where deletion should only persist after pressing Save

## Architecture

### Rendering Model

- `app/page.tsx` is a dynamic server-rendered page using `export const dynamic = "force-dynamic"`.
- Server data is passed into `AppDashboard` as serialized props.
- `AppDashboard` is a client component and maintains interactive state.
- Server actions mutate the database and call `revalidatePath("/")`.
- The dashboard often updates local state immediately and also calls `router.refresh()` through a transition.

### Data Flow

1. Page load:
   - `app/page.tsx` queries Prisma for materials, paint prices, quotations, and accepted orders.
   - Data is serialized into row types.
   - `AppDashboard` receives initial arrays.

2. Client interactions:
   - Quotation and order status changes call server actions directly.
   - New/edit quotation save calls the `saveQuotation` server action directly through the `onSave` callback.
   - Material pricing save calls `updatePricing`.
   - Add material calls `addMaterial`.
   - Delete material calls `deleteMaterial`.

3. Refresh:
   - Server actions revalidate `/`.
   - Client calls `router.refresh()` in several flows to sync server-rendered data back into props.

### UI Component Pattern

- The project uses local UI components rather than generated shadcn files from a registry.
- Components are thin wrappers with Tailwind classes and Radix primitives.
- `Button` includes `cursor-pointer` by default and disabled pointer blocking.
- `TabsTrigger` includes `cursor-pointer`.
- `DialogContent` close button includes `cursor-pointer`.

## Database Schema

### ProductMaterial

Fields:
- `id: String @id @default(cuid())`
- `category: String`
- `name: String`
- `unitType: String`
- `costPrice: Float`
- `sellPrice: Float`
- `createdAt: DateTime @default(now())`
- `updatedAt: DateTime @updatedAt`

Constraints:
- unique composite index on `[category, name]`

Purpose:
- Stores editable material cost and sale prices.

### PaintPrice

Fields:
- `id: String @id @default(cuid())`
- `materialName: String @unique`
- `paintCost: Float`
- `paintSellPrice: Float`

Purpose:
- Stores paint cost/sell add-ons for relevant material names.

### Quotation

Fields:
- `id: Int @id @default(autoincrement())`
- customer fields: `customerName`, `customerPhone`, `customerEmail`
- primary item snapshot fields: `widthCm`, `heightCm`, `rollerType`, option flags/selections, `installationCost`, `notes`
- totals: `totalCost`, `totalSellPrice`
- status: `status String @default("PENDING")`
- acceptance: `acceptedAt DateTime?`
- timestamps: `createdAt`, `updatedAt`
- relation: optional one-to-one `order`
- relation: many `items`

Purpose:
- Stores quotation header plus a primary-item snapshot for backward compatibility.
- Multi-item data is stored in `QuotationItem`.

### Order

Fields:
- `id: Int @id @default(autoincrement())`
- `quotationId: Int @unique`
- relation to quotation with cascade delete
- `customerName`
- `acceptedAt`
- `finishedAt`
- `status String @default("IN_PROGRESS")`
- `notes`
- timestamps

Purpose:
- Stores order details derived from accepted quotations.

### QuotationItem

Fields:
- `id: Int @id @default(autoincrement())`
- `quotationId`
- item dimension, selection, toggle, installation, and note fields
- `sortOrder`
- timestamps

Purpose:
- Stores each product/item in a multi-item quotation.

## Business Rules

### Pricing

- Width and height are entered in centimeters.
- Calculation converts cm to meters.
- Area is `widthMeters * heightMeters`.
- Roller price combines:
  - `ROLLER_CURTAIN` material for selected roller type
  - `ROLLER_SHAFT` material for selected roller type
- Roller calculation:
  - cost: `area * (curtainCost + shaftCost)`
  - sell: `area * (curtainSell + shaftSell)`
- Guides are based on height and always multiplied by 2.
- Strantza is based on height and always multiplied by 2.
- Box is based on width.
- Tamplas is based on width.
- Motors and accessories are per item.
- Installation cost is added equally to total cost and total sell price.
- Paint, when enabled, can add:
  - curtain paint by area
  - guide paint by height * 2
  - box paint by width, if a box is selected
  - tamplas paint by width, if tamplas is enabled

### Totals

- Total cost is the sum of line-item costs.
- Total sell price is the sum of line-item sell prices.
- Profit is `totalSellPrice - totalCost`.
- Profit margin is `(profit / totalSellPrice) * 100`, or 0 if sell price is 0.
- Money values are rounded to 2 decimals by `roundMoney`.
- Currency formatting uses `Intl.NumberFormat("el-GR", { currency: "EUR" })`.

### Quotation Status

- `PENDING`: default status.
- `ACCEPTED`: creates or syncs an order.
- `DECLINED`: quotation remains stored but does not appear in orders.
- When a quotation first becomes accepted, `acceptedAt` is populated.
- If a quotation changes away from accepted, current code preserves `acceptedAt`.
- Orders query only accepted quotations, so non-accepted quotations no longer show in the Orders tab.

### Order Status and Urgency

- `IN_PROGRESS`: default order status.
- `READY`: active order status.
- `COMPLETED`: sets `finishedAt` and hides urgency.
- In current code, changing away from `COMPLETED` clears `finishedAt`.
- Urgency is based on days since `acceptedAt`:
  - 0-6 days: level 0
  - 7-13 days: level 1
  - 14-20 days: level 2
  - 21-27 days: level 3
  - 28+ days: level 4
- Completed orders return empty urgency.

## Quotation Workflow

1. User opens `Προσφορές`.
2. User clicks `Νέα προσφορά`.
3. Modal opens with customer prompt.
4. User enters required customer name and phone.
5. User continues to the item list.
6. User clicks plus/add to create a quotation item.
7. Item editor opens with defaults.
8. User configures dimensions, roller type, materials, accessories, installation, and notes.
9. Item editor shows live item summary.
10. User clicks `Προσθήκη`, adding the item to the quotation draft.
11. Main quotation summary updates live from all draft items.
12. User can add, edit, select, or remove items.
13. Analysis panel displays only the selected item.
14. User clicks `Αποθήκευση`.
15. `QuotationForm` calls parent `onSave`.
16. `AppDashboard` calls `saveQuotation` server action.
17. Server validates, calculates totals with current database pricing, creates or updates quotation and items.
18. UI prepends/replaces the saved quotation row, refreshes orders, closes modal on success, and refreshes route.

## Orders Workflow

1. User changes quotation status to `ACCEPTED`.
2. UI updates quotation status optimistically and sets local accepted date if needed.
3. Server action updates quotation status and accepted date.
4. `syncOrderForAcceptedQuotation` upserts an order.
5. Orders tab shows orders whose quotations are accepted.
6. User can change order status.
7. UI updates status optimistically.
8. Server action persists status and finished date behavior.
9. User can open notes dialog and save order-specific notes.
10. Saved order notes update local row state and refresh the route.

## Materials Workflow

1. User opens `Edit Materials`.
2. User selects a material category or paint category.
3. Table shows only that category.
4. User edits cost and sale price values locally.
5. User clicks `Αποθήκευση`.
6. `updatePricing` validates and writes all material/paint drafts in a transaction.
7. Initial fallback rows are upserted into the database on save.
8. User can add a new material with the add-material dialog.
9. User can delete materials from the row action button, but deletion currently happens immediately after confirmation.

## Implemented From Updates

### UPDATE_01

Implemented:
- Dashboard tabs exist.
- Quotations tab exists.
- Orders tab exists.
- Edit Materials tab exists.
- Quotation status dropdown exists.
- Orders generated from accepted quotations.
- Order status dropdown exists.
- Urgency calculation exists.
- Material editing with grouped categories exists.
- Add material dialog exists.
- Edit quotation modal exists.

Not fully implemented or changed later:
- Home tab was removed from current app.
- Some requested tab/order/table labels remain English.
- Logo area is not present.
- Materials do not currently use a deferred delete mode.

### UPDATE_02

Implemented:
- Analysis panel filters to selected product.
- Product row selection highlights selected item.
- First item is auto-selected.
- PDF placeholder button exists in quotations list.

Not implemented:
- PDF export functionality.

## Known Issues

### Critical / Functional

- Quotation save may freeze the `Αποθήκευση` button if `onSave` throws, because `QuotationForm.saveQuotation` does not use `try/finally`.
- New/edit quotation save currently calls the `saveQuotation` server action directly from the client callback. This may be the source of unresolved save-state behavior observed during testing.
- Material deletion does not match the requested deferred workflow. It deletes immediately after confirmation instead of marking rows for deletion and applying only after `Αποθήκευση`.
- `deleteMaterial` has risky handling for synthetic initial IDs. For an `initial-material-*` row it attempts to create all initial materials except the deleted one, rather than using a clean explicit deletion/draft-save model.
- There is no automated test coverage for quotation save, order status changes, or material deletion.

### Localization / Text

- Many Greek strings in source files appear as mojibake, for example `Î ÏÎ¿ÏƒÏ†Î¿ÏÎ­Ï‚`.
- Some UI labels are still English:
  - `Customer Name`
  - `Date Created`
  - `Date Accepted`
  - `Last Modified`
  - `Status`
  - `Edit Materials`
  - `Notes`
  - status labels like `Pending`, `Accepted`, `Declined`, `Ready`
- `AGENTS.md` requires Greek UI everywhere, so localization cleanup remains required.

### UX / Product

- No printable quotation view is implemented.
- PDF export is only a placeholder button.
- No search for saved quotations.
- No duplicate quotation feature.
- No customer database.
- No settings page.
- No toast notification system.
- No dark mode support.
- No desktop-app shell or Windows packaging.
- README is still the default Next.js README and does not document this project.

### Technical

- Current TypeScript allows JS via `allowJs: true`, despite the project rule to use TypeScript everywhere.
- No API route layer exists; mutations are server-action based.
- No test framework is configured.
- No migration files are visible; Prisma schema is present and likely managed via `prisma db push`.
- The UI is mostly in large client components. `AppDashboard` and `QuotationForm` carry substantial state and could eventually be split further.

## Future Roadmap

### Immediate Fixes

1. Fix quotation save reliability:
   - wrap `QuotationForm.saveQuotation` in `try/catch/finally`
   - ensure failed saves restore the Save button
   - surface the actual error message
   - consider moving quotation save behind a normal route handler or a better-isolated server action boundary if direct client action calls remain unreliable

2. Implement deferred material deletion:
   - add `Αφαίρεση Υλικού` button between Add Material and Save
   - when active, show visible red X actions in the `Ενέργειες` column
   - clicking X should remove the material from the local draft only
   - deletion should persist only when `Αποθήκευση` is clicked
   - leaving the materials tab should discard pending removals
   - backend should accept a clear list of deleted material IDs in `updatePricing`

3. Clean up Greek text:
   - replace mojibake strings with proper Greek
   - convert remaining English UI labels to Greek
   - ensure status labels are Greek

4. Add regression tests:
   - calculation engine unit tests
   - quotation create/edit persistence tests
   - status update tests
   - order notes persistence tests
   - material edit/add/delete tests

### Product Features

- Printable quotation view.
- Real PDF export.
- Search and filtering for quotations.
- Duplicate quotation.
- Customer database.
- Settings page.
- Logo/company branding.
- Better validation/error display.
- Toast notifications.
- Confirmation dialogs using app UI instead of `window.confirm`.

### Desktop Application Preparation

- Decide desktop shell:
  - Electron: easier with Next.js server-style app, larger app size.
  - Tauri: smaller app size, but integration with a Next.js app using server actions and Prisma needs more planning.
- Decide runtime model:
  - bundled local Next.js server plus desktop webview
  - static frontend plus local API process
  - full rewrite to local-first desktop architecture
- Decide SQLite file location for production Windows:
  - use an app-data directory, not the project directory
  - add backup/export behavior before real use
- Add production database migration strategy.
- Add installer/build scripts.
- Add app icon, window title, and native menu decisions.
- Add logging and diagnostics for failed saves.

## Current Verification Commands

Use these after changes:

```bash
npm run lint
npm run build
npx tsc --noEmit
```

Use these for database setup:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## Notes For Future Codex Sessions

- Read `spec.md`, `AGENTS.md`, and this file before editing.
- Treat this document as current implementation state, not the original desired spec.
- Do not assume all Greek text is valid just because labels look Greek in intent; inspect actual rendered/source text.
- Be careful with quotation calculations. Keep business logic in `lib/calculations/quotationCalculator.ts`.
- Be careful with materials. Initial fallback rows use synthetic IDs until persisted.
- Do not make destructive database or git operations without explicit user approval.
- The user is actively testing save behavior and material deletion behavior, so those flows need browser-level verification after fixes.
