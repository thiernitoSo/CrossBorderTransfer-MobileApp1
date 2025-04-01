import { get, post, put, del } from './api';

export interface Beneficiary {
  id: string;
  firstName: string;
  lastName: string;
  country: string;
  phoneNumber: string;
  relationship: string;
  paymentMethod: 'bank' | 'mobile_money' | 'cash_pickup';
  accountNumber?: string;
  bankName?: string;
  branchCode?: string;
  mobileMoneyProvider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBeneficiaryData {
  firstName: string;
  lastName: string;
  country: string;
  phoneNumber: string;
  relationship: string;
  paymentMethod: 'bank' | 'mobile_money' | 'cash_pickup';
  accountNumber?: string;
  bankName?: string;
  branchCode?: string;
  mobileMoneyProvider?: string;
}

export interface UpdateBeneficiaryData extends Partial<CreateBeneficiaryData> {}

/**
 * Get all beneficiaries for current user
 */
export const getBeneficiaries = async (): Promise<Beneficiary[]> => {
  try {
    return await get('/api/beneficiaries');
  } catch (error) {
    console.error('Failed to get beneficiaries:', error);
    throw error;
  }
};

/**
 * Get beneficiary by ID
 */
export const getBeneficiary = async (id: string): Promise<Beneficiary> => {
  try {
    return await get(`/api/beneficiaries/${id}`);
  } catch (error) {
    console.error(`Failed to get beneficiary ${id}:`, error);
    throw error;
  }
};

/**
 * Create new beneficiary
 */
export const createBeneficiary = async (
  data: CreateBeneficiaryData
): Promise<Beneficiary> => {
  try {
    return await post('/api/beneficiaries', data);
  } catch (error) {
    console.error('Failed to create beneficiary:', error);
    throw error;
  }
};

/**
 * Update existing beneficiary
 */
export const updateBeneficiary = async (
  id: string,
  data: UpdateBeneficiaryData
): Promise<Beneficiary> => {
  try {
    return await put(`/api/beneficiaries/${id}`, data);
  } catch (error) {
    console.error(`Failed to update beneficiary ${id}:`, error);
    throw error;
  }
};

/**
 * Delete beneficiary
 */
export const deleteBeneficiary = async (id: string): Promise<void> => {
  try {
    await del(`/api/beneficiaries/${id}`);
  } catch (error) {
    console.error(`Failed to delete beneficiary ${id}:`, error);
    throw error;
  }
};

/**
 * Get beneficiaries by country
 */
export const getBeneficiariesByCountry = async (
  countryCode: string
): Promise<Beneficiary[]> => {
  try {
    const allBeneficiaries = await getBeneficiaries();
    return allBeneficiaries.filter(
      (beneficiary) => beneficiary.country === countryCode
    );
  } catch (error) {
    console.error(`Failed to get beneficiaries for country ${countryCode}:`, error);
    throw error;
  }
};

export default {
  getBeneficiaries,
  getBeneficiary,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  getBeneficiariesByCountry,
};