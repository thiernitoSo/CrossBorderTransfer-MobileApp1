import apiService from './api';
import { getData, storeData, STORAGE_KEYS } from '../utils/storage';

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

/**
 * Get all beneficiaries for current user
 */
export const getBeneficiaries = async (): Promise<Beneficiary[]> => {
  try {
    const beneficiaries = await apiService.get<Beneficiary[]>('/beneficiaries');
    
    // Cache beneficiaries locally
    await storeData(STORAGE_KEYS.BENEFICIARIES, beneficiaries);
    
    return beneficiaries;
  } catch (error) {
    console.error('Get beneficiaries error:', error);
    
    // If API fails, try to get cached beneficiaries
    const cachedBeneficiaries = await getData<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES);
    if (cachedBeneficiaries) {
      return cachedBeneficiaries;
    }
    
    throw error;
  }
};

/**
 * Get beneficiary by ID
 */
export const getBeneficiary = async (id: string): Promise<Beneficiary> => {
  try {
    return await apiService.get<Beneficiary>(`/beneficiaries/${id}`);
  } catch (error) {
    console.error(`Get beneficiary ${id} error:`, error);
    
    // If API fails, try to get from cached beneficiaries
    const cachedBeneficiaries = await getData<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES);
    const cachedBeneficiary = cachedBeneficiaries?.find(b => b.id === id);
    
    if (cachedBeneficiary) {
      return cachedBeneficiary;
    }
    
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
    const newBeneficiary = await apiService.post<Beneficiary>('/beneficiaries', data);
    
    // Update local cache
    const cachedBeneficiaries = await getData<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES) || [];
    await storeData(STORAGE_KEYS.BENEFICIARIES, [...cachedBeneficiaries, newBeneficiary]);
    
    return newBeneficiary;
  } catch (error) {
    console.error('Create beneficiary error:', error);
    throw error;
  }
};

/**
 * Update existing beneficiary
 */
export const updateBeneficiary = async (
  id: string,
  data: Partial<CreateBeneficiaryData>
): Promise<Beneficiary> => {
  try {
    const updatedBeneficiary = await apiService.put<Beneficiary>(`/beneficiaries/${id}`, data);
    
    // Update local cache
    const cachedBeneficiaries = await getData<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES) || [];
    const updatedCache = cachedBeneficiaries.map(b => 
      b.id === id ? updatedBeneficiary : b
    );
    
    await storeData(STORAGE_KEYS.BENEFICIARIES, updatedCache);
    
    return updatedBeneficiary;
  } catch (error) {
    console.error(`Update beneficiary ${id} error:`, error);
    throw error;
  }
};

/**
 * Delete beneficiary
 */
export const deleteBeneficiary = async (id: string): Promise<void> => {
  try {
    await apiService.delete(`/beneficiaries/${id}`);
    
    // Update local cache
    const cachedBeneficiaries = await getData<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES) || [];
    const updatedCache = cachedBeneficiaries.filter(b => b.id !== id);
    
    await storeData(STORAGE_KEYS.BENEFICIARIES, updatedCache);
  } catch (error) {
    console.error(`Delete beneficiary ${id} error:`, error);
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
    const all = await getBeneficiaries();
    return all.filter(b => b.country === countryCode);
  } catch (error) {
    console.error(`Get beneficiaries for country ${countryCode} error:`, error);
    throw error;
  }
};

export const beneficiaryService = {
  getBeneficiaries,
  getBeneficiary,
  createBeneficiary,
  updateBeneficiary,
  deleteBeneficiary,
  getBeneficiariesByCountry,
};

export default beneficiaryService;
