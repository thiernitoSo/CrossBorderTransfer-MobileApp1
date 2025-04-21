
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isVerified: boolean;
  createdAt: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}
  