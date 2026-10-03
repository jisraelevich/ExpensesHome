# Expenses 2026 - Supabase Migration Plan

**Last Updated:** 2026-10-03  
**Status:** Ready for next month (when budget available)  
**Target:** PostgreSQL via Supabase  

---

## 1. Database Schema

### 1.1 Users Table (Supabase Auth)
```sql
-- Managed by Supabase Auth (do not create manually)
-- Required fields:
- id (UUID) - Primary key
- email (TEXT) - Unique
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 1.2 Household Table (New - for multi-user sharing)
```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Users in a household (many-to-many)
CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(household_id, user_id)
);
```

### 1.3 Credit Cards Table
```sql
CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  card_type TEXT CHECK (card_type IN ('visa', 'mastercard', 'amex', 'other')),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_credit_cards_household ON credit_cards(household_id);
```

### 1.4 Credit Cards Monthly Table
```sql
CREATE TABLE credit_cards_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- 'YYYY-MM'
  amount_pesos DECIMAL(12,2),
  amount_dollars DECIMAL(12,2),
  close_day SMALLINT,
  due_day SMALLINT,
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(credit_card_id, month)
);

CREATE INDEX idx_cc_monthly_month ON credit_cards_monthly(month);
```

### 1.5 Investments Table
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  broker TEXT,
  type TEXT CHECK (type IN ('insurance-life', 'insurance-other', 'investment', 
                           'retirement', 'payment-plan', 'car', 'other')),
  currency TEXT CHECK (currency IN ('ARS', 'USD')),
  total_payments INTEGER,
  start_month TEXT, -- 'YYYY-MM'
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_investments_household ON investments(household_id);
```

### 1.6 Investments Monthly Table
```sql
CREATE TABLE investments_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- 'YYYY-MM'
  current_payment_number INTEGER,
  amount_per_payment DECIMAL(12,2),
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  comment TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(investment_id, month)
);

CREATE INDEX idx_inv_monthly_month ON investments_monthly(month);
```

### 1.7 Dollar Rates Table
```sql
CREATE TABLE dollar_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  date DATE NOT NULL UNIQUE,
  mep_value DECIMAL(10,4),
  correction_value DECIMAL(10,4),
  real_value DECIMAL(10,4),
  source TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_dollar_rates_date ON dollar_rates(date);
```

### 1.8 Service Bases Table (Admin - Recurring definitions)
```sql
CREATE TABLE service_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('electricity', 'gas', 'phone', 'water', 
                           'internet', 'taxes', 'other')),
  description TEXT NOT NULL,
  payment_url TEXT,
  start_month TEXT, -- 'YYYY-MM'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_service_bases_household ON service_bases(household_id);
```

### 1.9 Services Table (Monthly instances)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  service_base_id UUID REFERENCES service_bases(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('electricity', 'gas', 'phone', 'water', 
                           'internet', 'taxes', 'other')),
  description TEXT NOT NULL,
  due_day SMALLINT,
  due_date DATE,
  amount_pesos DECIMAL(12,2),
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  month TEXT NOT NULL, -- 'YYYY-MM'
  payment_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_services_household ON services(household_id);
CREATE INDEX idx_services_month ON services(month);
CREATE INDEX idx_services_base ON services(service_base_id);
```

### 1.10 Debts Table (Base)
```sql
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_expense BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_debts_household ON debts(household_id);
```

### 1.11 Debt Sub-payments Table (Invoice line items)
```sql
CREATE TABLE debt_subpayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  start_date DATE,
  amount_ars DECIMAL(12,2),
  amount_usd DECIMAL(12,2),
  total_payments INTEGER, -- 0=unlimited, >0=specific months
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_debt_sub_debt ON debt_subpayments(debt_id);
```

### 1.12 Debts Monthly Table
```sql
CREATE TABLE debts_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- 'YYYY-MM'
  subpayments JSONB, -- Array of {subpaymentId, description, amountARS, amountUSD, isPaid, paidDate}
  is_paid BOOLEAN DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(debt_id, month)
);

CREATE INDEX idx_debts_monthly_month ON debts_monthly(month);
```

### 1.13 Expenses Table
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_pesos DECIMAL(12,2),
  amount_dollars DECIMAL(12,2),
  status TEXT CHECK (status IN ('done', 'now', 'later')),
  month TEXT NOT NULL, -- 'YYYY-MM'
  from_credit_card BOOLEAN DEFAULT false,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  category TEXT,
  notes TEXT,
  is_from_rule BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_expenses_household ON expenses(household_id);
CREATE INDEX idx_expenses_month ON expenses(month);
```

### 1.14 Config Table
```sql
CREATE TABLE app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'ARS',
  locale TEXT DEFAULT 'es',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 2. Row-Level Security (RLS) Policies

### 2.1 Credit Cards - Users see household data only
```sql
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household credit cards"
ON credit_cards FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert/update own household data"
ON credit_cards FOR INSERT, UPDATE
WITH CHECK (
  household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid()
  )
);
```

### 2.2 Apply Similar Policies to All Tables
```sql
-- All tables with household_id should have similar RLS policies
-- Pattern:
-- 1. Enable RLS
-- 2. SELECT - check household_id membership
-- 3. INSERT/UPDATE - check household_id membership
-- 4. DELETE - check household_id membership
```

---

## 3. Data Types Mapping

| TypeScript | PostgreSQL | Notes |
|-----------|-----------|-------|
| `string` (UUID) | `UUID` | Primary keys, foreign keys |
| `string` (generic) | `TEXT` | Names, descriptions, notes |
| `string` ('YYYY-MM') | `TEXT` | Month format stored as string |
| `string` ('YYYY-MM-DD') | `DATE` | Date format |
| `number` (amount) | `DECIMAL(12,2)` | Currency amounts |
| `number` (count) | `INTEGER` | Payment numbers, days |
| `boolean` | `BOOLEAN` | Flags like isPaid, isActive |
| `array` (objects) | `JSONB` | For complex nested data (debtsMonthly) |
| `Date` object | `TIMESTAMP` | Auto-managed by Supabase |

---

## 4. Migration Steps

### Phase 1: Setup (Week 1)
```bash
# 1. Create Supabase project
# 2. Create all tables (SQL above)
# 3. Set up Google OAuth
# 4. Enable RLS policies
# 5. Create backup of current localStorage data
```

### Phase 2: Data Migration (Week 2)
```typescript
// Export localStorage as JSON
const localStorageData = localStorage.getItem('expenses_2026_all');
const jsonData = JSON.parse(localStorageData);
// Save to: backup_2026-10-03.json

// Create household and user
const household = await createHousehold('My Household');
const userId = auth.user.id;

// Bulk insert tables
await migrateTable('credit_cards', jsonData.creditCards);
await migrateTable('investments', jsonData.investments);
await migrateTable('debts', jsonData.debts);
// ... etc for all tables
```

### Phase 3: Testing (Week 3)
```bash
# 1. Verify all data migrated
# 2. Test Google auth login
# 3. Test real-time sync
# 4. Stress test with wife/roommate account
# 5. Verify RLS policies work
```

### Phase 4: Deployment (Week 4)
```bash
# 1. Update DataService to use Supabase
# 2. Deploy frontend to Vercel
# 3. Point domain to Vercel
# 4. Keep localStorage as fallback (optional)
# 5. Monitor for issues
```

---

## 5. Key Considerations for Next Month

### 5.1 User/Household Model
- **Current:** Single-user only (localStorage)
- **Future:** Multi-user households
- **Decision:** Keep all household data shared, or allow individual tracking?

### 5.2 Real-Time Sync
```typescript
// Subscribe to changes
supabase
  .channel('expenses')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'expenses' },
    (payload) => {
      console.log('💾 Data updated:', payload);
      refreshUI();
    }
  )
  .subscribe();
```

### 5.3 Offline Support
- Supabase has offline SDK (`supabase-js` v2+)
- Can queue changes locally, sync when online
- Need to decide: Full offline support or basic?

### 5.4 Backup Strategy
```bash
# Before any major changes:
npm run backup:prod
# Creates backup_2026-10-03T08-30-15.json

# Restore from backup:
npm run restore:prod --backup=2026-10-03T08-30-15
```

---

## 6. Environment Variables for Next Month

```bash
# .env.development (LOCAL)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_KEY=eyJhbGc...
VITE_ENV=development

# .env.production (VERCEL - Secret variables)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_KEY=eyJhbGc...
VITE_ENV=production
```

---

## 7. TypeScript Client Code Example

```typescript
// services/SupabaseService.ts (new file)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

export async function loadExpenses(month: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('month', month)
    .order('created_at', { ascending: false });
  
  return data;
}

export async function createExpense(expense: Expense) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .single();
  
  return data;
}

// Real-time subscription
export function subscribeToExpenses(month: string, callback: Function) {
  return supabase
    .channel(`expenses-${month}`)
    .on('postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'expenses',
        filter: `month=eq.${month}`
      },
      (payload) => callback(payload)
    )
    .subscribe();
}
```

---

## 8. Files to Create/Modify Next Month

| File | Action | Purpose |
|------|--------|---------|
| `src/services/SupabaseService.ts` | Create | Supabase client & queries |
| `src/services/AuthService.ts` | Modify | Add Google OAuth |
| `src/services/DataService.ts` | Refactor | Use Supabase instead localStorage |
| `.env.example` | Create | Document env variables |
| `docs/DEPLOYMENT.md` | Create | Deployment guide |
| `src/hooks/useSupabase.ts` | Create | Custom hooks for Supabase |
| `MIGRATION_SCRIPT.ts` | Create | One-time migration tool |

---

## 9. Cost Estimation

| Month | Users | Database | Storage | Cost |
|-------|-------|----------|---------|------|
| Oct 2026 | 1 | ~50 MB | ~50 MB | **FREE** |
| Nov 2026 | 1-2 | ~100 MB | ~100 MB | **FREE** |
| Dec 2026 | 2+ | ~150 MB | ~150 MB | **FREE** |
| Year 1 | 3-5 | ~200 MB | ~200 MB | **FREE** |

---

## 10. Testing Checklist for Next Month

- [ ] Local development works with Supabase
- [ ] Google auth login/logout works
- [ ] Data syncs in real-time between tabs
- [ ] Wife's account sees same household data
- [ ] Manual backup creates downloadable JSON
- [ ] Restore from backup works
- [ ] RLS policies prevent cross-household data access
- [ ] Mobile app works on phone
- [ ] Offline changes queue and sync online
- [ ] Build passes TypeScript compilation
- [ ] Deployment to Vercel successful
- [ ] Custom domain points correctly
- [ ] Performance acceptable (< 2s page load)

---

## Summary for Next Month

1. **Budget needed:** ~$5-10 (Supabase free tier covers you, but domain/extras)
2. **Time estimate:** 40-50 hours over 4 weeks
3. **Complexity:** Medium (not easy, but well-documented)
4. **Risk:** Low (keep JSON backup as fallback)
5. **Benefit:** Multi-user sync, mobile support, automatic backups

**You're ready to migrate!** This document has everything needed.

---

**Questions before migration?**
- Should debts allow individual tracking per person?
- How to handle expenses: shared or individual tracking?
- Want offline support?
- Budget for custom domain?
