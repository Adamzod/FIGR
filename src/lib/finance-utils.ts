export const normalizeToMonthly = (amount: number | string, frequency: string): number => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  switch (frequency) {
    case 'weekly':
      return numAmount * 4;
    case 'bi-weekly':
      return numAmount * 2;
    case 'monthly':
    default:
      return numAmount;
  }
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