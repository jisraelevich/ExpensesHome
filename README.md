# Expenses 2026 - Personal Finance Manager

A modern, responsive expense management app for tracking monthly finances with support for multiple currencies (ARS/USD), credit cards, investments, services, debts, and more.

## Features

✅ **7 Main Modules:**
- 💳 **Credit Cards** - Track payments by bank, close date, due date, amounts in ARS/USD
- 📈 **Investments/Insurance** - Track investments, insurance policies by broker with payment progress
- 🚗 **Car Savings** - Monthly car fund contributions
- 💵 **Dollar Rates** - Track USD/ARS exchange rates with MEP corrections
- 🧾 **Services/Bills** - Electricity, gas, phone, internet, taxes, etc.
- 📝 **Debts** - Track debts with flexible payment schedules (0=ongoing, 1=one-time, n=specific months)
- 💰 **Expenses** - Manual entries with status workflow (done/now/later)

✅ **Mobile-First Design** - Works on phones, tablets, and desktops
✅ **Localization** - Spanish/English UI with Argentina locale support (formatting, currency)
✅ **JSON Storage** - All data stored locally, export/import ready, scalable to database
✅ **Google Auth Ready** - Authentication hook prepared for integration
✅ **Excel-like Experience** - Familiar UI for users transitioning from Excel

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Storage:** LocalStorage (IndexedDB-ready for future scaling)
- **Styling:** Mobile-first responsive CSS
- **i18n:** Custom translation system (English/Spanish)
- **Localization:** Locale-specific formatting for dates, currency, numbers

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
```

## Data Structure

### Storage Format

All dates stored as **YYYY-MM-DD** (English format)
All numbers stored with **dot separator** (1500.50, not 1.500,50)
All UI translatable via i18n service

### Display Format (Argentina - es-AR)

- Dates: **DD/MM/YYYY** (e.g., "20/09/2026")
- Currency: **$ symbol with comma separator** (e.g., "$1.500,50 ARS")
- Numbers: **dot for thousands, comma for decimals** (e.g., "1.234,56")

### Example Record

```typescript
// Stored (Always English format)
{
  id: "1695206400000_abc123def",
  month: "2026-09",
  amountPesos: 1500.50,
  amountDollars: 7.25,
  isPaid: false,
  paidDate: "2026-09-20",
  createdAt: "2026-09-20T10:30:00Z"
}

// Displayed (Argentina locale)
Mes: 09/2026
Cantidad: $1.500,50
En Dólares: $7,25
Pagado: No
Fecha de Pago: 20/09/2026
```

## API Services

### DataService
- `loadAllData()` - Load all data
- `loadTable(tableName)` - Load specific table
- `addToTable(tableName, item)` - Add item
- `updateInTable(tableName, id, updates)` - Update item
- `deleteFromTable(tableName, id)` - Delete item
- `getByMonth(tableName, month)` - Query by month
- `exportToJSON()` - Export all data
- `importFromJSON(jsonString)` - Import data

### LocaleService
- `setLocale(locale)` - Change locale
- `formatCurrency(amount, currency)` - Format money
- `formatDate(dateString)` - Format date
- `parseDate(dateString)` - Parse date from display format to storage
- `parseNumber(valueString)` - Parse number from display format to storage

### i18nService
- `t(key, defaultValue)` - Translate key
- `setLocale(locale)` - Change language
- `getLocale()` - Get current language

## Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components (Dashboard, CreditCards, etc.)
├── services/       # DataService, LocaleService, i18n
├── types/          # TypeScript interfaces
├── hooks/          # Custom React hooks
├── utils/          # Helper functions
├── styles/         # Global CSS
├── App.tsx         # Main app component
└── main.tsx        # Entry point

public/            # Static assets
```

## Hooks

### `useAppData()`
Loads all application data

```typescript
const { data, loading, error, refreshData } = useAppData();
```

### `useTable<T>(tableName)`
Manages a specific table

```typescript
const { items, loading, error, addItem, updateItem, deleteItem, refresh } = useTable<CreditCard>('creditCards');
```

### `useCurrentMonth()`
Gets current month in YYYY-MM format

```typescript
const { month, setMonth } = useCurrentMonth();
```

## Utilities

### `helpers.ts`
- `generateId()` - Create unique IDs
- `getCurrentDate()` - Get today's date
- `formatCurrency()` - Format money
- `formatDate()` - Format date for display
- `pesosToDollars()` / `dollarsToPesos()` - Convert currencies
- `exportToCSV()` - Export data as CSV
- `downloadFile()` - Download any file

## Future Enhancements

- [ ] Google Auth integration
- [ ] Supabase/Firebase backend
- [ ] PDF export (with charts)
- [ ] Excel export with formatting
- [ ] Push notifications for due dates
- [ ] Recurring expenses
- [ ] Budget alerts
- [ ] Charts & analytics
- [ ] Search & filtering
- [ ] Backup to cloud

## Database Schema (Ready for Migration)

When migrating to a backend database, the structure maps directly:

```sql
-- Credit Cards
CREATE TABLE credit_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  bank_name TEXT,
  card_type TEXT,
  month TEXT,
  amount_pesos DECIMAL,
  amount_dollars DECIMAL,
  is_paid BOOLEAN,
  ...
);

-- Similar tables for: investments, car_savings, dollar_rates, services, debts, expenses
```

## Contributing

1. Keep all internal data in English format (dates as YYYY-MM-DD)
2. Use LocaleService for all display formatting
3. Use i18nService for all UI text
4. Mobile-first CSS design
5. Maintain data types in `/src/types/index.ts`

## License

MIT

---

**Built with ❤️ for personal finance management**
