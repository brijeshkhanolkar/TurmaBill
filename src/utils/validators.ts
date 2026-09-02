import { Awak, Farmer, Buyer } from '../types';

export function validateRequired(value: any, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validatePositive(value: number, fieldName: string): string | null {
  if (isNaN(value) || value <= 0) {
    return `${fieldName} must be a positive number`;
  }
  return null;
}

export function validateMobile(value: string): string | null {
  if (!value) return null;
  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(value)) {
    return 'Invalid mobile number';
  }
  return null;
}

export function validateGSTIN(value: string): string | null {
  if (!value) return null;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(value)) {
    return 'Invalid GSTIN';
  }
  return null;
}

export function validatePAN(value: string): string | null {
  if (!value) return null;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(value)) {
    return 'Invalid PAN number';
  }
  return null;
}

export function validateAwakEntry(awak: Partial<Awak>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!awak.farmerId) errors.farmerId = 'Farmer is required';
  if (!awak.buyerId) errors.buyerId = 'Buyer is required';
  if (!awak.awakDate) errors.awakDate = 'Date is required';
  
  if (!awak.items || awak.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    awak.items.forEach((item, index) => {
      if (item.bags <= 0) errors[`items.${index}.bags`] = 'Bags must be positive';
      if (item.weightKg <= 0) errors[`items.${index}.weightKg`] = 'Weight must be positive';
      if (item.ratePerQuintal <= 0) errors[`items.${index}.ratePerQuintal`] = 'Rate must be positive';
    });
  }

  return errors;
}

export function validateFarmer(farmer: Partial<Farmer>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!farmer.name) errors.name = 'Name is required';
  if (!farmer.village) errors.village = 'Village is required';
  if (farmer.mobile) {
    const mobileError = validateMobile(farmer.mobile);
    if (mobileError) errors.mobile = mobileError;
  }
  if (farmer.pan) {
    const panError = validatePAN(farmer.pan);
    if (panError) errors.pan = panError;
  }

  return errors;
}

export function validateBuyer(buyer: Partial<Buyer>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (!buyer.name) errors.name = 'Name is required';
  if (!buyer.city) errors.city = 'City is required';
  if (buyer.mobile) {
    const mobileError = validateMobile(buyer.mobile);
    if (mobileError) errors.mobile = mobileError;
  }
  if (buyer.gstin) {
    const gstinError = validateGSTIN(buyer.gstin);
    if (gstinError) errors.gstin = gstinError;
  }
  if (buyer.pan) {
    const panError = validatePAN(buyer.pan);
    if (panError) errors.pan = panError;
  }

  return errors;
}
