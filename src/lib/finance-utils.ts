export const normalizeToMonthly = (amount: number | string, frequency: string): number => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  switch (frequency) {
    case 'weekly':
      return numAmount * 4;
    case 'bi-weekly':
      return numAmount * 2;
    case 'monthly':
      return numAmount;
    case 'one-time':
      return 0; // One-time payments don't contribute to recurring monthly income
    default:
      return numAmount;
  }
};

export const getIncomeForMonth = (incomes: any[], month: number, year: number): number => {
  let total = 0;
  
  incomes.forEach(income => {
    // Add recurring income (normalized to monthly)
    if (income.is_recurring !== false) {
      total += normalizeToMonthly(income.amount, income.frequency);
    }
    // Add one-time payments for the specific month
    else if (income.payment_date) {
      const paymentDate = new Date(income.payment_date);
      if (paymentDate.getMonth() === month && paymentDate.getFullYear() === year) {
        total += Number(income.amount);
      }
    }
  });
  
  return total;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const getMonthDateRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0],
  };
};

export const roundUp = (amount: number): number => {
  return Math.ceil(amount);
};