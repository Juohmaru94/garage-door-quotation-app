# Garage Door Quotation App — Full Codex CLI Specification

## PROJECT OVERVIEW

Build a professional quotation and costing web application for a Greek garage door manufacturing and sales company.

The application will be entirely in Greek language.

The purpose of the app is:
- Create quotations for customers
- Calculate total COST (ΚΟΣΤΟΣ)
- Calculate total SALE PRICE (ΤΙΜΗ ΠΩΛΗΣΗΣ)
- Generate professional printable quotations
- Allow easy editing of all material prices and costs from an admin/settings section

The application must be optimized for desktop use first.

---

# TECH STACK

Use the following stack:

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- SQLite for local database
- React Hook Form
- Zod validation
- Lucide React icons
- Recharts (only if analytics are later added)

The app must be modern, clean, professional, and easy to use.

---

# DESIGN REQUIREMENTS

## UI STYLE

The app should:
- Look professional and business-oriented
- Not futuristic or flashy
- Use a clean white/light-gray interface
- Have soft shadows and rounded corners
- Use organized form layouts
- Be optimized for fast quotation entry
- Have excellent spacing and readability

## TOGGLE SWITCHES

All YES/NO fields must:
- Use a modern green toggle switch
- Animate smoothly
- Clearly display enabled/disabled state

---

# MAIN APPLICATION SECTIONS

The app should contain:

1. Dashboard
2. New Quotation Page
3. Saved Quotations Page
4. Material Pricing Management Page
5. Settings Page
6. Printable Quotation View

---

# DATABASE DESIGN

Create database models for:

## 1. Products / Materials

Every material should store:

- id
- category
- name
- unitType
- costPrice
- sellPrice
- createdAt
- updatedAt

## 2. Paint Prices

Store:

- id
- materialName
- paintCost
- paintSellPrice

## 3. Quotations

Store:

- id
- customerName
- customerPhone
- customerEmail
- widthCm
- heightCm
- rollerType
- painted
- guides
- boxType
- tamplas
- boxCaps
- strantza
- motor
- remoteSet
- photocells
- blidoor
- switch
- locks
- installationCost
- totalCost
- totalSellPrice
- notes
- createdAt

---

# MAIN QUOTATION FORM

Create a professional quotation form.

The user must be able to input/select:

## DIMENSIONS

### ΔΙΑΣΤΑΣΕΙΣ ΡΟΛΟΥ

Fields:
- ΠΛΑΤΟΣ (cm)
- ΥΨΟΣ (cm)

Use number inputs.

---

# DROPDOWN OPTIONS

## ΕΙΔΟΣ ΡΟΛΟΥ

Dropdown selections:

- L110 0.8
- L110 1.0
- L110D 0.8
- L110D 1.0
- L80 0.8
- L80 1.0
- L80D 0.8
- L80 D 1.0
- L2IN
- A2IN
- A80
- A100
- EYEQ
- ΜΕΓΑΛΟ ΜΑΤΙ
- ΜΕΣΑΙΟ ΜΑΤΙ
- ΜΙΚΡΟ ΜΑΤΙ

---

## ΒΑΦΗ

Green toggle:
- ΝΑΙ
- ΟΧΙ

---

## ΟΔΗΓΟΙ

Dropdown:
- ΟΔΗΓΟΙ 7ΕΚ
- ΟΔΗΓΟΙ 12ΕΚ

---

## ΚΟΥΤΙ

Dropdown:
- ΟΧΙ
- ΚΟΥΤΙ Π
- ΚΟΥΤΙ Γ

---

## ΤΑΜΠΛΑΣ

Green toggle:
- ΝΑΙ
- ΟΧΙ

---

## ΚΑΠΑΚΙΑ ΚΟΥΤΙΟΥ

Green toggle:
- ΝΑΙ
- ΟΧΙ

---

## ΣΤΡΑΝΤΖΕΣ

Dropdown:
- ΟΧΙ
- ΣΤΡΑΝΤΖΑ 70Χ30
- ΣΤΡΑΤΖΑ 80Χ40
- ΣΤΡΑΤΖΑ 100Χ40

---

## ΜΟΤΕΡ

Dropdown:
- ΟΧΙ
- ΜΟΤΕΡ Φ60
- ΜΟΤΕΡ Φ76
- ΜΟΤΕΡ Φ76 ΔΙΠΛΟ
- ΜΟΤΕΡ Φ60 ΔΙΠΛΟ

---

## ΣΕΤ ΤΗΛΕΧΕΙΡΙΣΜΟΥ

Green toggle:
- ΝΑΙ
- ΟΧΙ

---

## ΦΩΤΟΚΥΤΤΑΡΑ

Green toggle:
- ΝΑΙ
- ΟΧΙ

---

## BLIDOOR

Green toggle:
- ΝΑΙ
- ΟΧΙ

---

## ΔΙΑΚΟΠΤΗΣ

Green toggle:
- ΝΑΙ
- ΟΧΙ

---

## ΚΛΕΙΔΑΡΙΕΣ

Green toggle:
- ΝΑΙ
- ΟΧΙ

---

## ΤΟΠΟΘΕΤΗΣΗ

Manual number input.

This value should:
- Be manually entered by the user
- Be added to total cost
- Be added to total sale price

---

# MATERIAL PRICE DATA

Store all material pricing in the database.

IMPORTANT:
All prices must be editable from the admin/material management page.

---

# ROLLER TYPES PRICING

IMPORTANT BUSINESS RULE:

Every ΕΙΔΟΣ ΡΟΛΟΥ consists of:

- ΚΟΥΡΤΙΝΑ
- ΑΞΟΝΑΣ

Final roller type pricing is:

ΚΟΥΡΤΙΝΑ + ΑΞΟΝΑΣ

Each contains:

- Cost Price
- Sell Price

These are calculated per square meter (m²).

Store the following:

| Name | Curtain Cost | Shaft Cost | Curtain Sell | Shaft Sell |
|---|---|---|---|---|
| L110 0.8 | 23 | 13 | 32.2 | 18.2 |
| L110 1.0 | 26 | 16 | 36.4 | 22.4 |
| L110D 0.8 | 28 | 10 | 39.2 | 14 |
| L110D 1.0 | 31.3 | 13 | 43.82 | 18.2 |
| L80 0.8 | 26 | 16 | 36.4 | 22.4 |
| L80 1.0 | 30.2 | 19 | 42.28 | 26.6 |
| L80D 0.8 | 32 | 12.8 | 44.8 | 17.92 |
| L80 D 1.0 | 35.2 | 16 | 49.28 | 22.4 |
| L2IN | 29.6 | 16 | 41.44 | 22.4 |
| A2IN | 32.4 | 10 | 45.36 | 14 |
| A80 | 58 | 10 | 81.2 | 14 |
| A100 | 108 | 16 | 151.2 | 22.4 |
| EYEQ | 130 | 16 | 208 | 22.4 |
| ΜΕΓΑΛΟ ΜΑΤΙ | 22.4 | 10 | 31.36 | 14 |
| ΜΕΣΑΙΟ ΜΑΤΙ | 28.8 | 13 | 40.32 | 18.2 |
| ΜΙΚΡΟ ΜΑΤΙ | 44.8 | 19 | 62.72 | 26.6 |

---

# OTHER MATERIAL PRICES

## ΟΔΗΓΟΙ

| Name | Cost | Sell |
|---|---|---|
| ΟΔΗΓΟΙ 7ΕΚ | 14.4 | 20.16 |
| ΟΔΗΓΟΙ 12ΕΚ | 21.6 | 30.24 |

Unit:
Per meter.

IMPORTANT:
Guides are calculated using HEIGHT.
Always calculate for 2 pieces.

Formula:
heightInMeters × price × 2

---

## ΚΟΥΤΙ

| Name | Cost | Sell |
|---|---|---|
| ΚΟΥΤΙ Π | 29 | 40.6 |
| ΚΟΥΤΙ Γ | 19.2 | 26.88 |

Unit:
Per meter.

IMPORTANT:
Boxes are calculated using WIDTH.

Formula:
widthInMeters × price

---

## ΤΑΜΠΛΑΣ

| Cost | Sell |
|---|---|
| 10 | 14 |

Unit:
Per meter.

Formula:
widthInMeters × price

---

## ΣΤΡΑΝΤΖΕΣ

| Name | Cost | Sell |
|---|---|---|
| ΣΤΡΑΝΤΖΑ 70Χ30 | 8 | 11.2 |
| ΣΤΡΑΤΖΑ 80Χ40 | 9.6 | 13.44 |
| ΣΤΡΑΤΖΑ 100Χ40 | 11.2 | 15.68 |

IMPORTANT:
Calculated using HEIGHT.
Always calculate for 2 pieces.

Formula:
heightInMeters × price × 2

---

## ΜΟΤΕΡ

| Name | Cost | Sell |
|---|---|---|
| ΜΟΤΕΡ Φ60 | 75 | 150 |
| ΜΟΤΕΡ Φ76 | 120 | 210 |
| ΜΟΤΕΡ Φ76 ΔΙΠΛΟ | 140 | 240 |
| ΜΟΤΕΡ Φ60 ΔΙΠΛΟ | 140 | 240 |

Unit:
Per item.

---

## OTHER ACCESSORIES

| Name | Cost | Sell |
|---|---|---|
| ΣΕΤ ΤΗΛΕΧΕΙΡΙΣΜΟΥ | 45 | 90 |
| ΦΩΤΟΚΥΤΤΑΡΑ | 30 | 50 |
| BLIDOOR | 15 | 30 |
| ΔΙΑΚΟΠΤΗΣ | 12 | 20 |
| ΚΛΕΙΔΑΡΙΕΣ | 11 | 40 |
| ΚΑΠΑΚΙΑ ΚΟΥΤΙΟΥ | 8 | 12 |

All calculated per item.

---

# PAINT COSTS

IMPORTANT:
If ΒΑΦΗ is enabled:

Add additional paint costs and sale prices.

| Material | Sell | Cost |
|---|---|---|
| ΚΟΥΡΤΙΝΑ | 14 | 10 |
| ΟΔΗΓΟΙ | 3.5 | 2 |
| ΚΟΥΤΙ Π | 13.5 | 9 |
| ΚΟΥΤΙ Γ | 9 | 6 |
| ΤΑΜΠΛΑΣ | 4.5 | 3 |

Paint calculations:

- Curtain paint uses square meters
- Guides paint uses height × 2
- Box paint uses width
- Tamplas paint uses width

---

# CALCULATION ENGINE

Create a dedicated pricing service.

## DIMENSION CONVERSIONS

Convert:

cm → meters

Examples:

300 cm = 3 meters
250 cm = 2.5 meters

---

# CORE FORMULAS

## AREA

area = widthMeters × heightMeters

---

## ROLLER TYPE CALCULATION

Roller Cost:

area × (curtainCost + shaftCost)

Roller Sell:

area × (curtainSell + shaftSell)

---

## GUIDES CALCULATION

heightMeters × guidePrice × 2

---

## STRANTZA CALCULATION

heightMeters × strantzaPrice × 2

---

## BOX CALCULATION

widthMeters × boxPrice

---

## TAMPLAS CALCULATION

widthMeters × tamplasPrice

---

## FINAL TOTALS

Final Total Cost:

Sum of:
- roller cost
- guide cost
- box cost
- tamplas cost
- strantza cost
- motor cost
- accessories cost
- paint cost
- installation cost

Final Total Sell Price:

Sum of:
- roller sell
- guide sell
- box sell
- tamplas sell
- strantza sell
- motor sell
- accessories sell
- paint sell
- installation sell

---

# QUOTATION RESULTS PANEL

After calculation display:

- Total Cost
- Total Sell Price
- Profit Amount
- Profit Percentage

Use professional summary cards.

Profit Formula:

profit = sellPrice - cost

profitMargin = (profit / sellPrice) × 100

---

# PRINTABLE QUOTATION

Create printable quotation output.

The printable quotation should contain:

- Company logo placeholder
- Company information
- Customer information
- Date
- Full item breakdown
- Final total price
- Notes section
- Signature section

Must support:
- Print
- Export PDF

The printable version should look clean and professional.

---

# MATERIAL MANAGEMENT PAGE

This is VERY IMPORTANT.

Create a dedicated admin page where all pricing can be edited.

The user must be able to:

- Edit all costs
- Edit all sale prices
- Add new materials later
- Delete materials
- Update paint pricing

Use editable tables.

Changes should save instantly to database.

---

# VALIDATION RULES

- Width must be greater than 0
- Height must be greater than 0
- Installation cost cannot be negative
- Numeric fields must only accept numbers

Show friendly Greek validation messages.

---

# LANGUAGE

The ENTIRE application UI must be in Greek.

Examples:

Dashboard → Πίνακας Ελέγχου
New Quote → Νέα Προσφορά
Save → Αποθήκευση
Print → Εκτύπωση

All labels, buttons, tables, and messages must be Greek.

---

# CODE STRUCTURE

Use clean architecture.

Recommended folders:

/app
/components
/components/forms
/components/ui
/lib
/lib/calculations
/lib/database
/lib/utils
/prisma
/types

---

# CALCULATION SERVICE REQUIREMENTS

Create:

/lib/calculations/quotationCalculator.ts

This file should:
- Contain all business logic
- Be reusable
- Be fully typed
- Be separated from UI

---

# IMPORTANT UX REQUIREMENTS

1. Form should auto-calculate totals live
2. Totals should update instantly
3. Use loading states
4. Use toast notifications
5. Prevent accidental form reset
6. Use confirmation dialogs before deleting
7. Support dark mode later

---

# SHADCN COMPONENTS TO USE

Use:

- Card
- Button
- Input
- Select
- Switch
- Table
- Dialog
- Tabs
- Sheet
- Tooltip
- Separator
- Badge

---

# ADDITIONAL FEATURES

If possible also include:

- Search saved quotations
- Duplicate quotation
- Notes field
- Customer database
- Recent quotations dashboard

---

# RESPONSIVENESS

Desktop-first.

Tablet support required.

Mobile support basic only.

---

# WHAT TO BUILD FIRST

Build in this order:

1. Database schema
2. Material pricing management
3. Calculation engine
4. Quotation form
5. Live totals
6. Save quotations
7. Printable quotations
8. Polish UI

---

# FINAL IMPORTANT RULES

- Use TypeScript everywhere
- Avoid using 'any'
- Keep components modular
- Keep business logic separated from UI
- Use reusable calculation utilities
- Use proper currency formatting (€)
- Use Greek labels everywhere
- Add comments explaining important calculation logic
- Make the UI look production-ready

---

# STARTING TASK FOR CODEX

First:
1. Initialize the Next.js project
2. Install all dependencies
3. Configure Tailwind
4. Configure shadcn/ui
5. Create Prisma schema
6. Seed all initial material pricing data
7. Create main application layout
8. Create quotation form UI
9. Create calculation engine
10. Connect live calculations to UI

Then continue feature-by-feature until the application is complete.

Do not skip steps.

Always keep the application production-quality.

