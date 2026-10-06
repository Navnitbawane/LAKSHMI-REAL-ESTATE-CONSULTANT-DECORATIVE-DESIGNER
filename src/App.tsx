/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Search, 
  Building2, 
  Compass, 
  Layers, 
  CheckCircle, 
  Calendar, 
  Plus, 
  Trash2, 
  Lock, 
  Eye, 
  EyeOff, 
  LogOut, 
  SlidersHorizontal,
  Home,
  Sparkles,
  Info,
  DollarSign,
  Briefcase,
  X,
  MessageSquare,
  Users
} from 'lucide-react';
import { Property, Lead } from './types';
import { INITIAL_PROPERTIES } from './initialData';
import { supabase } from './supabase';

export default function App() {
  // Load properties and leads from localStorage or use initial data
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('lakshmi_properties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing properties', e);
      }
    }
    return INITIAL_PROPERTIES;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('lakshmi_leads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing leads', e);
      }
    }
    return [];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('lakshmi_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('lakshmi_leads', JSON.stringify(leads));
  }, [leads]);

  // Client states
  const [activeTab, setActiveTab] = useState<'home' | 'properties' | 'design' | 'services' | 'about' | 'contact' | 'admin'>('home');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordVisible, setAdminPasswordVisible] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Search & Filter states
  const [searchPurpose, setSearchPurpose] = useState<'All' | 'Buy' | 'Rent'>('All');
  const [searchType, setSearchType] = useState<string>('All');
  const [searchLocation, setSearchLocation] = useState('');
  const [maxPrice, setMaxPrice] = useState<number>(100); // in Lakhs

  // Lead submission state
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '', type: 'General' as 'Callback' | 'General' });
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);
  
  // Site Visit booking state for detail modal
  const [visitForm, setVisitForm] = useState({ name: '', phone: '', email: '', preferredDate: '', message: '' });
  const [isVisitSubmitted, setIsVisitSubmitted] = useState(false);

  // New Property submission state for Admin
  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    title: '',
    type: 'Flat',
    purpose: 'Buy',
    price: 30,
    location: '',
    area: '',
    bhk: '',
    description: '',
    features: [],
    documents: '',
    image: '/src/assets/images/property_apartment_chandrapur_1791271406502.jpg'
  });
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Quick Filter Handler
  const handleQuickFilter = (purpose: 'Buy' | 'Rent') => {
    setSearchPurpose(purpose);
    setActiveTab('properties');
    const element = document.getElementById('listings-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtered properties
  const filteredProperties = properties.filter(prop => {
    const matchPurpose = searchPurpose === 'All' || prop.purpose === searchPurpose;
    const matchType = searchType === 'All' || prop.type === searchType;
    const matchLocation = prop.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
                          prop.title.toLowerCase().includes(searchLocation.toLowerCase()) ||
                          prop.description.toLowerCase().includes(searchLocation.toLowerCase());
    const matchPrice = prop.price <= maxPrice;
    return matchPurpose && matchType && matchLocation && matchPrice;
  });

  // Reset all filters
  const resetFilters = () => {
    setSearchPurpose('All');
    setSearchType('All');
    setSearchLocation('');
    setMaxPrice(100);
  };

  // Save lead details directly to Supabase Backend
  const saveLeadToSupabase = async (lead: Lead) => {
    try {
      console.log('Saving lead/appointment details to Supabase Backend:', lead);
      
      const payload = {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        message: lead.message,
        type: lead.type,
        status: lead.status,
        date: lead.date,
        property_title: lead.propertyTitle || null,
        preferred_date: lead.preferredDate || null
      };

      // Try inserting into 'appointments' table
      const { error: appError } = await supabase
        .from('appointments')
        .insert([payload]);

      if (appError) {
        console.warn('Insert to "appointments" failed, trying fallback "leads" table...', appError.message);
        
        // Try inserting into 'leads' table
        const { error: leadsError } = await supabase
          .from('leads')
          .insert([payload]);

        if (leadsError) {
          console.warn('Insert to "leads" failed as well. Retrying with basic fields only in "appointments"...', leadsError.message);
          
          // Retry with simple fields to ensure it matches basic schemas
          const basicPayload = {
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            message: lead.message
          };
          
          const { error: basicError } = await supabase
            .from('appointments')
            .insert([basicPayload]);
            
          if (basicError) {
            console.error('All Supabase database insertion paths failed. Check if table names/columns exist in your project:', basicError.message);
          } else {
            console.log('Successfully saved to "appointments" table with standard fallback fields!');
          }
        } else {
          console.log('Successfully saved to "leads" table in Supabase!');
        }
      } else {
        console.log('Successfully saved to "appointments" table in Supabase!');
      }
    } catch (err: any) {
      console.error('Supabase connection error:', err.message || err);
    }
  };

  // Submission handler for general contact
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) {
      alert('Please fill out Name and Phone number.');
      return;
    }
    
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: contactForm.name,
      phone: contactForm.phone,
      email: contactForm.email || 'N/A',
      message: contactForm.message || 'Requested a Callback / General Inquiry',
      date: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }),
      type: contactForm.type,
      status: 'New'
    };

    setLeads([newLead, ...leads]);
    setIsContactSubmitted(true);
    
    // Save to Supabase backend
    await saveLeadToSupabase(newLead);

    setTimeout(() => {
      setIsContactSubmitted(false);
      setContactForm({ name: '', phone: '', email: '', message: '', type: 'General' });
    }, 4000);
  };

  // Submission handler for Site Visit from modal
  const handleVisitSubmit = async (e: React.FormEvent, propTitle: string) => {
    e.preventDefault();
    if (!visitForm.name || !visitForm.phone || !visitForm.preferredDate) {
      alert('Please provide your name, phone number, and a preferred date.');
      return;
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      name: visitForm.name,
      phone: visitForm.phone,
      email: visitForm.email || 'N/A',
      propertyTitle: propTitle,
      message: visitForm.message || 'Scheduled site visit request.',
      date: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }),
      type: 'SiteVisit',
      status: 'New',
      preferredDate: visitForm.preferredDate
    };

    setLeads([newLead, ...leads]);
    setIsVisitSubmitted(true);
    
    // Save to Supabase backend
    await saveLeadToSupabase(newLead);
    
    // Auto trigger WhatsApp pre-filled text
    const waText = `Hello Lakshmi Real Estate & Designers, I would like to schedule a site visit for "${propTitle}". Name: ${visitForm.name}, Phone: ${visitForm.phone}, Date: ${visitForm.preferredDate}.`;
    const waUrl = `https://wa.me/919021837106?text=${encodeURIComponent(waText)}`;
    
    setTimeout(() => {
      setIsVisitSubmitted(false);
      setVisitForm({ name: '', phone: '', email: '', preferredDate: '', message: '' });
      window.open(waUrl, '_blank');
    }, 2000);
  };

  // Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '9021') {
      setIsAdminLoggedIn(true);
      setAdminError('');
    } else {
      setAdminError('Invalid Password Pin. Hint: The phone number starts with 9021.');
    }
  };

  // Admin Add Property
  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProperty.title || !newProperty.location || !newProperty.price || !newProperty.area) {
      alert('Please fill out all required fields (Title, Location, Price, and Area).');
      return;
    }

    const added: Property = {
      id: `prop-${Date.now()}`,
      title: newProperty.title,
      type: newProperty.type as any,
      purpose: newProperty.purpose as any,
      price: Number(newProperty.price),
      location: newProperty.location,
      area: newProperty.area,
      bhk: newProperty.type === 'Flat' || newProperty.type === 'Villa' ? newProperty.bhk || '2 BHK' : undefined,
      description: newProperty.description || 'Premium listing in Chandrapur, offered with complete structural clearance and guidance.',
      image: newProperty.image || '/src/assets/images/property_apartment_chandrapur_1791271406502.jpg',
      status: 'Active',
      features: newProperty.features && newProperty.features.length > 0 ? newProperty.features : ['Excellent Location', 'Vastu Compliant', 'Water Supply'],
      documents: newProperty.documents || 'Verified & Clear Paperwork'
    };

    setProperties([added, ...properties]);
    alert('Property added successfully!');
    setNewProperty({
      title: '',
      type: 'Flat',
      purpose: 'Buy',
      price: 30,
      location: '',
      area: '',
      bhk: '',
      description: '',
      features: [],
      documents: '',
      image: '/src/assets/images/property_apartment_chandrapur_1791271406502.jpg'
    });
  };

  // Admin Delete Property
  const handleDeleteProperty = (id: string) => {
    if (confirm('Are you sure you want to delete this property listing?')) {
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  // Admin Toggle Property Status
  const handleToggleStatus = (id: string, status: 'Active' | 'Sold' | 'Rented') => {
    setProperties(properties.map(p => p.id === id ? { ...p, status } : p));
  };

  // Admin Update Property Price
  const handleUpdatePrice = (id: string, newPrice: number) => {
    setProperties(properties.map(p => p.id === id ? { ...p, price: newPrice } : p));
  };

  // Admin Update Lead Status
  const handleUpdateLeadStatus = (id: string, status: 'New' | 'Contacted' | 'Closed') => {
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
  };

  // Admin Delete Lead
  const handleDeleteLead = (id: string) => {
    if (confirm('Are you sure you want to remove this lead record?')) {
      setLeads(leads.filter(l => l.id !== id));
    }
  };

  // Pre-set features adding in form
  const addFeature = () => {
    if (newFeatureInput.trim()) {
      setNewProperty({
        ...newProperty,
        features: [...(newProperty.features || []), newFeatureInput.trim()]
      });
      setNewFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setNewProperty({
      ...newProperty,
      features: (newProperty.features || []).filter((_, i) => i !== index)
    });
  };

  // Floating WhatsApp & Phone click tracker
  const handleWhatsAppClick = (message: string) => {
    const url = `https://wa.me/919021837106?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 bg-stone-50">
      
      {/* HEADER - Top Bar Contract */}
      {/* Contract: [Brand title, one line] — [4–6 nav links, 1–2 word labels, single-line] — [1–2 primary actions] */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Zone 1: Single text element wordmark */}
          <button 
            onClick={() => { setActiveTab('home'); resetFilters(); }}
            className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 font-display flex items-center gap-2 hover:opacity-90 text-left"
          >
            LAKSHMI <span className="font-light text-amber-700 hidden sm:inline">REAL ESTATE & DESIGNERS</span>
            <span className="font-light text-amber-700 sm:hidden">R.E & DESIGN</span>
          </button>

          {/* Zone 2: Navigation Links (4-6 links, 1-2 words, single line) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button 
              onClick={() => { setActiveTab('home'); }} 
              className={`hover:text-amber-800 transition-colors py-1 ${activeTab === 'home' ? 'text-amber-700 border-b-2 border-amber-700' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => { setActiveTab('properties'); }} 
              className={`hover:text-amber-800 transition-colors py-1 ${activeTab === 'properties' ? 'text-amber-700 border-b-2 border-amber-700' : ''}`}
            >
              Properties
            </button>
            <button 
              onClick={() => { setActiveTab('design'); }} 
              className={`hover:text-amber-800 transition-colors py-1 ${activeTab === 'design' ? 'text-amber-700 border-b-2 border-amber-700' : ''}`}
            >
              Interiors
            </button>
            <button 
              onClick={() => { setActiveTab('services'); }} 
              className={`hover:text-amber-800 transition-colors py-1 ${activeTab === 'services' ? 'text-amber-700 border-b-2 border-amber-700' : ''}`}
            >
              Services
            </button>
            <button 
              onClick={() => { setActiveTab('about'); }} 
              className={`hover:text-amber-800 transition-colors py-1 ${activeTab === 'about' ? 'text-amber-700 border-b-2 border-amber-700' : ''}`}
            >
              About
            </button>
            <button 
              onClick={() => { setActiveTab('contact'); }} 
              className={`hover:text-amber-800 transition-colors py-1 ${activeTab === 'contact' ? 'text-amber-700 border-b-2 border-amber-700' : ''}`}
            >
              Contact
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            <a 
              href="tel:9021837106" 
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-stone-900 bg-stone-100 hover:bg-stone-200 transition-all rounded-lg border border-stone-200"
            >
              <Phone className="w-3.5 h-3.5 text-stone-700" />
              <span className="hidden sm:inline">Call 9021837106</span>
              <span className="sm:hidden">Call</span>
            </a>
            
            <button
              onClick={() => { setActiveTab('admin'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'admin' 
                  ? 'bg-amber-800 text-white' 
                  : 'bg-amber-700 text-white hover:bg-amber-800 shadow-sm'
              }`}
            >
              {isAdminLoggedIn ? <SlidersHorizontal className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{isAdminLoggedIn ? 'Admin Panel' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* VIEWPORT BODY CONTAINER */}
      <main className="flex-grow">
        
        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <div>
            
            {/* HERO SECTION - Elegant 16:9 imagery as backstop with absolute clear overlay */}
            <section className="relative min-h-[500px] lg:h-[650px] bg-stone-900 text-white flex items-center overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img 
                  src="/src/assets/images/hero_luxury_property_1791271374597.jpg" 
                  alt="Premium Luxury Villa Chandrapur" 
                  className="w-full h-full object-cover opacity-45 scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/60 to-transparent"></div>
              </div>
              
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-left">
                <div className="max-w-3xl">
                  {/* Subtle regional Trust Subtitle */}
                  <span className="text-amber-400 font-medium text-sm tracking-widest uppercase mb-3 block">
                    TRUSTED REAL ESTATE & DECORATIVE DESIGN EXPERTS IN CHANDRAPUR
                  </span>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-display text-white mb-6 leading-[1.1] text-wrap">
                    Bespoke Real Estate Consulting & Luxurious Decorative Design
                  </h1>
                  
                  <p className="text-lg sm:text-xl text-stone-200 font-light mb-8 max-w-2xl leading-relaxed">
                    We help you locate prime residential plots, premium flats, and commercial properties, or transform your current spaces into breathtaking masterpieces.
                  </p>
                  
                  {/* Quick CTAs and Location Search */}
                  <div className="bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-white/15 max-w-2xl shadow-xl">
                    <h3 className="text-amber-300 text-xs uppercase tracking-wider font-semibold mb-3">Quick Property Finder</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button 
                        onClick={() => handleQuickFilter('Buy')} 
                        className="bg-white text-stone-900 hover:bg-stone-100 transition-all font-semibold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow"
                      >
                        <Building2 className="w-4 h-4 text-amber-700" />
                        Buy Property
                      </button>
                      <button 
                        onClick={() => handleQuickFilter('Rent')} 
                        className="bg-stone-900/80 hover:bg-stone-900 border border-white/20 text-white transition-all font-semibold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Layers className="w-4 h-4 text-amber-400" />
                        Rent Spaces
                      </button>
                      <button 
                        onClick={() => { setSearchType('Plot'); handleQuickFilter('Buy'); }} 
                        className="bg-amber-600 hover:bg-amber-700 text-white transition-all font-semibold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                      >
                        <Compass className="w-4 h-4" />
                        View Plots
                      </button>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                      <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input 
                          type="text" 
                          placeholder="Search Tukum, Ghate Layout, Civil Lines..."
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          className="w-full bg-white text-stone-900 placeholder:text-stone-400 pl-10 pr-4 py-2 text-sm rounded-lg border-0 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <button 
                        onClick={() => { setActiveTab('properties'); }} 
                        className="w-full sm:w-auto bg-stone-900 hover:bg-black text-white px-5 py-2.5 text-sm font-semibold rounded-lg shrink-0 border border-stone-800"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-stone-300">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      <span>Appraisal Verified</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      <span>RERA Registered Deals</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-amber-500" />
                      <span>Bespoke 3D Decor Designing</span>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* SERVICES PREVIEW BENTO LAYOUT */}
            <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-2">INTEGRATED EXCELLENCE</span>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-950 text-wrap balance">
                  End-to-End Real Estate & Bespoke Interiors
                </h2>
                <div className="w-20 h-0.5 bg-amber-700 mx-auto mt-4"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Bento Card 1: Consulting */}
                <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6 text-amber-800">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-stone-900 mb-3">01. Premium Real Estate Consulting</h3>
                    <p className="text-stone-600 text-sm leading-relaxed mb-6">
                      Assisting first-time home buyers, luxury villa seekers, and commercial investors in Chandrapur. We offer rigorous comparative market analysis, appraisal verification, and complete paperwork execution.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('services'); }} 
                    className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1.5"
                  >
                    Explore Consulting Services →
                  </button>
                </div>

                {/* Bento Card 2: Decorative Designing */}
                <div className="bg-stone-900 text-white p-8 rounded-2xl border border-stone-800 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-white mb-3">02. Bespoke Decorative Designing</h3>
                    <p className="text-stone-300 text-sm leading-relaxed mb-6">
                      Luxury interior design and exterior architecture. We craft exquisite wooden wall paneling, modular layouts, elegant decorative lighting setups, false ceilings, and vastu-compliant color schemes.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('design'); }} 
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
                  >
                    View Decorative Portfolio →
                  </button>
                </div>

                {/* Bento Card 3: Lands & Plots */}
                <div className="bg-white p-8 rounded-2xl border border-stone-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-6 text-amber-800">
                      <Compass className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-stone-900 mb-3">03. Plot & Luxury Properties</h3>
                    <p className="text-stone-600 text-sm leading-relaxed mb-6">
                      Explore handpicked prime plots in Ghate Layout, Nirman Nagar, and Tukum. All properties are meticulously scrutinized for clear titles, 7/12 extract clarity, and secure investment viability.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('properties'); setSearchType('Plot'); }} 
                    className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1.5"
                  >
                    View Active Plots →
                  </button>
                </div>

              </div>
            </section>

            {/* PRE-CONVERSTION PROPERTY SPOTLIGHT GRID */}
            <section className="bg-stone-100 py-16 sm:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12">
                  <div>
                    <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-2">CURATED LISTINGS</span>
                    <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-950">
                      Featured Properties in Chandrapur
                    </h2>
                  </div>
                  <button 
                    onClick={() => { setActiveTab('properties'); resetFilters(); }} 
                    className="mt-4 sm:mt-0 px-5 py-2.5 border border-stone-300 rounded-lg hover:bg-stone-200 text-sm font-semibold transition-all"
                  >
                    View All Listings
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {properties.slice(0, 3).map((prop) => (
                    <div key={prop.id} className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                      <div className="relative h-56 bg-stone-200 overflow-hidden shrink-0">
                        <img 
                          src={prop.image} 
                          alt={prop.title} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-stone-900 border border-stone-200 shadow-sm">
                          {prop.purpose === 'Buy' ? 'For Sale' : 'For Rent'}
                        </div>
                        {prop.status !== 'Active' && (
                          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white font-bold text-lg tracking-wider uppercase border-2 border-white px-4 py-1.5 rounded">
                              {prop.status}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-grow flex flex-col justify-between">
                        <div>
                          {/* Zero-Pill Inline Metadata with separators */}
                          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-medium tracking-wide mb-2 uppercase">
                            <span>{prop.type}</span>
                            <span>·</span>
                            <span>{prop.area}</span>
                            {prop.bhk && (
                              <>
                                <span>·</span>
                                <span>{prop.bhk}</span>
                              </>
                            )}
                          </div>

                          <h3 className="text-lg font-bold font-display text-stone-900 mb-2 hover:text-amber-800 cursor-pointer" onClick={() => setSelectedProperty(prop)}>
                            {prop.title}
                          </h3>
                          
                          <p className="text-stone-500 text-xs flex items-center gap-1 mb-4">
                            <MapPin className="w-3.5 h-3.5 text-amber-700 inline" />
                            {prop.location}
                          </p>

                          <p className="text-stone-600 text-xs leading-relaxed mb-4 line-clamp-3">
                            {prop.description}
                          </p>
                        </div>

                        <div className="border-t border-stone-100 pt-4 mt-4 flex items-center justify-between">
                          <span className="font-mono text-stone-950 font-bold text-lg tabular-nums">
                            {prop.price < 1 ? `₹${(prop.price * 100).toFixed(0)} Thousand / Mo` : `₹${prop.price} Lakhs`}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => setSelectedProperty(prop)}
                              className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
                            >
                              Details
                            </button>
                            <button 
                              onClick={() => handleWhatsAppClick(`Hello, I am interested in your property "${prop.title}" in Chandrapur. Please provide more details.`)}
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                              title="WhatsApp Agent"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </section>

            {/* DECORATIVE DESIGNER HIGHLIGHT */}
            <section className="py-20 bg-white border-t border-stone-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  
                  <div className="lg:col-span-6 relative">
                    <img 
                      src="/src/assets/images/interior_decorative_design_1791271394168.jpg" 
                      alt="Luxurious Interior Designing Services Chandrapur" 
                      className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-6 -right-6 bg-amber-50 border border-amber-200 p-6 rounded-xl hidden md:block shadow-lg max-w-xs">
                      <p className="text-xs font-mono text-amber-800 font-bold tracking-widest uppercase mb-1">DECOR & AMBIENCE</p>
                      <h4 className="text-stone-900 font-bold font-display text-lg mb-2">Bespoke Wall Paneling</h4>
                      <p className="text-stone-600 text-xs leading-relaxed">
                        Custom carved wood structures, modular fittings, and ambient brass illumination styled for Tukum villas.
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-2">CREATIVE INTERIORS</span>
                    <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-950 mb-6 text-wrap">
                      Crafting Spaces that Reflect Character
                    </h2>
                    <p className="text-stone-600 text-sm leading-relaxed mb-6">
                      As certified **Decorative Designers**, we do not just consult on properties—we craft standard lifestyle elevations. From custom false-ceilings and smart space-saving modular arrangements, to exquisite high-contrast textured paints, we curate luxury settings.
                    </p>

                    <div className="space-y-4 mb-8">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs text-amber-700 font-bold">✓</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-stone-900">3D Layout Visualizations</h4>
                          <p className="text-stone-500 text-xs">Visualize your false ceiling, furniture positioning, and lighting setup before implementation.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs text-amber-700 font-bold">✓</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-stone-900">Custom Lighting & Wall Textures</h4>
                          <p className="text-stone-500 text-xs">Aesthetic ambient fixtures paired with bespoke wooden moldings and premium textures.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs text-amber-700 font-bold">✓</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-stone-900">Vastu Shastra Compatibility</h4>
                          <p className="text-stone-500 text-xs">Proper orientation, layouts, and colors corresponding to traditional Indian architecture principles.</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setActiveTab('design'); }}
                      className="px-6 py-3 bg-stone-950 hover:bg-black text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                    >
                      Explore Designer Gallery
                    </button>
                  </div>

                </div>
              </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="bg-stone-50 py-16 sm:py-24 border-t border-stone-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center mb-16">
                  <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-2">GENUINE CLIENT REVIEWS</span>
                  <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-950">
                    Trusted By Families in Chandrapur
                  </h2>
                  <div className="w-20 h-0.5 bg-amber-700 mx-auto mt-4"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  
                  {/* Testimonial 1 */}
                  <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex gap-1 text-amber-500 mb-4">
                        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                      </div>
                      <p className="text-stone-600 text-xs italic leading-relaxed mb-6">
                        "We bought a residential plot behind Maratha Library through Lakshmi Real Estate. The entire consultation process was flawless. They checked all the 7/12 extract reports, cleared the title, and guided us with the NA layout registration. Extremely honest consultants in Tukum!"
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-stone-950">Rajesh Ghate</h4>
                      <p className="text-stone-400 text-xs">Business Owner, Tukum, Chandrapur</p>
                    </div>
                  </div>

                  {/* Testimonial 2 */}
                  <div className="bg-stone-900 text-white p-8 rounded-xl border border-stone-800 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex gap-1 text-amber-400 mb-4">
                        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                      </div>
                      <p className="text-stone-300 text-xs italic leading-relaxed mb-6">
                        "Lakshmi did the complete interior and decorative design of our new 2 BHK flat. The false ceiling, hidden LED lighting, and wooden TV paneling look gorgeous. They are not just property agents but true artists. Highly recommended for home decors!"
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-amber-400">Sneha Nirman</h4>
                      <p className="text-stone-400 text-xs">Home Owner, Nirman Nagar, Chandrapur</p>
                    </div>
                  </div>

                  {/* Testimonial 3 */}
                  <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex gap-1 text-amber-500 mb-4">
                        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                      </div>
                      <p className="text-stone-600 text-xs italic leading-relaxed mb-6">
                        "I hired them for commercial property consultation in Civil Lines. Their comparative market analysis was highly professional, saving me lakhs in appraisal calculations. A truly transparent firm you can rely on completely."
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-stone-950">Vikram K.</h4>
                      <p className="text-stone-400 text-xs">Developer, Chandrapur City</p>
                    </div>
                  </div>

                </div>

                <div className="mt-12 text-center">
                  <a 
                    href="https://maps.app.goo.gl/4TPTZmENtTohA4pp9" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-stone-900 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg shadow-sm"
                  >
                    <span>View More Google Reviews</span>
                    <span className="text-amber-700">★ 4.9 Rated</span>
                  </a>
                </div>

              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: PROPERTIES LISTINGS & SEARCH PAGE */}
        {activeTab === 'properties' && (
          <section id="listings-section" className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-1">CHANDRAPUR MARKETPLACE</span>
              <h1 className="text-3xl sm:text-4xl font-bold font-display text-stone-900">Property Listings</h1>
              <p className="text-stone-500 text-sm mt-2">Filter and browse through verified flats, plots, villas, and commercial listings.</p>
            </div>

            {/* INTEGRATED FILTERS SEGMENTED CONTROL */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                
                {/* Purpose Filters */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">I Want To</label>
                  <div className="flex bg-stone-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setSearchPurpose('All')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${searchPurpose === 'All' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setSearchPurpose('Buy')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${searchPurpose === 'Buy' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      Buy
                    </button>
                    <button 
                      onClick={() => setSearchPurpose('Rent')}
                      className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${searchPurpose === 'Rent' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      Rent
                    </button>
                  </div>
                </div>

                {/* Property Type Filter */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Property Type</label>
                  <select 
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold py-2 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="All">All Types</option>
                    <option value="Flat">Flats / Apartments</option>
                    <option value="Plot">Residential Plots</option>
                    <option value="Villa">Luxury Villas</option>
                    <option value="Commercial">Commercial Properties</option>
                  </select>
                </div>

                {/* Location Input Filter */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Location / Keyword</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. Tukum, Ghate Layout..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 pl-9 pr-3 py-1.5 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Price Slider */}
                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Max Price</label>
                    <span className="text-xs font-mono font-bold text-amber-800">₹{maxPrice} Lakhs</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="150" 
                    step="5"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-amber-700 h-1 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Reset Trigger */}
                <div className="lg:col-span-1">
                  <button 
                    onClick={resetFilters}
                    className="w-full py-1.5 text-stone-600 hover:text-stone-900 border border-stone-200 hover:border-stone-400 rounded-lg text-xs font-semibold transition-all"
                  >
                    Reset
                  </button>
                </div>

              </div>
            </div>

            {/* LISTINGS GRID */}
            {filteredProperties.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl">
                <p className="text-stone-500 text-sm mb-4">No properties match your active search filter settings.</p>
                <button 
                  onClick={resetFilters} 
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((prop) => (
                  <div key={prop.id} className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                    
                    <div className="relative h-56 bg-stone-200 overflow-hidden shrink-0">
                      <img 
                        src={prop.image} 
                        alt={prop.title} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-stone-900 border border-stone-200 shadow-sm">
                        {prop.purpose === 'Buy' ? 'For Sale' : 'For Rent'}
                      </div>
                      
                      {prop.status !== 'Active' && (
                        <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white font-bold text-lg tracking-wider uppercase border-2 border-white px-4 py-1.5 rounded">
                            {prop.status}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        {/* Zero-Pill Metadata */}
                        <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold tracking-wide mb-2 uppercase">
                          <span>{prop.type}</span>
                          <span>·</span>
                          <span>{prop.area}</span>
                          {prop.bhk && (
                            <>
                              <span>·</span>
                              <span>{prop.bhk}</span>
                            </>
                          )}
                        </div>

                        <h3 className="text-lg font-bold font-display text-stone-900 mb-2 hover:text-amber-800 cursor-pointer" onClick={() => setSelectedProperty(prop)}>
                          {prop.title}
                        </h3>

                        <p className="text-stone-500 text-xs flex items-center gap-1 mb-4">
                          <MapPin className="w-3.5 h-3.5 text-amber-700" />
                          {prop.location}
                        </p>

                        <p className="text-stone-600 text-xs leading-relaxed mb-4 line-clamp-3">
                          {prop.description}
                        </p>

                        {/* Property Document status (crucial trust asset) */}
                        <div className="mt-2 p-2 bg-stone-50 border border-stone-200/50 rounded text-[11px] text-stone-600 font-medium">
                          <span className="text-amber-700 font-semibold">Verification:</span> {prop.documents}
                        </div>
                      </div>

                      <div className="border-t border-stone-100 pt-4 mt-6 flex items-center justify-between">
                        <span className="font-mono text-stone-950 font-bold text-lg tabular-nums">
                          {prop.price < 1 ? `₹${(prop.price * 100).toFixed(0)} Thousand / Mo` : `₹${prop.price} Lakhs`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => setSelectedProperty(prop)}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => handleWhatsAppClick(`Hello Lakshmi Real Estate, I want to inquire about the property listing "${prop.title}" located in ${prop.location}. Is it still available?`)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                            title="Inquire on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* VIEW 3: DECORATIVE INTERIORS PORTFOLIO */}
        {activeTab === 'design' && (
          <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-1">INTERIOR & EXTERIOR MASTERPIECES</span>
              <h1 className="text-4xl font-bold font-display text-stone-950 mb-4">Decorative Designing</h1>
              <p className="text-stone-600 text-sm leading-relaxed text-wrap balance">
                Crafting luxury spaces with sophisticated accents, false ceiling lighting arrangements, modular fixtures, and vastu integration. Take a look at our core styling disciplines.
              </p>
              <div className="w-20 h-0.5 bg-amber-700 mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
              <div className="lg:col-span-7">
                <img 
                  src="/src/assets/images/interior_decorative_design_1791271394168.jpg" 
                  alt="Decorative Design Suite" 
                  className="rounded-2xl shadow-xl w-full h-[450px] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="lg:col-span-5 space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-stone-900 leading-tight">
                  Modern Wooden Wall Paneling & Lighting Design
                </h2>
                <p className="text-stone-600 text-sm leading-relaxed">
                  We specialize in combining traditional Indian warmth with ultra-modern minimalist architectural lines. This signature lounge setup includes solid timber frames, brass track illumination, and integrated acoustic dampening panels.
                </p>
                <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                  <h4 className="text-amber-900 font-semibold text-xs uppercase mb-2">Our Signature Materials</h4>
                  <ul className="text-stone-700 text-xs space-y-1.5">
                    <li>· A-Grade Burma Teak Wood</li>
                    <li>· Premium Multi-textured Acrylic Finishes</li>
                    <li>· Zero-Flicker COB Ambient Lights</li>
                    <li>· Traditional Vastu Colored Wallpapers</li>
                  </ul>
                </div>
                <button 
                  onClick={() => handleWhatsAppClick("Hello Lakshmi Designers, I would like to consult about interior decoration for my house in Chandrapur. Please share your charges and process.")}
                  className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-lg transition-all"
                >
                  Book Design Consultation
                </button>
              </div>
            </div>

            {/* OTHER DESIGN PROCESS WORKFLOWS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
                <h3 className="text-lg font-bold font-display text-stone-900 mb-2">1. Concept & Vastu Blueprint</h3>
                <p className="text-stone-600 text-xs leading-relaxed">
                  We analyze your spatial layouts and coordinate with you to align everything according to correct orientation, ensuring auspicious flow of positive energy.
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
                <h3 className="text-lg font-bold font-display text-stone-900 mb-2">2. Modular Material Selection</h3>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Select premium raw materials directly with full price transparency. We supervise the carpentry, false-ceiling fabrication, and plaster.
                </p>
              </div>
              <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
                <h3 className="text-lg font-bold font-display text-stone-900 mb-2">3. Exquisite Handover</h3>
                <p className="text-stone-600 text-xs leading-relaxed">
                  Our professional decorators execute custom brass finishing, texture paint applications, and lighting setups, rendering a dramatic, final aesthetic.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* VIEW 4: SERVICES OFFERS DETAILS */}
        {activeTab === 'services' && (
          <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-1">CERTIFIED PORTFOLIO</span>
              <h1 className="text-4xl font-bold font-display text-stone-950 mb-4">Our Services</h1>
              <p className="text-stone-600 text-sm">Comprehensive real estate consultancy, appraising, and design services in Chandrapur.</p>
              <div className="w-20 h-0.5 bg-amber-700 mx-auto mt-4"></div>
            </div>

            {/* FULL NUMBERED LIST OF THE SPECIFIED SERVICES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-amber-800 font-bold font-display text-xl border-b border-stone-100 pb-2">Real Estate Consultancy</h3>
                <ul className="space-y-3.5 text-stone-700 text-xs">
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">01.</span>
                    <div>
                      <strong className="text-stone-950">Comparative Real Estate Market Analysis:</strong>
                      <p className="text-stone-500 mt-0.5">Accurate valuation reports comparing historical sale parameters across Tukum and Nirman Nagar.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">02.</span>
                    <div>
                      <strong className="text-stone-950">Appraisals & Legal Scrutiny:</strong>
                      <p className="text-stone-500 mt-0.5">Assessing structure value and land extract verification to facilitate seamless bank loan approvals.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">03.</span>
                    <div>
                      <strong className="text-stone-950">Buying Agent Services:</strong>
                      <p className="text-stone-500 mt-0.5">Finding exclusive properties according to your strict budgets and preferred location.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">04.</span>
                    <div>
                      <strong className="text-stone-950">Seller's Agent & Marketing Services:</strong>
                      <p className="text-stone-500 mt-0.5">Optimizing your listing showcase and securing verified ready-to-buy prospects rapidly.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">05.</span>
                    <div>
                      <strong className="text-stone-950">Property Management & Renting:</strong>
                      <p className="text-stone-500 mt-0.5">Complete rent agreement documentation, tenant verification, and monthly management.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-amber-800 font-bold font-display text-xl border-b border-stone-100 pb-2">Bespoke Design & Construction</h3>
                <ul className="space-y-3.5 text-stone-700 text-xs">
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">06.</span>
                    <div>
                      <strong className="text-stone-950">Decorative Designing:</strong>
                      <p className="text-stone-500 mt-0.5">Complete living room, kitchen, bedroom decoration including custom textures, false ceilings, and premium partitions.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">07.</span>
                    <div>
                      <strong className="text-stone-950">New Construction Consultation:</strong>
                      <p className="text-stone-500 mt-0.5">Structural blueprint ideas and builder liaison for customized plots and residential bungalows.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">08.</span>
                    <div>
                      <strong className="text-stone-950">Commercial Real Estate Consulting:</strong>
                      <p className="text-stone-500 mt-0.5">Optimized location appraisal for retail showrooms, banks, and office space layouts in Chandrapur.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">09.</span>
                    <div>
                      <strong className="text-stone-950">First-Time Home Buyer Support:</strong>
                      <p className="text-stone-500 mt-0.5">End-to-end handholding including government subsidy registrations, loan applications, and stamp duty assistance.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-amber-700 font-bold">10.</span>
                    <div>
                      <strong className="text-stone-950">Luxury Properties Brokerage:</strong>
                      <p className="text-stone-500 mt-0.5">Curating exclusive premium independent villas and elite residential complexes with advanced modular designer handovers.</p>
                    </div>
                  </li>
                </ul>
              </div>

            </div>

            <div className="mt-16 text-center">
              <button 
                onClick={() => { setActiveTab('contact'); }}
                className="px-6 py-3 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-md transition-all"
              >
                Inquire About a Specific Service
              </button>
            </div>
          </section>
        )}

        {/* VIEW 5: ABOUT US */}
        {activeTab === 'about' && (
          <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 relative">
                <img 
                  src="/src/assets/images/property_villa_plot_1791271428205.jpg" 
                  alt="Our Team and Location Tukum" 
                  className="rounded-2xl shadow-lg w-full h-[450px] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-md">
                  <span className="text-amber-800 font-mono font-bold text-2xl">10+</span>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold mt-1">Years Operating in Tukum</p>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6">
                <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-1">WHO WE ARE</span>
                <h1 className="text-4xl font-bold font-display text-stone-950">LAKSHMI REAL ESTATE CONSULTANT</h1>
                <h3 className="text-amber-800 font-semibold text-lg font-display">& DECORATIVE DESIGNER</h3>
                
                <p className="text-stone-600 text-sm leading-relaxed">
                  Located near the historic Maratha Library Ghate Layout in Nirman Nagar, Tukum, Chandrapur, we have served the community as an integrated real estate and interior consulting agency.
                </p>

                <p className="text-stone-600 text-sm leading-relaxed">
                  Under our dual specialization, we guide prospective homeowners through rigorous land title scrutinies to ensure 100% legal compliance, followed by high-concept decorative interior redesigns. Our process is built on absolute transparency, zero hidden charges, and continuous client updates.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200">
                  <div>
                    <h4 className="text-stone-900 font-bold text-sm">Chandrapur, Tukum</h4>
                    <p className="text-stone-500 text-xs">Primary area of operation & service delivery</p>
                  </div>
                  <div>
                    <h4 className="text-stone-900 font-bold text-sm">100% Clear Titles</h4>
                    <p className="text-stone-500 text-xs">Continuous commitment to flawless documentation</p>
                  </div>
                </div>

                <div className="pt-4">
                  <a 
                    href="https://maps.app.goo.gl/4TPTZmENtTohA4pp9" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    <span>View Our Google Business Profile</span>
                    <span className="text-amber-400">→</span>
                  </a>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* VIEW 6: CONTACT PAGE */}
        {activeTab === 'contact' && (
          <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-amber-700 font-semibold text-xs tracking-widest uppercase block mb-1 font-mono">GET IN TOUCH</span>
              <h1 className="text-4xl font-bold font-display text-stone-950">Contact Our Office</h1>
              <p className="text-stone-500 text-sm mt-2">Request a callback, write an enquiry, or locate us on Google Maps.</p>
              <div className="w-20 h-0.5 bg-amber-700 mx-auto mt-4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
              
              {/* Contact Information Cards */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                  <h3 className="text-stone-900 font-bold font-display text-lg mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-700" />
                    Office Address
                  </h3>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    Maratha Library Back Side Ghate Layout, <br />
                    Nirman Nagar, Tukum, Chandrapur, <br />
                    Maharashtra - 442401, India
                  </p>
                  <a 
                    href="https://maps.app.goo.gl/4TPTZmENtTohA4pp9" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-amber-700 hover:text-amber-950 text-xs font-semibold inline-block mt-4"
                  >
                    Get GPS Directions on Google Maps →
                  </a>
                </div>

                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                  <h3 className="text-stone-900 font-bold font-display text-lg mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-amber-700" />
                    Direct Phone & WhatsApp
                  </h3>
                  <p className="text-stone-600 text-xs">
                    Call us for immediate appraising consultation:
                  </p>
                  <p className="text-stone-950 font-mono font-bold text-lg mt-1 tracking-wide">
                    +91 9021837106
                  </p>
                  <div className="mt-4 flex gap-2">
                    <a 
                      href="tel:9021837106" 
                      className="flex-1 text-center py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-xs font-semibold text-stone-900"
                    >
                      Dial Phone
                    </a>
                    <button 
                      onClick={() => handleWhatsAppClick("Hello Lakshmi Real Estate, I am looking for property assistance in Chandrapur. Please call me back.")}
                      className="flex-1 text-center py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold"
                    >
                      WhatsApp Chat
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                  <h3 className="text-stone-900 font-bold font-display text-lg mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-amber-700" />
                    Email Information
                  </h3>
                  <p className="text-stone-600 text-xs">
                    Send property details or blueprint images to:
                  </p>
                  <p className="text-stone-900 font-mono font-bold text-sm mt-1">
                    lakshmi.decor.chandrapur@gmail.com
                  </p>
                </div>

              </div>

              {/* Contact Lead Form */}
              <div className="lg:col-span-7 bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
                <h3 className="text-stone-950 font-bold font-display text-2xl mb-6">Inquiry & Callback Request</h3>
                
                {isContactSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center">
                    <h4 className="text-emerald-900 font-bold text-lg mb-2">Thank you!</h4>
                    <p className="text-emerald-700 text-xs">
                      Your inquiry has been logged in our secure admin register. Our consulting agent will connect with you via +91 9021837106 within 2 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Your Name *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Ramesh Patel"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Phone Number *</label>
                        <input 
                          type="tel" 
                          required
                          placeholder="e.g. 9876543210"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="e.g. ramesh@gmail.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Inquiry Type</label>
                      <select 
                        value={contactForm.type}
                        onChange={(e) => setContactForm({ ...contactForm, type: e.target.value as any })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="General">General Inquiry</option>
                        <option value="Callback">Request an Immediate Callback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5">Your Message / Property Details</label>
                      <textarea 
                        rows={4}
                        placeholder="State your plot requirements, flat preferences, or interior design questions..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-lg shadow transition-all"
                    >
                      Submit Inquiry
                    </button>

                  </form>
                )}
              </div>

            </div>
          </section>
        )}

        {/* VIEW 7: ADMIN CONTROL PANEL PANEL */}
        {activeTab === 'admin' && (
          <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {!isAdminLoggedIn ? (
              // ADMIN PASSWORD DOOR
              <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-stone-200 shadow-md">
                <div className="text-center mb-6">
                  <Lock className="w-10 h-10 text-amber-700 mx-auto mb-3" />
                  <h1 className="text-2xl font-bold font-display text-stone-900">Admin Authentication</h1>
                  <p className="text-stone-500 text-xs mt-1">Access visitor lead directories and manage properties list.</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase mb-1.5 font-mono">Password Pin Pin</label>
                    <div className="relative">
                      <input 
                        type={adminPasswordVisible ? 'text' : 'password'} 
                        required
                        placeholder="Enter admin pin code"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-3 pr-10 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => setAdminPasswordVisible(!adminPasswordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {adminPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Hint: The default business PIN code starts with 9021...</p>
                  </div>

                  {adminError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200/50 p-2.5 rounded">
                      {adminError}
                    </p>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-semibold text-xs rounded-lg transition-all"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            ) : (
              // FULL ADMIN DASHBOARD VIEW
              <div className="space-y-12">
                
                {/* Admin Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-200 pb-6 gap-4">
                  <div>
                    <span className="text-amber-700 font-bold text-xs tracking-widest uppercase font-mono">LAKSHMI INTERNAL TERMINAL</span>
                    <h1 className="text-3xl font-bold font-display text-stone-950">Management Dashboard</h1>
                  </div>
                  <button 
                    onClick={() => { setIsAdminLoggedIn(false); setAdminPassword(''); }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-stone-200 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out Terminal
                  </button>
                </div>

                {/* Dashboard Stats Panel */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                    <span className="text-stone-400 text-[10px] uppercase font-bold">Total Properties</span>
                    <p className="text-2xl font-bold font-display text-stone-900 mt-1 tabular-nums">{properties.length}</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                    <span className="text-stone-400 text-[10px] uppercase font-bold">Active Listings</span>
                    <p className="text-2xl font-bold font-display text-emerald-700 mt-1 tabular-nums">
                      {properties.filter(p => p.status === 'Active').length}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                    <span className="text-stone-400 text-[10px] uppercase font-bold">Sold/Rented</span>
                    <p className="text-2xl font-bold font-display text-stone-500 mt-1 tabular-nums">
                      {properties.filter(p => p.status !== 'Active').length}
                    </p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
                    <span className="text-stone-400 text-[10px] uppercase font-bold">Visitor Enquiries</span>
                    <p className="text-2xl font-bold font-display text-amber-800 mt-1 tabular-nums">{leads.length}</p>
                  </div>
                </div>

                {/* Section Split: Add Property & Leads Management */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  
                  {/* LEFT: Add Property Form */}
                  <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-stone-200 shadow-xs h-fit">
                    <h3 className="text-stone-900 font-bold font-display text-xl mb-4 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                      <Plus className="w-5 h-5 text-amber-700" />
                      Add New Property
                    </h3>

                    <form onSubmit={handleAddProperty} className="space-y-4">
                      
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Property Title *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Modern 3 BHK Flat Tukum"
                          value={newProperty.title}
                          onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Purpose *</label>
                          <select 
                            value={newProperty.purpose}
                            onChange={(e) => setNewProperty({ ...newProperty, purpose: e.target.value as any })}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none"
                          >
                            <option value="Buy">For Sale</option>
                            <option value="Rent">For Rent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Type *</label>
                          <select 
                            value={newProperty.type}
                            onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value as any })}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none"
                          >
                            <option value="Flat">Flat / Apartment</option>
                            <option value="Plot">Residential Plot</option>
                            <option value="Villa">Luxury Villa</option>
                            <option value="Commercial">Commercial space</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Price (Lakhs) *</label>
                          <input 
                            type="number" 
                            step="0.01"
                            required
                            placeholder="e.g. 35"
                            value={newProperty.price ?? ''}
                            onChange={(e) => setNewProperty({ ...newProperty, price: Number(e.target.value) || 0 })}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Area Size *</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. 1,050 sq. ft."
                            value={newProperty.area}
                            onChange={(e) => setNewProperty({ ...newProperty, area: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">BHK / Config (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 2 BHK"
                            value={newProperty.bhk}
                            onChange={(e) => setNewProperty({ ...newProperty, bhk: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Verification Status</label>
                          <input 
                            type="text" 
                            placeholder="e.g. RERA Registered, Clear Title"
                            value={newProperty.documents}
                            onChange={(e) => setNewProperty({ ...newProperty, documents: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Location Address *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Nirman Nagar, Tukum, Chandrapur"
                          value={newProperty.location}
                          onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Description *</label>
                        <textarea 
                          rows={3}
                          required
                          placeholder="Provide details about structural fittings, vastu layout, decoration status..."
                          value={newProperty.description}
                          onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none"
                        ></textarea>
                      </div>

                      {/* Image Mock Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Select Property Image Mock</label>
                        <select
                          value={newProperty.image}
                          onChange={(e) => setNewProperty({ ...newProperty, image: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-200 rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none"
                        >
                          <option value="/src/assets/images/property_apartment_chandrapur_1791271406502.jpg">Apartment Exterior Mock</option>
                          <option value="/src/assets/images/property_villa_plot_1791271428205.jpg">Residential Plot Mock</option>
                          <option value="/src/assets/images/hero_luxury_property_1791271374597.jpg">Luxury Villa Mock</option>
                          <option value="/src/assets/images/interior_decorative_design_1791271394168.jpg">Decorative Interior Mock</option>
                        </select>
                      </div>

                      {/* Features Adding */}
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Add Features / Amenities</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="e.g. Gated Security, Teak door"
                            value={newFeatureInput}
                            onChange={(e) => setNewFeatureInput(e.target.value)}
                            className="flex-grow bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs"
                          />
                          <button 
                            type="button" 
                            onClick={addFeature}
                            className="px-3 py-1 bg-amber-700 text-white rounded text-xs font-semibold"
                          >
                            Add
                          </button>
                        </div>
                        {newProperty.features && newProperty.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {newProperty.features.map((feat, idx) => (
                              <span key={idx} className="bg-stone-100 px-2 py-0.5 rounded text-[10px] text-stone-700 flex items-center gap-1">
                                {feat}
                                <button type="button" onClick={() => removeFeature(idx)} className="text-red-500 font-bold font-mono">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded shadow-sm"
                      >
                        Publish Listing
                      </button>

                    </form>
                  </div>

                  {/* RIGHT: Active Leads / Inquiries */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                      <h3 className="text-stone-900 font-bold font-display text-xl mb-4 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                        <Users className="w-5 h-5 text-amber-700" />
                        Inbound Leads & Site Visits ({leads.length})
                      </h3>

                      {leads.length === 0 ? (
                        <p className="text-stone-400 text-xs py-8 text-center italic">No leads received yet from the website forms.</p>
                      ) : (
                        <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
                          {leads.map((lead) => (
                            <div key={lead.id} className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex flex-col justify-between gap-3 hover:border-amber-300 transition-colors">
                              
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-stone-900 text-xs">{lead.name}</h4>
                                    <span className={`px-2 py-0.5 text-[9px] font-mono rounded font-bold uppercase ${
                                      lead.type === 'SiteVisit' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                      lead.type === 'Callback' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                                      'bg-stone-200 text-stone-700 border border-stone-300'
                                    }`}>
                                      {lead.type}
                                    </span>
                                  </div>
                                  
                                  <div className="text-[11px] text-stone-500 font-mono mt-1 space-x-2">
                                    <span>Tel: {lead.phone}</span>
                                    <span>•</span>
                                    <span>Email: {lead.email}</span>
                                  </div>

                                  {lead.propertyTitle && (
                                    <p className="text-[11px] text-stone-700 font-semibold mt-1">
                                      Property: <span className="text-amber-700">{lead.propertyTitle}</span>
                                    </p>
                                  )}

                                  {lead.preferredDate && (
                                    <p className="text-[11px] text-amber-900 font-bold mt-1">
                                      Preferred Date: {lead.preferredDate}
                                    </p>
                                  )}

                                  <p className="text-stone-600 text-xs mt-2 p-2 bg-white rounded border border-stone-100">
                                    "{lead.message}"
                                  </p>
                                </div>

                                <button 
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-stone-100"
                                  title="Delete Lead"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="border-t border-stone-200/50 pt-2 flex items-center justify-between">
                                <span className="text-[10px] text-stone-400">Date: {lead.date}</span>
                                
                                <div className="flex items-center gap-1.5">
                                  <select 
                                    value={lead.status}
                                    onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                                    className="bg-white border border-stone-200 text-stone-800 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                                  >
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Closed">Closed</option>
                                  </select>
                                  
                                  <a 
                                    href={`tel:${lead.phone}`}
                                    className="px-2.5 py-1 bg-stone-900 hover:bg-black text-white text-[10px] font-semibold rounded"
                                  >
                                    Call Lead
                                  </a>
                                </div>
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Manage Properties Listing */}
                    <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                      <h3 className="text-stone-900 font-bold font-display text-xl mb-4 border-b border-stone-100 pb-2">
                        Manage Current Listings ({properties.length})
                      </h3>
                      <div className="space-y-3">
                        {properties.map((p) => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg gap-2">
                            <div className="flex items-center gap-3">
                              <img src={p.image} className="w-10 h-10 object-cover rounded" />
                              <div>
                                <h4 className="text-xs font-semibold text-stone-900 line-clamp-1">{p.title}</h4>
                                <p className="text-[10px] text-stone-400">{p.location}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Price update direct input */}
                              <input 
                                type="number" 
                                value={p.price} 
                                onChange={(e) => handleUpdatePrice(p.id, Number(e.target.value))}
                                className="w-16 bg-white border border-stone-200 rounded px-1.5 py-0.5 text-xs text-center font-mono font-bold"
                                title="Update price (Lakhs)"
                              />
                              <select 
                                value={p.status}
                                onChange={(e) => handleToggleStatus(p.id, e.target.value as any)}
                                className="bg-white border border-stone-200 text-stone-800 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                              >
                                <option value="Active">Active</option>
                                <option value="Sold">Sold</option>
                                <option value="Rented">Rented</option>
                              </select>
                              <button 
                                onClick={() => handleDeleteProperty(p.id)}
                                className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-stone-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}
          </section>
        )}

      </main>

      {/* PROPERTY DETAIL MODAL */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl relative">
            
            <button 
              onClick={() => { setSelectedProperty(null); setIsVisitSubmitted(false); }}
              className="absolute right-4 top-4 z-10 bg-white/90 border border-stone-200 p-1.5 rounded-full text-stone-500 hover:text-stone-900 shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Left Column: Image and Static Info */}
              <div className="lg:col-span-6 p-6 sm:p-8 space-y-6 border-r border-stone-100">
                <div className="relative h-64 bg-stone-100 rounded-xl overflow-hidden shadow-inner">
                  <img 
                    src={selectedProperty.image} 
                    alt={selectedProperty.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-stone-900">
                    {selectedProperty.purpose === 'Buy' ? 'For Sale' : 'For Rent'}
                  </div>
                </div>

                <div>
                  {/* Zero-Pill Inline Metadata with separators */}
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold tracking-wide mb-2 uppercase">
                    <span>{selectedProperty.type}</span>
                    <span>·</span>
                    <span>{selectedProperty.area}</span>
                    {selectedProperty.bhk && (
                      <>
                        <span>·</span>
                        <span>{selectedProperty.bhk}</span>
                      </>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold font-display text-stone-950 mb-1">
                    {selectedProperty.title}
                  </h2>
                  <p className="text-stone-500 text-xs flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    {selectedProperty.location}
                  </p>

                  <p className="text-stone-600 text-xs leading-relaxed mb-4">
                    {selectedProperty.description}
                  </p>

                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/50 mb-4 text-xs text-stone-700">
                    <h4 className="font-semibold text-stone-900 mb-1">Legal Clearance Status:</h4>
                    <p className="text-stone-500">{selectedProperty.documents}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Features & Amenities</h4>
                  <div className="grid grid-cols-2 gap-2 text-stone-700 text-[11px]">
                    {selectedProperty.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-700 rounded-full"></span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 block uppercase font-bold">Offer Price</span>
                    <span className="font-mono text-stone-950 font-bold text-xl tabular-nums">
                      {selectedProperty.price < 1 ? `₹${(selectedProperty.price * 100).toFixed(0)} Thousand / Mo` : `₹${selectedProperty.price} Lakhs`}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <a 
                      href="tel:9021837106"
                      className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm"
                    >
                      Call Agent
                    </a>
                  </div>
                </div>

              </div>

              {/* Right Column: Schedule Site Visit Form */}
              <div className="lg:col-span-6 p-6 sm:p-8 bg-stone-50/50">
                <div className="mb-6">
                  <Calendar className="w-8 h-8 text-amber-700 mb-2" />
                  <h3 className="text-xl font-bold font-display text-stone-900">Schedule Site Visit</h3>
                  <p className="text-stone-500 text-xs mt-1">Book an appointment for a physical site walkthrough in Chandrapur.</p>
                </div>

                {isVisitSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl text-center">
                    <h4 className="text-emerald-900 font-bold text-lg mb-2">Booking Success!</h4>
                    <p className="text-emerald-700 text-xs">
                      The visit request is saved! Redirecting to WhatsApp to send a pre-filled schedule text to the consultant...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleVisitSubmit(e, selectedProperty.title)} className="space-y-4">
                    
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Your Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Anand Ghate"
                        value={visitForm.name}
                        onChange={(e) => setVisitForm({ ...visitForm, name: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Phone Number *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="e.g. 9021837106"
                        value={visitForm.phone}
                        onChange={(e) => setVisitForm({ ...visitForm, phone: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Preferred Date *</label>
                      <input 
                        type="date" 
                        required
                        value={visitForm.preferredDate}
                        onChange={(e) => setVisitForm({ ...visitForm, preferredDate: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800 text-stone-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Special Instruction (Optional)</label>
                      <textarea 
                        rows={3}
                        placeholder="e.g. Prefer morning slots / need picking up from Nirman Nagar..."
                        value={visitForm.message}
                        onChange={(e) => setVisitForm({ ...visitForm, message: e.target.value })}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-800"
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded shadow-sm"
                    >
                      Book & Connect on WhatsApp
                    </button>

                  </form>
                )}

                <div className="mt-6 border-t border-stone-200/50 pt-4 text-center">
                  <span className="text-[10px] text-stone-400 block uppercase">Continuous Assistance</span>
                  <a href="tel:9021837106" className="text-stone-900 font-bold font-mono text-sm inline-block mt-1 hover:text-amber-700">
                    +91 9021837106
                  </a>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-4">
            <h3 className="text-white font-bold font-display text-lg">
              LAKSHMI REAL ESTATE & DECORATIVE DESIGNERS
            </h3>
            <p className="text-xs leading-relaxed text-stone-400">
              Your certified partner for standard comparative market appraisals, RERA legal paperwork execution, plot buys, and exquisite bespoke living room decors.
            </p>
            <div className="pt-2 text-stone-300 text-xs">
              <span className="font-semibold text-amber-400">RERA Registration Scrutiny:</span> Verified Property Leads Only.
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 font-mono">Service Deliveries</h4>
            <ul className="space-y-2 text-xs">
              <li>· Comparative Appraisals</li>
              <li>· Residential Plot Sourcing</li>
              <li>· Commercial Consultancy</li>
              <li>· Complete House Remodeling</li>
              <li>· Teak & Brass Wood Paneling</li>
              <li>· False Ceilings & Lighting</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 font-mono">Areas Served</h4>
            <ul className="space-y-2 text-xs">
              <li>· Tukum, Chandrapur</li>
              <li>· Ghate Layout</li>
              <li>· Nirman Nagar</li>
              <li>· Civil Lines, Chandrapur</li>
              <li>· Mul Road Layouts</li>
              <li>· Ballarpur Road Zones</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4 font-mono">Contact Info</h4>
            <p className="text-xs text-stone-400 mb-2 leading-relaxed">
              Maratha Library Back Side Ghate Layout Nirman Nagar, Tukum, Chandrapur, Maharashtra 442401
            </p>
            <p className="text-xs text-stone-300 font-mono mt-2">
              Phone: +91 9021837106
            </p>
            <p className="text-xs text-stone-300 font-mono">
              Email: lakshmi.decor.chandrapur@gmail.com
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500">
          <p>© {new Date().getFullYear()} LAKSHMI REAL ESTATE & DECORATIVE DESIGNERS. All Rights Reserved.</p>
          
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <button onClick={() => { setActiveTab('home'); }} className="hover:text-white transition-colors">Home</button>
            <span>·</span>
            <button onClick={() => { setActiveTab('properties'); }} className="hover:text-white transition-colors">Properties</button>
            <span>·</span>
            <button onClick={() => { setActiveTab('admin'); }} className="hover:text-white transition-colors">Admin Login</button>
            <span>·</span>
            <a href="https://maps.app.goo.gl/4TPTZmENtTohA4pp9" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Google Profile</a>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP & CALL FLOATING BUTTONS */}
      {/* CAP: aggregated height of mobile sticky items <= 15% */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2.5">
        <a 
          href="tel:9021837106" 
          className="bg-stone-900 text-white p-3.5 rounded-full shadow-lg hover:bg-black hover:scale-105 transition-all border border-stone-800 flex items-center justify-center"
          title="Call Principal Agent"
        >
          <Phone className="w-5 h-5" />
        </a>
        <button 
          onClick={() => handleWhatsAppClick("Hello Lakshmi Real Estate & Designers, I visited your website and would like to request immediate property assistance or interior decoration.")}
          className="bg-emerald-600 text-white p-3.5 rounded-full shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center border border-emerald-500 cursor-pointer"
          title="Direct WhatsApp"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.013-5.112-2.861-6.962s-4.324-2.87-6.958-2.87C6.072 2.915 1.649 7.334 1.645 12.77c-.001 1.718.463 3.393 1.343 4.908l-.988 3.606 3.702-.97.001-.001-.155-.09zm11.534-7.53c-.307-.154-1.82-.9-2.1-.1s-.14.385-.4.68c-.26.297-.52.327-.827.173-.308-.154-1.3-.48-2.477-1.53-1.178-1.05-1.176-1.53-1.484-1.838-.307-.308-.033-.357.1-.5.1-.115.22-.267.33-.4.11-.133.15-.228.225-.38.075-.152.038-.285-.019-.44-.056-.153-.5-1.2-.685-1.65c-.18-.435-.36-.37-.49-.376l-.42-.01c-.143 0-.376.054-.57.265-.197.21-.75.733-.75 1.786 0 1.053.766 2.07 1.05 2.19.16.07 1.517 2.316 3.67 3.245.512.22 1.11.355 1.685.186.44-.13 1.356-.554 1.545-1.087.188-.533.188-.99.13-1.087-.056-.1-.2-.153-.5-.307z"/>
          </svg>
        </button>
      </div>

    </div>
  );
}
