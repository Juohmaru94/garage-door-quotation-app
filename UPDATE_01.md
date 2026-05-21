# Dashboard, Quotations & Orders System Update

## GENERAL UI CHANGES

1. Remove all current page titles.
2. Remove:
   - "Τιμες από βαση"
   - "Desktop-first"
3. The default startup page should contain:
   - top navigation tabs
   - centered company logo below tabs
4. The logo should occupy approximately 50% of the visible window area.
5. The application should maintain the same professional business UI style.

---

# TOP NAVIGATION TABS

Create these tabs in this exact order:

1. Home
2. Προσφορές
3. Παραγγελίες
4. Edit Materials

Tabs should:
- look professional
- be horizontally aligned at the top
- indicate active state clearly

---

# HOME TAB

The Home tab should:
- initially contain only the centered company logo
- maintain clean spacing and professional appearance

The logo image will be provided later.

---

# ΠΡΟΣΦΟΡΕΣ TAB

## Main Requirements

1. Add button:
   - "Νέα προσφορά"

2. Clicking the button should:
   - open the existing quotation creation modal/window

3. Every quotation must automatically receive:
   - unique numeric ID
   - creation date
   - last modified date

---

## Quotations Table Columns

Display columns in this exact order:

1. ID
2. Customer Name
3. Date Created
4. Date Accepted
5. Last Modified
6. Status

---

## Quotation Status Dropdown

Each quotation must have a dropdown with:

- Declined (red)
- Accepted (green)
- Pending (grey)

---

## Acceptance Logic

When quotation status changes to:
- Accepted

Automatically:
- populate Date Accepted field

If changed away from Accepted:
- Date Accepted should remain preserved unless manually reset later

---

## Editable Quotations

Quotations must:
- be editable
- support editing modal/page
- contain separate quotation notes

IMPORTANT:
Quotation notes must NOT automatically transfer to Orders notes.

---

## Save Behavior

When editing:
- changes should NOT save automatically
- user must press Save button explicitly

If Save is not pressed:
- changes are discarded

---

# ΠΑΡΑΓΓΕΛΙΕΣ TAB

## Orders Creation Logic

Orders should be generated from accepted quotations.

Orders should contain:
- unique ID
- customer name
- accepted date
- editable order notes

---

## Orders Table Columns

Display columns in this exact order:

1. ID
2. Customer Name
3. Date Accepted
4. Date Finished
5. Urgency
6. Status

---

## Order Status Dropdown

Statuses:

- Completed (green)
- In Progress (grey)
- Ready (orange/yellow)

---

## Completed Logic

If status becomes:
- Completed

Then:
- Urgency field becomes blank
- Date Finished is automatically populated

---

# URGENCY SYSTEM

Urgency is based on:
- number of days since Date Accepted

Every 7 days increase urgency level.

Use these levels in this order:

1. Ασήμαντο
2. Χαμηλής προτεραιότητας
3. Σημαντικό
4. Υψηλής προτεραιότητας
5. Επείγον

Requirements:
- proper color coding
- urgency updates automatically
- if order completed → urgency blank

---

# EDIT MATERIALS TAB

This section should contain:
- all material costs
- all sale prices
- all paint pricing

Use editable tables.

---

## MASS EDITING

Users must be able to:
- edit multiple material values
- then press single Save button

No auto-save behavior.

---

## ADD MATERIAL BUTTON

Add button:
- "Add Material"

Opens modal/window.

Fields:
- Όνομα
- Κατηγορία
- Κόστος
- Τιμή Πώλησης

New materials should save to database.

---

# IMPORTANT REQUIREMENTS

1. Keep calculations fully functional.
2. Keep existing quotation creation logic.
3. Maintain Greek UI language.
4. Maintain professional styling.
5. Keep TypeScript strict typing.
6. Keep modular architecture.
7. Use reusable components where possible.