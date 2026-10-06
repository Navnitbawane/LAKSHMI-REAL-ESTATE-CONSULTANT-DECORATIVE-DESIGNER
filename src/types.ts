export interface Property {
  id: string;
  title: string;
  type: 'Flat' | 'Plot' | 'Villa' | 'Commercial';
  purpose: 'Buy' | 'Rent';
  price: number; // in Lakhs
  location: string;
  area: string; // e.g. "1,050 sq. ft." or "2,400 sq. ft."
  bhk?: string; // e.g. "2 BHK" or "3 BHK" (applicable to Flats/Villas)
  description: string;
  image: string;
  status: 'Active' | 'Sold' | 'Rented';
  features: string[];
  documents: string; // e.g. "RERA Registered", "7/12 Extract Clear", "Ready Possession"
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyTitle?: string;
  message: string;
  date: string;
  type: 'Callback' | 'SiteVisit' | 'General';
  status: 'New' | 'Contacted' | 'Closed';
  preferredDate?: string;
}
