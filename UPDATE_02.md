# Quotation Analysis Filtering & PDF Export Update

## PRODUCT ANALYSIS FILTERING

Currently, when creating a quotation:

- the left section contains:
  - "ΕΙΔΗ ΠΡΟΣΦΟΡΑΣ"
  - product type
  - dimensions
  - prices

- the right section contains:
  - "ΑΝΑΛΥΣΗ ΕΙΔΩΝ"

The current behavior shows the full analysis of ALL products together.

This becomes difficult to read when many products are added.

---

# REQUIRED NEW BEHAVIOR

The "ΑΝΑΛΥΣΗ ΕΙΔΩΝ" section should become dynamic.

When the user selects/clicks a specific product row from:
- "ΕΙΔΗ ΠΡΟΣΦΟΡΑΣ"

Then:
- the "ΑΝΑΛΥΣΗ ΕΙΔΩΝ" panel should display ONLY the analysis/details/components for that specific selected product.

---

# UI REQUIREMENTS

## Product Selection

When clicking a product row:

- highlight the selected row visually
- use professional selection styling
- maintain clean business appearance

Possible styling:
- light background tint
- subtle border
- active state

---

# ANALYSIS PANEL BEHAVIOR

The analysis panel should:

- update instantly when another product is selected
- only display materials/calculations for selected item
- remain scrollable if content is large
- preserve current calculation formatting

---

# DEFAULT BEHAVIOR

If:
- no product is selected

Then:
- automatically select the first product in the list

---

# DATA REQUIREMENTS

Each quotation item should maintain:
- its own analysis data
- its own calculation breakdown
- isolated display state

Avoid mixing analysis data between products.

---

# PDF EXPORT BUTTON

In the quotations list:

Currently there are buttons:
- Delete
- Επεξεργασία

Add a NEW button BETWEEN them.

Order should become:

1. Delete
2. Export PDF
3. Επεξεργασία

---

# PDF EXPORT BUTTON REQUIREMENTS

The new button should:

- have professional styling
- include PDF/download icon if appropriate
- visually match existing action buttons

Text:
- PDF
OR
- Export PDF

---

# IMPORTANT

The PDF button should NOT have functionality yet.

For now:
- button only appears visually
- no backend/export logic yet
- no PDF generation yet

This functionality will be implemented in a future update.

---

# IMPORTANT DEVELOPMENT RULES

1. Do NOT break existing quotation calculations.
2. Do NOT break multi-product quotation functionality.
3. Keep TypeScript strict typing.
4. Maintain existing professional UI styling.
5. Keep all Greek UI labels.
6. Use reusable components where possible.
7. Keep analysis rendering modular and maintainable.