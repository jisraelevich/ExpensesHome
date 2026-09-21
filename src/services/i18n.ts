/**
 * Internationalization (i18n) Service
 * Manages all UI text translations
 * Storage always in English, UI translated based on locale
 */

export type Locale = 'en' | 'es';

interface Translations {
  [key: string]: string | { [key: string]: string };
}

const EN: Translations = {
  app: {
    title: 'Expense Home',
    subtitle: 'Monthly Finance Manager',
  },
  nav: {
    dashboard: 'Dashboard',
    creditCards: 'Credit Cards',
    investments: 'Investments',
    carSavings: 'Car Savings',
    dollarRates: 'Dollar Rates',
    services: 'Services',
    debts: 'Debts',
    expenses: 'Expenses',
    reports: 'Reports',
  },
  buttons: {
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    export: 'Export',
    import: 'Import',
    submit: 'Submit',
    refresh: 'Refresh',
  },
  labels: {
    month: 'Month',
    year: 'Year',
    date: 'Date',
    amount: 'Amount',
    description: 'Description',
    status: 'Status',
    notes: 'Notes',
    bankName: 'Bank Name',
    cardType: 'Card Type',
    closeDate: 'Close Date',
    dueDate: 'Due Date',
    isPaid: 'Is Paid',
    paidDate: 'Paid Date',
  },
  messages: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    noData: 'No data available',
    confirmDelete: 'Are you sure you want to delete this item?',
  },
};

const ES: Translations = {
  app: {
    title: 'Gastos 2026',
    subtitle: 'Gestor de Finanzas Mensuales',
  },
  nav: {
    dashboard: 'Panel',
    creditCards: 'Tarjetas de Crédito',
    investments: 'Inversiones',
    carSavings: 'Fondo Auto',
    dollarRates: 'Cotización USD',
    services: 'Servicios',
    debts: 'Deudas',
    expenses: 'Gastos',
    reports: 'Reportes',
  },
  buttons: {
    add: 'Agregar',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    export: 'Exportar',
    import: 'Importar',
    submit: 'Enviar',
    refresh: 'Actualizar',
  },
  labels: {
    month: 'Mes',
    year: 'Año',
    date: 'Fecha',
    amount: 'Cantidad',
    description: 'Descripción',
    status: 'Estado',
    notes: 'Notas',
    bankName: 'Nombre del Banco',
    cardType: 'Tipo de Tarjeta',
    closeDate: 'Fecha de Cierre',
    dueDate: 'Fecha de Vencimiento',
    isPaid: 'Pagado',
    paidDate: 'Fecha de Pago',
  },
  messages: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    noData: 'Sin datos disponibles',
    confirmDelete: '¿Está seguro de que desea eliminar este elemento?',
  },
};

class I18nService {
  private locale: Locale = 'en';
  private translations: Record<Locale, Translations> = { en: EN, es: ES };

  /**
   * Set locale
   */
  public setLocale(locale: Locale): void {
    this.locale = locale;
    localStorage.setItem('locale', locale);
  }

  /**
   * Get current locale
   */
  public getLocale(): Locale {
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored) {
      this.locale = stored;
    }
    return this.locale;
  }

  /**
   * Translate key
   */
  public t(key: string, defaultValue?: string): string {
    const keys = key.split('.');
    let value: any = this.translations[this.locale];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || defaultValue || key;
  }

  /**
   * Get all translations for current locale
   */
  public getTranslations(): Translations {
    return this.translations[this.locale];
  }

  /**
   * Add custom translations
   */
  public addTranslations(locale: Locale, translations: Translations): void {
    this.translations[locale] = {
      ...this.translations[locale],
      ...translations,
    };
  }
}

export default new I18nService();
