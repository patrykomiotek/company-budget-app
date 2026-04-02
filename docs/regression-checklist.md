# Manual Regression Test Checklist

Prioritized checklist covering all app functionality. Run before releases.

---

## P0 — Critical (must pass before any release)

### Authentication

- [ ] Sign in with valid credentials → redirects to `/dashboard`
- [ ] Sign in with wrong password → shows Polish error message
- [ ] Sign up with new account → creates account, redirects to `/dashboard`
- [ ] Unauthenticated access to `/dashboard` → redirects to `/sign-in`
- [ ] Logout → clears session, redirects to `/sign-in`

### Company / Workspace Context

- [ ] Sidebar company switcher lists all companies (Anna PRO, Web Amigos)
- [ ] Switching company filters transactions, dashboard, and entity lists
- [ ] "Wszystko" shows data across all companies
- [ ] Active company persists after page refresh (cookie-based)
- [ ] Transaction form shows "Oddział" dropdown when no active company selected

### Dashboard

- [ ] Month navigation (← Poprzedni / Następny →) updates data and URL params
- [ ] Przychody (green), Wydatki (red), Bilans cards show correct totals
- [ ] Bilans = Przychody − Wydatki (verify math)
- [ ] Forecast cards appear when forecast transactions exist for the month
- [ ] Category breakdown sorted by amount, progress bars proportional
- [ ] Subcategories indented under parent categories
- [ ] All amounts formatted with "zł" and two decimals

### Transaction Creation

- [ ] Navigate to `/transactions/new`, verify four type buttons render
- [ ] Create EXPENSE: select type → category → subcategory → amount → merchant → submit
- [ ] Create INCOME: select type → category → subcategory → amount → customer → submit
- [ ] Create FORECAST_EXPENSE and FORECAST_INCOME similarly
- [ ] Success toast "Transakcja dodana" appears, form resets
- [ ] Category dropdown filters by transaction type (EXPENSE→expense cats, INCOME→income cats)
- [ ] Changing type resets category and subcategory selections
- [ ] Submit button disabled until subcategory selected
- [ ] Amount validation: rejects 0 and negative values ("Kwota musi być większa od 0")

### Transaction List & Table

- [ ] `/transactions` shows paginated table with columns: Typ, Data, Kategoria, Kontrahent, Osoba, Opis, Nr faktury, Kwota
- [ ] Type badges: green "Przychód", red "Wydatek", outline "Prognoza +/−"
- [ ] Income amounts green with +, expense amounts red with −
- [ ] Click row → navigates to `/transactions/[id]` details page
- [ ] Edit (pencil icon) opens edit dialog pre-filled with data
- [ ] Delete (trash icon) shows confirmation → removes transaction on confirm

### Transaction Edit

- [ ] Edit dialog pre-fills all fields correctly
- [ ] Modify amount, category, merchant/customer → save → toast "Transakcja zaktualizowana"
- [ ] Table refreshes with updated data after dialog closes

### Transaction Details Page

- [ ] Back link "← Transakcje" navigates to list
- [ ] Large amount display with correct sign, currency, and type badge
- [ ] "Informacje" card: date, category/subcategory, company, description, created date
- [ ] "Kontrahent" card: customer (income) or merchant (expense), employee if assigned
- [ ] "Faktura" card: invoice number and due date (if present)
- [ ] "Pozycje faktury" card: line items table with totals (if present)

---

## P1 — High (important functionality)

### Multi-Currency

- [ ] Select EUR or USD → "Kurs do PLN" exchange rate field appears
- [ ] PLN selected → exchange rate field hidden
- [ ] Submit non-PLN without exchange rate → error "Podaj kurs wymiany dla waluty obcej"
- [ ] Transaction list shows "≈ [PLN amount] PLN" as second line for foreign amounts
- [ ] Transaction details page shows exchange rate info

### Filters (Transactions Page)

- [ ] Type filter: Wszystko, Wydatki, Przychody, Prognozy wydatków, Prognozy przychodów
- [ ] Category filter updates options based on selected type
- [ ] Date range "Od" / "Do" filters work independently and together
- [ ] "Wyczyść filtry" resets all filters and URL params
- [ ] Pagination works with filters applied
- [ ] Filters persist across pagination changes

### Customers CRUD

- [ ] `/customers` lists customers with columns: Nazwa, NIP, Miasto, Email, Transakcje
- [ ] "+ Dodaj" opens dialog → fill Nazwa firmy (required) → create → toast + table refresh
- [ ] Edit navigates to `/customers/[id]/edit` with pre-filled form
- [ ] Delete shows confirmation → removes customer
- [ ] Customer with transactions: delete detaches but doesn't break transactions

### Merchants CRUD

- [ ] `/merchants` lists merchants with avatar, Nazwa, NIP, Transakcje count
- [ ] "+ Dodaj" opens dialog → fill Nazwa (required) → create → toast + table refresh
- [ ] Edit navigates to `/merchants/[id]/edit` with pre-filled form
- [ ] Delete shows confirmation → removes merchant

### Employees CRUD

- [ ] `/employees` lists employees with Imię i nazwisko, Firma (badge), Transakcje count
- [ ] "+ Dodaj" opens dialog → fill name + company (required) → create
- [ ] Company defaults to first available company
- [ ] Edit navigates to `/employees/[id]/edit`
- [ ] Delete shows confirmation → removes employee

### Categories CRUD

- [ ] `/categories` lists categories with Nazwa, Typ badge, Podkategorie
- [ ] "+ Nowa kategoria" navigates to `/categories/new`
- [ ] Create: select type (INCOME/EXPENSE) → name → add subcategories → submit
- [ ] Edit: `/categories/[id]/edit` → type dropdown disabled → modify name/subcategories → submit
- [ ] Subcategories can be added/removed with +/trash buttons

### Invoice Fields (Transaction Form)

- [ ] Expand "Faktura (opcjonalnie)" section
- [ ] Enter Nr faktury and Termin płatności
- [ ] Data persists in edit dialog
- [ ] Invoice number visible in transactions table column

### Line Items (Transaction Form)

- [ ] Expand "Pozycje faktury (opcjonalnie)" section
- [ ] "+ Dodaj pozycję" adds a row with: Produkt, Ilość, Cena jedn., VAT %, Netto, Brutto
- [ ] Product combobox shows suggestions
- [ ] Netto auto-calculates: quantity × unit price
- [ ] Brutto auto-calculates: netto × (1 + VAT/100)
- [ ] Total netto/brutto displayed at bottom
- [ ] Delete line item removes row and updates totals
- [ ] Multiple line items calculate correctly

### Inline Entity Creation

- [ ] Merchant combobox: type new name → "Dodaj: [name]" option → creates merchant inline
- [ ] Customer combobox: type new name → "Dodaj: [name]" option → creates customer inline
- [ ] "+ Dodaj kategorię" button in form opens quick-create dialog → category available immediately

---

## P2 — Medium (secondary flows)

### Subscriptions

- [ ] "Dodaj subskrypcję" button in transaction form opens dialog
- [ ] Fill: tool name, company, currency, amount, start month, period (1/3/6/12 months)
- [ ] Preview text shows transaction count
- [ ] Submit creates multiple EXPENSE transactions in "Narzędzia i subskrypcje" category
- [ ] Toast shows "Utworzono X transakcji..."
- [ ] Subscription with EUR: exchange rate field required and used
- [ ] Company field required when no active company

### Fakturownia Integration

- [ ] "Importuj z Fakturowni" button opens invoice picker dialog
- [ ] Date range filter + "Filtruj" loads invoices
- [ ] Select invoice → "Importuj" populates form: type=INCOME, amount, currency, date, customer, invoice number, line items
- [ ] Already-imported invoice shows warning dialog
- [ ] Toast confirms import with invoice number

### Dashboard — Forecast Detail

- [ ] Forecast income/expense cards show dashed borders and muted colors
- [ ] Prognozowany bilans = (actual income + forecast income) − (actual expense + forecast expense)
- [ ] Months with no forecast data hide forecast cards

### Customer Advanced Fields

- [ ] Nazwa wyświetlana (displayName) shown in lists if set
- [ ] NIP, Email, Telefon, Miasto, Ulica, Kod pocztowy all save and display
- [ ] Notatki (textarea) saves multiline text

### Data Integrity

- [ ] Deleting customer/merchant/employee doesn't break existing transactions
- [ ] Category type cannot be changed after creation (dropdown disabled)
- [ ] Changing category in form resets subcategory selection
- [ ] Every transaction requires a subcategory (not just category)

---

## P3 — Low (edge cases, polish)

### Sidebar Navigation

- [ ] All nav items render: Dashboard, Transakcje, Dodaj, Kategorie, Klienci, Sprzedawcy, Współpracownicy, Konto
- [ ] Active page link highlighted
- [ ] Sidebar collapse/expand works; icons remain visible in collapsed state
- [ ] Company selector shows as icon button when collapsed

### Empty States

- [ ] Transactions: "Brak transakcji w wybranym okresie"
- [ ] Categories: "Brak kategorii"
- [ ] Customers: inline creation hint
- [ ] Merchants/Employees: appropriate empty message

### Form UX

- [ ] Submit buttons show loading text ("Dodawanie...", "Zapisanie...")
- [ ] Buttons disabled during submission (no double-submit)
- [ ] Cancel/Anuluj navigates back without saving
- [ ] Toast notifications auto-dismiss
- [ ] Edit dialog scrollable for long content (max-h-[90vh])

### Decimal & Number Precision

- [ ] Amount: step 0.01, min 0.01
- [ ] Line item quantity: step 0.001
- [ ] Line item unit price: step 0.01
- [ ] VAT rate: 0–100, integers
- [ ] No floating-point errors in netto/brutto calculations

### Special Characters & Polish Text

- [ ] Polish diacritics (ąćęłńóśźż) display correctly in all fields
- [ ] Long names truncate in table views, show full in detail views
- [ ] All user-facing labels, errors, and messages in Polish

### Pagination

- [ ] Page buttons render when data exceeds page size
- [ ] Current page highlighted
- [ ] Navigating pages preserves active filters

### Date Handling

- [ ] Date picker works on first/last day of month
- [ ] Dashboard month navigation handles year transitions (Dec → Jan)
- [ ] Transaction date displays in Polish locale format ("24 mar 2026")

### Keyboard & Accessibility

- [ ] Tab order logical through form fields
- [ ] Enter submits forms
- [ ] Escape closes dialogs
- [ ] Form fields have associated labels
- [ ] Required fields visually indicated

### Browser & Responsive

- [ ] Chrome, Firefox, Safari, Edge (latest desktop)
- [ ] Mobile: cards stack, table scrolls horizontally, forms usable
- [ ] Dialogs scrollable on small screens
