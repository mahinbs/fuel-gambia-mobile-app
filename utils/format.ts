export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GM', {
    style: 'currency',
    currency: 'GMD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-GM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-GM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const formatPhoneNumber = (phone: string): string => {
  if (phone.startsWith('+220')) {
    return phone.replace(/(\+220)(\d{3})(\d{4})/, '$1 $2 $3');
  }
  return phone;
};
