import { Property } from './types';

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    title: 'Modern 2 BHK Designer Flat',
    type: 'Flat',
    purpose: 'Buy',
    price: 38, // 38 Lakhs
    location: 'Ghate Layout, Tukum, Chandrapur',
    area: '1,150 sq. ft.',
    bhk: '2 BHK',
    description: 'Beautifully designed 2 BHK apartment featuring bespoke wooden paneling, custom false ceilings, and premium decorative styling curated by Lakshmi Decorative Designers. Located in the highly sought-after Tukum area with excellent ventilation, high-speed lift, 24/7 security, and dedicated car parking.',
    image: '/src/assets/images/property_apartment_chandrapur_1791271406502.jpg',
    status: 'Active',
    features: ['Modular Kitchen', 'False Ceiling', 'Covered Parking', 'Borewell & Corporation Water', 'Vastu Compliant'],
    documents: 'RERA Registered & 100% Bank Loan Approved'
  },
  {
    id: 'prop-2',
    title: 'Premium Residential Plot',
    type: 'Plot',
    purpose: 'Buy',
    price: 45, // 45 Lakhs
    location: 'Nirman Nagar, Tukum, Chandrapur',
    area: '2,400 sq. ft.',
    description: 'Prime East-facing residential plot in a peaceful colony behind Maratha Library. Perfect for building your dream luxury villa with immediate construction permission. The layout is fully developed with black tar roads, underground drainage, and water/electricity connections already available at the boundary.',
    image: '/src/assets/images/property_villa_plot_1791271428205.jpg',
    status: 'Active',
    features: ['NA Layout Sanctioned', 'Water Connection Ready', 'Gated Community', '30 ft Wide Internal Roads', 'Near School & Market'],
    documents: 'Clear Title, 7/12 Extract Available, No Litigations'
  },
  {
    id: 'prop-3',
    title: 'Architectural 3 BHK Luxury Villa',
    type: 'Villa',
    purpose: 'Buy',
    price: 85, // 85 Lakhs
    location: 'Near Ghate Layout, Tukum, Chandrapur',
    area: '2,100 sq. ft.',
    bhk: '3 BHK',
    description: 'A spectacular independent villa showcasing a majestic exterior structure and breathtaking luxury interiors. Complete with decorative lighting, premium Indian marble flooring, solid teak doors, and a gorgeous private terrace garden. Consulted, designed, and appraisal-verified for the highest standards.',
    image: '/src/assets/images/hero_luxury_property_1791271374597.jpg',
    status: 'Active',
    features: ['Custom Wardrobes', 'Premium Bath Fittings', 'Private Terrace Garden', 'Teak Wood Main Door', 'Solar Water Heater'],
    documents: 'Grampanchayat Approved & Structural Fitness Certificate Clear'
  },
  {
    id: 'prop-4',
    title: 'Bespoke Executive Living Lounge (Interior Project)',
    type: 'Villa',
    purpose: 'Rent',
    price: 0.22, // 22,000 per month
    location: 'Civil Lines, Chandrapur',
    area: '1,400 sq. ft.',
    bhk: '2 BHK',
    description: 'A masterpiece of interior and decorative design by Lakshmi Designers. This elite living lounge and residence is perfect for corporate executives or premium families. Includes premium brass fixtures, bespoke sofas, elegant ambient wall sconces, and a state-of-the-art layout.',
    image: '/src/assets/images/interior_decorative_design_1791271394168.jpg',
    status: 'Active',
    features: ['Luxury Wall Paneling', 'Designer Chandelier', 'Fully Furnished', 'AC Pre-installed', 'Premium Modular Setup'],
    documents: 'Rent Agreement Verified & Clean Occupancy'
  }
];
