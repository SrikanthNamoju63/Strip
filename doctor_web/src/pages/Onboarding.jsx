import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDoctorProfile, updateDoctorProfile, uploadGalleryImage } from '../services/api';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Tag, 
  Globe, 
  Users, 
  Building2, 
  Clock, 
  Image as ImageIcon, 
  X, 
  Plus, 
  UploadCloud, 
  Info, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SUGGESTED_KEYWORDS = [
  'General Physician', 'Pediatrician', 'Cardiologist', 'Dermatologist', 
  'Fever', 'Cough & Cold', 'Diabetes', 'Hypertension', 'Asthma', 
  'Vaccination', 'Thyroid', 'Obesity', 'Allergy Specialist'
];

const SUGGESTED_LANGUAGES = [
  'English', 'Hindi', 'Telugu', 'Kannada', 'Tamil', 'Malayalam', 
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi'
];

const FACILITY_OPTIONS = [
  { key: 'pharmacyAvailable', label: 'In-House Pharmacy', desc: 'Medicine counter available at clinic' },
  { key: 'labAvailable', label: 'Laboratory Services', desc: 'Pathological and diagnostic lab tests' },
  { key: 'scanAvailable', label: 'Scanning Center', desc: 'Ultrasound and imaging scans' },
  { key: 'bloodTestAvailable', label: 'Blood Testing', desc: 'In-house blood drawing and results' },
  { key: 'ecgAvailable', label: 'ECG Services', desc: 'Electrocardiogram testing' },
  { key: 'xRayAvailable', label: 'X-Ray Facility', desc: 'Radiographic scanning' },
  { key: 'wheelchairAccess', label: 'Wheelchair Friendly', desc: 'Ramps and accessible entryways' },
  { key: 'parkingAvailable', label: 'Ample Parking', desc: 'Reserved parking for visitors' }
];

export default function Onboarding() {
  const { initializeSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stepsNeeded, setStepsNeeded] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Form State
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState('');

  const [genderPreference, setGenderPreference] = useState('Both');

  const [facilities, setFacilities] = useState({
    pharmacyAvailable: false,
    labAvailable: false,
    scanAvailable: false,
    bloodTestAvailable: false,
    ecgAvailable: false,
    xRayAvailable: false,
    wheelchairAccess: false,
    parkingAvailable: false
  });

  const [weeklyAvailability, setWeeklyAvailability] = useState(
    DAYS.map(day => ({
      day,
      startTime: '09:00',
      endTime: '17:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      isOff: day === 'Sunday', // Default Sunday Off
      slotDuration: 30
    }))
  );

  const [diseaseImages, setDiseaseImages] = useState([]);
  const [clinicImages, setClinicImages] = useState([]);
  const [uploadingDisease, setUploadingDisease] = useState(false);
  const [uploadingClinic, setUploadingClinic] = useState(false);

  // Original profile to know what was originally present vs missing
  const [originalProfile, setOriginalProfile] = useState(null);

  useEffect(() => {
    fetchExistingProfile();
  }, []);

  const fetchExistingProfile = async () => {
    try {
      setLoading(true);
      const profile = await getDoctorProfile();
      setOriginalProfile(profile);
      
      // Set Form State
      if (profile.keywords) setKeywords(profile.keywords);
      if (profile.languages) setLanguages(profile.languages);
      if (profile.genderPreference) setGenderPreference(profile.genderPreference);
      if (profile.facilities) setFacilities(prev => ({ ...prev, ...profile.facilities }));

      if (profile.weeklyAvailability && profile.weeklyAvailability.length > 0) {
        const mergedAvailability = DAYS.map(day => {
          const found = profile.weeklyAvailability.find(d => d.day === day);
          return found ? {
            day: found.day,
            startTime: found.startTime || '09:00',
            endTime: found.endTime || '17:00',
            lunchStart: found.lunchStart || '13:00',
            lunchEnd: found.lunchEnd || '14:00',
            isOff: found.isOff ?? false,
            slotDuration: found.slotDuration || 30
          } : {
            day,
            startTime: '09:00',
            endTime: '17:00',
            lunchStart: '13:00',
            lunchEnd: '14:00',
            isOff: day === 'Sunday',
            slotDuration: 30
          };
        });
        setWeeklyAvailability(mergedAvailability);
      }

      if (profile.diseaseImages) setDiseaseImages(profile.diseaseImages);
      if (profile.clinicImages) setClinicImages(profile.clinicImages);

      // Determine missing profile parts
      const missingKeywords = !profile.keywords || profile.keywords.length === 0;
      const missingLanguages = !profile.languages || profile.languages.length === 0;
      const missingGenderPref = !profile.genderPreference;
      const missingFacilities = !profile.facilities || Object.keys(profile.facilities).length === 0;
      const missingAvailability = !profile.weeklyAvailability || profile.weeklyAvailability.length === 0;
      const missingDiseaseImages = !profile.diseaseImages || profile.diseaseImages.length === 0;
      const missingClinicImages = !profile.clinicImages || profile.clinicImages.length === 0;

      // Construct conditional wizard steps
      const steps = [];

      if (missingKeywords || missingLanguages || missingGenderPref) {
        steps.push({
          id: 'preferences',
          label: 'Preferences',
          icon: Tag,
          fields: {
            keywords: missingKeywords,
            languages: missingLanguages,
            genderPreference: missingGenderPref
          }
        });
      }

      if (missingFacilities) {
        steps.push({
          id: 'facilities',
          label: 'Clinic Facilities',
          icon: Building2
        });
      }

      if (missingAvailability) {
        steps.push({
          id: 'availability',
          label: 'Availability',
          icon: Clock
        });
      }

      if (missingDiseaseImages || missingClinicImages) {
        steps.push({
          id: 'gallery',
          label: 'Gallery Uploads',
          icon: ImageIcon,
          fields: {
            diseaseImages: missingDiseaseImages,
            clinicImages: missingClinicImages
          }
        });
      }

      setStepsNeeded(steps);
      setCurrentStepIndex(0);

    } catch (err) {
      console.error('Failed to load doctor profile details for onboarding:', err);
      toast.error('Could not load profile details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Preferences Add/Remove Handlers
  const addKeyword = (word) => {
    const trimmed = word.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (word) => {
    setKeywords(prev => prev.filter(w => w !== word));
  };

  const addLanguage = (lang) => {
    const trimmed = lang.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages(prev => [...prev, trimmed]);
      setLanguageInput('');
    }
  };

  const removeLanguage = (lang) => {
    setLanguages(prev => prev.filter(l => l !== lang));
  };

  // Step 2: Facilities Handlers
  const toggleFacility = (key) => {
    setFacilities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Step 3: Availability Handlers
  const updateAvailabilityDay = (index, field, value) => {
    const updated = [...weeklyAvailability];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setWeeklyAvailability(updated);
  };

  // Step 4: File Upload Handlers
  const handleImageUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const setUploading = type === 'disease' ? setUploadingDisease : setUploadingClinic;
    const setImagesList = type === 'disease' ? setDiseaseImages : setClinicImages;

    setUploading(true);

    for (const file of files) {
      try {
        const uploadToastId = toast.loading(`Uploading ${file.name}...`);
        const res = await uploadGalleryImage(file);
        
        let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002/api';
        baseUrl = baseUrl.replace('/api', '');
        const url = `${baseUrl}/${res.url}`;

        setImagesList(prev => [...prev, url]);
        toast.success(`${file.name} uploaded successfully!`, { id: uploadToastId });
      } catch (err) {
        console.error('File upload failed:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
  };

  const removeImage = (type, index) => {
    const setImagesList = type === 'disease' ? setDiseaseImages : setClinicImages;
    setImagesList(prev => prev.filter((_, idx) => idx !== index));
    toast.success('Image removed');
  };

  // Validation before going to next step or submitting
  const validateStep = (step) => {
    if (!step) return true;

    if (step.id === 'preferences') {
      if (step.fields.keywords && keywords.length === 0) {
        toast.error('Please add at least one specialisation search keyword');
        return false;
      }
      if (step.fields.languages && languages.length === 0) {
        toast.error('Please specify at least one language you speak');
        return false;
      }
    }

    if (step.id === 'availability') {
      const activeDays = weeklyAvailability.filter(day => !day.isOff);
      if (activeDays.length === 0) {
        toast.error('Please configure at least one active work day under Weekly Availability');
        return false;
      }
    }

    if (step.id === 'gallery') {
      if (step.fields.diseaseImages && diseaseImages.length === 0) {
        toast.error('Please upload at least one Treatment Case image');
        return false;
      }
      if (step.fields.clinicImages && clinicImages.length === 0) {
        toast.error('Please upload at least one Clinic/Hospital photo');
        return false;
      }
    }

    return true;
  };

  // Form Submission
  const handleSubmit = async () => {
    const currentStep = stepsNeeded[currentStepIndex];
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    const onboardingToastId = toast.loading('Saving details...');

    try {
      // Build payloads dynamically based on what was actually requested/updated
      const payload = {};

      stepsNeeded.forEach(step => {
        if (step.id === 'preferences') {
          if (step.fields.keywords) payload.keywords = keywords;
          if (step.fields.languages) payload.languages = languages;
          if (step.fields.genderPreference) payload.genderPreference = genderPreference;
        }
        if (step.id === 'facilities') {
          payload.facilities = facilities;
        }
        if (step.id === 'availability') {
          payload.weeklyAvailability = weeklyAvailability;
        }
        if (step.id === 'gallery') {
          if (step.fields.diseaseImages) payload.diseaseImages = diseaseImages;
          if (step.fields.clinicImages) payload.clinicImages = clinicImages;
        }
      });

      await updateDoctorProfile(payload);
      toast.success('Onboarding complete!', { id: onboardingToastId });
      
      // Re-initialize session to refresh doctor's info and automatically redirect to dashboard
      await initializeSession();
    } catch (err) {
      console.error('Failed to save doctor onboarding profile:', err);
      toast.error(err.response?.data?.msg || 'Failed to complete profile registration.', { id: onboardingToastId });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    const currentStep = stepsNeeded[currentStepIndex];
    if (validateStep(currentStep)) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStepIndex(prev => prev - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="loader mx-auto"></div>
          <h2 className="text-xl font-bold text-gray-800 font-sans">Checking Profile Integrity...</h2>
          <p className="text-sm text-gray-500">Checking for missing profile specifications.</p>
        </div>
      </div>
    );
  }

  // Fallback if somehow there are no missing steps but page loaded
  if (stepsNeeded.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Already Complete</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            All your critical profile details are completely up to date. You can proceed directly to your clinical dashboard.
          </p>
          <button
            onClick={() => initializeSession()}
            className="w-full py-3 bg-primary hover:bg-secondary text-white rounded-xl font-bold transition shadow-md shadow-blue-100"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentStep = stepsNeeded[currentStepIndex];
  const isLastStep = currentStepIndex === stepsNeeded.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-50 via-gray-100 to-blue-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Onboarding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Complete Your Profile</h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm leading-relaxed">
            We noticed a few missing details on your clinical profile. Please complete them below to activate your listing.
          </p>
        </div>

        {/* Dynamic Steps Indicator */}
        {stepsNeeded.length > 1 && (
          <div className="mb-10 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-3xl mx-auto">
            <div className="relative flex justify-between items-center w-full">
              {/* Progress Line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-0">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${(currentStepIndex / (stepsNeeded.length - 1)) * 100}%` }}
                ></div>
              </div>

              {/* Step Bubbles */}
              {stepsNeeded.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <button 
                      onClick={() => idx < currentStepIndex ? setCurrentStepIndex(idx) : null}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold border-2 ${
                        isCompleted 
                          ? 'bg-primary border-primary text-white' 
                          : isActive 
                            ? 'bg-white border-primary text-primary shadow-lg shadow-blue-100 scale-110' 
                            : 'bg-white border-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <Check size={18} strokeWidth={3} /> : idx + 1}
                    </button>
                    <span className={`text-xs mt-2 font-bold ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Box */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden min-h-[460px] flex flex-col justify-between">
          <div className="p-8 md:p-10">
            <AnimatePresence mode="wait">
              
              {/* STEP: PREFERENCES */}
              {currentStep.id === 'preferences' && (
                <motion.div
                  key="step-pref"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                      <Tag className="text-primary" size={24} /> Practice Preferences & Details
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Provide keywords and languages to help matching patients locate your clinic.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Search Keywords (Only shown if missing) */}
                    {currentStep.fields.keywords ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                          <label className="block text-sm font-bold text-gray-700">Specialty Keywords <span className="text-red-500">*</span></label>
                          <span className="text-xs text-gray-400 font-semibold">{keywords.length} added</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. fever, headache, pediatrics"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword(keywordInput))}
                            className="input-field shadow-sm text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => addKeyword(keywordInput)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl border border-blue-200 font-bold transition flex items-center gap-1 shrink-0 text-sm"
                          >
                            <Plus size={18} /> Add
                          </button>
                        </div>

                        {/* Display Keywords */}
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 min-h-[70px] items-center">
                          {keywords.length > 0 ? (
                            keywords.map((kw, i) => (
                              <span 
                                key={i} 
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-semibold shadow-inner"
                              >
                                {kw}
                                <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500 focus:outline-none">
                                  <X size={12} strokeWidth={2.5} />
                                </button>
                              </span>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                              <Info size={14} /> Add specialized medical keywords above.
                            </div>
                          )}
                        </div>

                        {/* Suggested Keywords */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Common Suggestions:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {SUGGESTED_KEYWORDS.filter(sk => !keywords.includes(sk)).slice(0, 6).map(sk => (
                              <button
                                key={sk}
                                type="button"
                                onClick={() => addKeyword(sk)}
                                className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-800 rounded-lg text-xs font-semibold transition"
                              >
                                + {sk}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50/40 border border-green-100 rounded-2xl p-6 flex flex-col justify-center text-center space-y-2">
                        <CheckCircle className="text-green-500 h-8 w-8 mx-auto" />
                        <h4 className="font-bold text-green-900 text-sm">Specialization Keywords Complete</h4>
                        <p className="text-xs text-green-700/80">You already configured {originalProfile?.keywords?.length || 0} search tags.</p>
                      </div>
                    )}

                    {/* Languages Spoken (Only shown if missing) */}
                    {currentStep.fields.languages ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                          <label className="block text-sm font-bold text-gray-700">Languages Spoken <span className="text-red-500">*</span></label>
                          <span className="text-xs text-gray-400 font-semibold">{languages.length} added</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. English, Hindi, Telugu"
                            value={languageInput}
                            onChange={(e) => setLanguageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage(languageInput))}
                            className="input-field shadow-sm text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => addLanguage(languageInput)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl border border-blue-200 font-bold transition flex items-center gap-1 shrink-0 text-sm"
                          >
                            <Plus size={18} /> Add
                          </button>
                        </div>

                        {/* Display Languages */}
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 min-h-[70px] items-center">
                          {languages.length > 0 ? (
                            languages.map((l, i) => (
                              <span 
                                key={i} 
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-full text-xs font-semibold shadow-inner"
                              >
                                {l}
                                <button type="button" onClick={() => removeLanguage(l)} className="hover:text-red-500 focus:outline-none">
                                  <X size={12} strokeWidth={2.5} />
                                </button>
                              </span>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                              <Info size={14} /> Add languages you consult in.
                            </div>
                          )}
                        </div>

                        {/* Suggested Languages */}
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Common Suggestions:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {SUGGESTED_LANGUAGES.filter(sl => !languages.includes(sl)).slice(0, 6).map(sl => (
                              <button
                                key={sl}
                                type="button"
                                onClick={() => addLanguage(sl)}
                                className="px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-800 rounded-lg text-xs font-semibold transition"
                              >
                                + {sl}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50/40 border border-green-100 rounded-2xl p-6 flex flex-col justify-center text-center space-y-2">
                        <CheckCircle className="text-green-500 h-8 w-8 mx-auto" />
                        <h4 className="font-bold text-green-900 text-sm">Languages Spoken Complete</h4>
                        <p className="text-xs text-green-700/80">You already configured {originalProfile?.languages?.length || 0} languages.</p>
                      </div>
                    )}

                    {/* Patient Gender Preference (Only shown if missing) */}
                    {currentStep.fields.genderPreference && (
                      <div className="md:col-span-2 bg-gradient-to-r from-blue-50/40 to-indigo-50/40 p-6 rounded-2xl border border-blue-100 mt-2">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Users className="text-blue-600" size={18} /> Patient Gender Consultation Preference <span className="text-red-500">*</span></h4>
                            <p className="text-xs text-gray-500">Configure if you consult both male & female patients or specific gender groups.</p>
                          </div>
                          <select
                            value={genderPreference}
                            onChange={(e) => setGenderPreference(e.target.value)}
                            className="w-full md:w-64 px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-semibold text-gray-700 transition cursor-pointer"
                          >
                            <option value="Both">Both (Male & Female)</option>
                            <option value="Male">Male Patients Only</option>
                            <option value="Female">Female Patients Only</option>
                          </select>
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}

              {/* STEP: CLINIC FACILITIES */}
              {currentStep.id === 'facilities' && (
                <motion.div
                  key="step-facilities"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                      <Building2 className="text-primary" size={24} /> Step 2: Clinic Facilities
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Configure diagnostic facilities and amenities available at your clinical workspace.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {FACILITY_OPTIONS.map(facility => {
                      const isSelected = facilities[facility.key];

                      return (
                        <div
                          key={facility.key}
                          onClick={() => toggleFacility(facility.key)}
                          className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-300 relative flex flex-col justify-between min-h-[140px] hover:shadow-md ${
                            isSelected
                              ? 'bg-green-50/50 border-green-200 ring-2 ring-green-500/20'
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-sm font-extrabold ${isSelected ? 'text-green-800' : 'text-gray-800'}`}>
                                {facility.label}
                              </span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors duration-200 shrink-0 ${
                                isSelected 
                                  ? 'bg-green-500 border-green-600 text-white' 
                                  : 'bg-white border-gray-300 group-hover:border-gray-400'
                              }`}>
                                {isSelected && <Check size={12} strokeWidth={3} />}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed pr-2">
                              {facility.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP: AVAILABILITY */}
              {currentStep.id === 'availability' && (
                <motion.div
                  key="step-availability"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                      <Clock className="text-primary" size={24} /> Step 3: Weekly Availability Schedule
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Select your daily consulting days, operational times, and patient consultation slots.</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-inner">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                            <th className="p-4 pl-6">Day</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4">Working Hours</th>
                            <th className="p-4">Lunch Break</th>
                            <th className="p-4">Slot Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {weeklyAvailability.map((sched, idx) => (
                            <tr 
                              key={sched.day}
                              className={`transition-colors duration-150 ${sched.isOff ? 'bg-gray-50/40 text-gray-400' : 'hover:bg-gray-50/50'}`}
                            >
                              {/* Day Name */}
                              <td className="p-4 pl-6 font-bold text-sm text-gray-800">
                                {sched.day}
                              </td>

                              {/* Toggle Status */}
                              <td className="p-4 text-center">
                                <label className="relative inline-flex items-center cursor-pointer justify-center">
                                  <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={!sched.isOff}
                                    onChange={(e) => updateAvailabilityDay(idx, 'isOff', !e.target.checked)}
                                  />
                                  <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <div className={`text-[9px] font-extrabold uppercase mt-1 ${!sched.isOff ? 'text-primary' : 'text-gray-400'}`}>
                                  {!sched.isOff ? 'Active' : 'Closed'}
                                </div>
                              </td>

                              {/* Work Timings */}
                              <td className="p-4">
                                <div className={`flex items-center gap-1.5 text-xs ${sched.isOff ? 'opacity-40 pointer-events-none' : ''}`}>
                                  <div className="relative">
                                    <input
                                      type="time"
                                      value={sched.startTime}
                                      onChange={(e) => updateAvailabilityDay(idx, 'startTime', e.target.value)}
                                      className="px-2.5 py-1.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary outline-none font-semibold text-gray-700 bg-white"
                                    />
                                    <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-bold text-gray-400">Start</span>
                                  </div>
                                  <span className="text-gray-400">to</span>
                                  <div className="relative">
                                    <input
                                      type="time"
                                      value={sched.endTime}
                                      onChange={(e) => updateAvailabilityDay(idx, 'endTime', e.target.value)}
                                      className="px-2.5 py-1.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary outline-none font-semibold text-gray-700 bg-white"
                                    />
                                    <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-bold text-gray-400">End</span>
                                  </div>
                                </div>
                              </td>

                              {/* Lunch Break */}
                              <td className="p-4">
                                <div className={`flex items-center gap-1.5 text-xs ${sched.isOff ? 'opacity-40 pointer-events-none' : ''}`}>
                                  <div className="relative">
                                    <input
                                      type="time"
                                      value={sched.lunchStart || '13:00'}
                                      onChange={(e) => updateAvailabilityDay(idx, 'lunchStart', e.target.value)}
                                      className="px-2 py-1.5 border border-blue-100 bg-blue-50/10 rounded-xl outline-none text-gray-600"
                                    />
                                  </div>
                                  <span className="text-gray-300">-</span>
                                  <div className="relative">
                                    <input
                                      type="time"
                                      value={sched.lunchEnd || '14:00'}
                                      onChange={(e) => updateAvailabilityDay(idx, 'lunchEnd', e.target.value)}
                                      className="px-2 py-1.5 border border-blue-100 bg-blue-50/10 rounded-xl outline-none text-gray-600"
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Duration */}
                              <td className="p-4">
                                <div className={`relative w-20 text-xs ${sched.isOff ? 'opacity-40 pointer-events-none' : ''}`}>
                                  <input
                                    type="number"
                                    min="10"
                                    max="120"
                                    step="5"
                                    value={sched.slotDuration}
                                    onChange={(e) => updateAvailabilityDay(idx, 'slotDuration', parseInt(e.target.value) || 30)}
                                    className="w-full pl-3 pr-8 py-1.5 border border-gray-200 rounded-xl font-bold text-center outline-none text-gray-800"
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">min</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP: GALLERY */}
              {currentStep.id === 'gallery' && (
                <motion.div
                  key="step-gallery"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                      <ImageIcon className="text-primary" size={24} /> Step 4: Photo Gallery & Workspace
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Upload premium visuals of your clinical space and previous treatments.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Disease / Case Images (Only if missing) */}
                    {currentStep.fields.diseaseImages ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                          <label className="block text-sm font-extrabold text-gray-700">Treatment Case Images <span className="text-red-500">*</span></label>
                          <span className="text-xs text-gray-400 font-semibold">{diseaseImages.length} uploaded</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed -mt-2">Provide visual references of cases or clinical machinery. (Minimum 1 image required)</p>

                        <div className="flex flex-wrap gap-4 mt-2">
                          {diseaseImages.map((img, idx) => (
                            <div key={idx} className="relative group w-24 h-24 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                              <img src={img} alt="Treatment case" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage('disease', idx)}
                                className="absolute inset-0 bg-red-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold text-xs gap-1"
                              >
                                <X size={14} strokeWidth={3} /> Delete
                              </button>
                            </div>
                          ))}

                          {uploadingDisease ? (
                            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary bg-blue-50/20 flex flex-col items-center justify-center gap-1">
                              <div className="loader loader-sm"></div>
                              <span className="text-[10px] font-bold text-primary">Uploading...</span>
                            </div>
                          ) : (
                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary bg-gray-50/30 hover:bg-blue-50/30 rounded-2xl cursor-pointer transition-all duration-200">
                              <UploadCloud size={24} className="text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-500 mt-1">Upload</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'disease')}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50/40 border border-green-100 rounded-2xl p-6 flex flex-col justify-center text-center space-y-2">
                        <CheckCircle className="text-green-500 h-8 w-8 mx-auto" />
                        <h4 className="font-bold text-green-900 text-sm">Treatment Case Gallery Complete</h4>
                        <p className="text-xs text-green-700/80">You already uploaded {originalProfile?.diseaseImages?.length || 0} case reference photos.</p>
                      </div>
                    )}

                    {/* Clinic Photos (Only if missing) */}
                    {currentStep.fields.clinicImages ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                          <label className="block text-sm font-extrabold text-gray-700">Clinic / Hospital Photos <span className="text-red-500">*</span></label>
                          <span className="text-xs text-gray-400 font-semibold">{clinicImages.length} uploaded</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed -mt-2">Upload visual references of clinic spaces, lounges, or consult rooms. (Minimum 1 image required)</p>

                        <div className="flex flex-wrap gap-4 mt-2">
                          {clinicImages.map((img, idx) => (
                            <div key={idx} className="relative group w-24 h-24 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                              <img src={img} alt="Clinic view" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage('clinic', idx)}
                                className="absolute inset-0 bg-red-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold text-xs gap-1"
                              >
                                <X size={14} strokeWidth={3} /> Delete
                              </button>
                            </div>
                          ))}

                          {uploadingClinic ? (
                            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary bg-blue-50/20 flex flex-col items-center justify-center gap-1">
                              <div className="loader loader-sm"></div>
                              <span className="text-[10px] font-bold text-primary">Uploading...</span>
                            </div>
                          ) : (
                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary bg-gray-50/30 hover:bg-blue-50/30 rounded-2xl cursor-pointer transition-all duration-200">
                              <UploadCloud size={24} className="text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-500 mt-1">Upload</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, 'clinic')}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50/40 border border-green-100 rounded-2xl p-6 flex flex-col justify-center text-center space-y-2">
                        <CheckCircle className="text-green-500 h-8 w-8 mx-auto" />
                        <h4 className="font-bold text-green-900 text-sm">Clinic Photo Gallery Complete</h4>
                        <p className="text-xs text-green-700/80">You already uploaded {originalProfile?.clinicImages?.length || 0} clinic photos.</p>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={submitting}
                className="px-6 py-2.5 border border-gray-200 hover:bg-gray-100 rounded-xl font-bold text-gray-700 transition flex items-center gap-1 text-sm disabled:opacity-50"
              >
                <ChevronLeft size={16} strokeWidth={2.5} /> Back
              </button>
            ) : (
              <div></div>
            )}

            {!isLastStep ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 bg-primary hover:bg-secondary text-white rounded-xl font-bold shadow-md shadow-blue-100 transition flex items-center gap-1 text-sm"
              >
                Next <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || uploadingDisease || uploadingClinic}
                className="px-8 py-3 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold shadow-lg shadow-green-100/50 transition flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="loader loader-sm loader-white"></div> Saving Details...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} /> Complete Onboarding
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
