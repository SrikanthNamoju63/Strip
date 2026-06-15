import React, { useEffect, useState } from 'react';
import { getDoctorProfile, updateDoctorProfile, onboardDoctorToRazorpay, uploadGalleryImage } from '../services/api';
import { Mail, Phone, MapPin, Award, Clock, IndianRupee, BookOpen, Building2, CreditCard, Edit2, Save, X, CheckCircle, Tag, Search, CheckSquare, Globe, Plus, Users, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import DoctorQRCode from '../components/DoctorQRCode';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Separate Edit States
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [editData, setEditData] = useState({});

    // Staff Management States
    const [staffList, setStaffList] = useState([]);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [newStaffData, setNewStaffData] = useState({ name: '', email: '', phone: '', password: '', role: 'RECEPTIONIST' });
    const [showStaffPassword, setShowStaffPassword] = useState(false);
    const [staffPasswordDisplayValue, setStaffPasswordDisplayValue] = useState('');
    const [staffPasswordMaskTimeout, setStaffPasswordMaskTimeout] = useState(null);

    const fetchStaff = async () => {
        try {
            const { getDoctorStaff } = await import('../services/api');
            const data = await getDoctorStaff();
            setStaffList(data);
        } catch (e) {
            console.error('Failed to fetch staff:', e);
        }
    };

    const handleNewStaffChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const digits = value.replace(/\D/g, '').slice(0, 10);
            setNewStaffData(prev => ({ ...prev, phone: digits }));
            return;
        }
        setNewStaffData(prev => ({ ...prev, [name]: value }));
    };

    const handleStaffPasswordChange = (e) => {
        const val = e.target.value;
        
        if (showStaffPassword) {
            setNewStaffData(prev => ({ ...prev, password: val }));
            setStaffPasswordDisplayValue(val);
            return;
        }

        if (val.length === 0) {
            setNewStaffData(prev => ({ ...prev, password: '' }));
            setStaffPasswordDisplayValue('');
            if (staffPasswordMaskTimeout) clearTimeout(staffPasswordMaskTimeout);
            return;
        }

        if (!val.includes('•')) {
            setNewStaffData(prev => ({ ...prev, password: val }));
            const maskedPart = '•'.repeat(val.length - 1);
            const lastChar = val.charAt(val.length - 1);
            setStaffPasswordDisplayValue(maskedPart + lastChar);

            if (staffPasswordMaskTimeout) clearTimeout(staffPasswordMaskTimeout);

            const timer = setTimeout(() => {
                setStaffPasswordDisplayValue('•'.repeat(val.length));
            }, 800);
            setStaffPasswordMaskTimeout(timer);
            return;
        }

        let newReal = '';
        const rawPassword = newStaffData.password;
        if (val.length < rawPassword.length) {
            newReal = rawPassword.slice(0, val.length);
        } else {
            const addedLength = val.length - rawPassword.length;
            const addedText = val.slice(val.length - addedLength);
            newReal = rawPassword + addedText;
        }

        setNewStaffData(prev => ({ ...prev, password: newReal }));

        const maskedPart = '•'.repeat(newReal.length - 1);
        const lastChar = newReal.charAt(newReal.length - 1);
        setStaffPasswordDisplayValue(maskedPart + lastChar);

        if (staffPasswordMaskTimeout) clearTimeout(staffPasswordMaskTimeout);

        const timer = setTimeout(() => {
            setStaffPasswordDisplayValue('•'.repeat(newReal.length));
        }, 800);
        setStaffPasswordMaskTimeout(timer);
    };

    const toggleShowStaffPassword = () => {
        const nextShow = !showStaffPassword;
        setShowStaffPassword(nextShow);
        const rawPassword = newStaffData.password;
        if (nextShow) {
            setStaffPasswordDisplayValue(rawPassword);
        } else {
            setStaffPasswordDisplayValue('•'.repeat(rawPassword.length));
        }
    };

    const handleCreateStaff = async () => {
        const { name, email, phone, password } = newStaffData;
        if (!name || !email || !phone || !password) {
            toast.error("Please fill in all staff fields.");
            return;
        }

        if (phone.length !== 10) {
            toast.error("Phone number must be exactly 10 digits.");
            return;
        }

        try {
            const { addDoctorStaff } = await import('../services/api');
            const created = await addDoctorStaff(newStaffData);
            setShowAddStaffModal(false);
            setNewStaffData({ name: '', email: '', phone: '', password: '', role: 'RECEPTIONIST' });
            setStaffPasswordDisplayValue('');
            setShowStaffPassword(false);
            fetchStaff();
            toast.success(`Staff Account Created Successfully!\nLogin ID: ${created.staffId || 'N/A'}`);
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.msg || "Failed to create staff account");
        }
    };

    const handleDeleteStaff = async (staffId) => {
        if (!confirm("Are you sure you want to delete this staff member? This will immediately revoke their access.")) return;
        try {
            const { deleteDoctorStaff } = await import('../services/api');
            await deleteDoctorStaff(staffId);
            toast.success("Staff account deleted!");
            fetchStaff();
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete staff account");
        }
    };

    useEffect(() => {
        fetchProfile();
        if (user?.role === 'DOCTOR') {
            fetchStaff();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const data = await getDoctorProfile();
            if (!data.keywords) data.keywords = [];
            if (!data.languages) data.languages = [];
            if (!data.facilities) data.facilities = {};
            setProfile(data);
            setEditData(JSON.parse(JSON.stringify(data))); // Deep copy
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileEditToggle = () => {
        if (isEditingProfile) {
            // Cancelled
            setEditData(prev => ({ ...prev, ...profile, clinicAddress: profile.clinicAddress })); // Revert main fields
        }
        setIsEditingProfile(!isEditingProfile);
    };

    const handleBankEditToggle = () => {
        if (isEditingBank) {
            // Cancelled
            setEditData(prev => ({ ...prev, bankDetails: profile.bankDetails })); // Revert bank fields
        }
        setIsEditingBank(!isEditingBank);
    };

    const handleInputChange = (e, section = null) => {
        const { name, value } = e.target;
        if (section) {
            setEditData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [name]: value
                }
            }));
        } else {
            setEditData(prev => ({ ...prev, [name]: value }));
        }
    };

    const verifyIFSC = async () => {
        const ifsc = editData.bankDetails?.ifscCode;
        if (!ifsc || ifsc.length !== 11) {
            toast.error("Please enter a valid 11-digit IFSC code");
            return;
        }
        try {
            const res = await axios.get(`https://ifsc.razorpay.com/${ifsc}`);
            setEditData(prev => ({
                ...prev,
                bankDetails: {
                    ...prev.bankDetails,
                    bankName: res.data.BANK,
                    branchName: res.data.BRANCH
                }
            }));
            toast.success(`Verified: ${res.data.BANK}, ${res.data.BRANCH}`);
        } catch (e) {
            toast.error("Invalid IFSC Code");
        }
    };

    const handleSaveProfile = async () => {
        try {
            // Only send relevant fields if needed, but sending whole object is usually fine if backend handles partials
            const updatedProfile = await updateDoctorProfile(editData);
            setProfile(updatedProfile);
            setEditData(JSON.parse(JSON.stringify(updatedProfile)));
            setIsEditingProfile(false);
            toast.success("Profile Details Updated!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to update profile");
        }
    };

    const handleSaveBank = async () => {
        try {
            const updatedProfile = await updateDoctorProfile({ bankDetails: editData.bankDetails });
            setProfile(updatedProfile);
            setEditData(JSON.parse(JSON.stringify(updatedProfile)));
            setIsEditingBank(false);
            toast.success("Bank Details Updated!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to update bank details");
        }
    };

    const handleActivatePayouts = async () => {
        try {
            if (!confirm("Are you sure you want to activate payouts? This will link your bank account to our payment partner.")) return;

            await onboardDoctorToRazorpay();
            toast.success("Payout Activation Initiated! Please allow some time for verification.");
            fetchProfile(); // Refresh to see status
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Activation Failed");
        }
    };

    const addKeyword = () => {
        const keyword = prompt("Enter a search keyword (e.g. 'fever', 'heart specialist'):");
        if (keyword && keyword.trim()) {
            setEditData(prev => ({
                ...prev,
                keywords: [...(prev.keywords || []), keyword.trim()]
            }));
        }
    };

    const removeKeyword = (index) => {
        setEditData(prev => ({
            ...prev,
            keywords: prev.keywords.filter((_, i) => i !== index)
        }));
    };

    const addLanguage = () => {
        const lang = prompt("Enter a language (e.g. 'English', 'Hindi'):");
        if (lang && lang.trim()) {
            setEditData(prev => ({
                ...prev,
                languages: [...(prev.languages || []), lang.trim()]
            }));
        }
    };

    const removeLanguage = (index) => {
        setEditData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index)
        }));
    };

    const handleImageUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            toast.loading("Uploading image...", { id: 'upload-toast' });
            const res = await uploadGalleryImage(file);
            let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:6002/api';
            baseUrl = baseUrl.replace('/api', '');
            const url = `${baseUrl}/${res.url}`;

            setEditData(prev => ({
                ...prev,
                [type]: [...(prev[type] || []), url]
            }));
            toast.success("Image uploaded!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload image");
        } finally {
            toast.dismiss('upload-toast');
        }
    };

    const removeGalleryImage = (type, index) => {
        setEditData(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const toggleFacility = (facility) => {
        setEditData(prev => ({
            ...prev,
            facilities: {
                ...prev.facilities,
                [facility]: !prev.facilities?.[facility]
            }
        }));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="loader"></div>
        </div>
    );

    if (!profile) return <div>Failed to load profile.</div>;

    // Derived display data
    const { clinicAddress, educationDetails, bankDetails } = editData;

    return (
        <div className="max-w-4xl mx-auto pb-10">
            {/* Header Section (Main Profile) */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 relative group">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32"></div>

                {/* Main Profile Edit Button */}
                {user?.role === 'DOCTOR' && (
                    <button
                        onClick={handleProfileEditToggle}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 transition z-10"
                    >
                        {isEditingProfile ? <X size={18} /> : <Edit2 size={18} />}
                        {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                    </button>
                )}

                {user?.role === 'DOCTOR' && isEditingProfile && (
                    <button
                        onClick={handleSaveProfile}
                        className="absolute top-4 right-32 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 transition z-10 shadow-lg"
                    >
                        <Save size={18} /> Save
                    </button>
                )}

                <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-16 gap-6 relative">
                    <div className="relative">
                        {editData.doctorPhoto ? (
                            <img
                                src={editData.doctorPhoto}
                                alt={editData.name}
                                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md bg-white"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500 shadow-md">
                                {editData.name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left mb-2 w-full">
                        {isEditingProfile ? (
                            <div className="space-y-2 mt-4 md:mt-0 max-w-md">
                                <label className="text-xs text-gray-500 uppercase font-bold">Full Name</label>
                                <input type="text" name="name" value={editData.name} onChange={handleInputChange} className="input-field font-bold text-xl mb-2" placeholder="Full Name" />

                                <label className="text-xs text-gray-500 uppercase font-bold">Specialization</label>
                                <input type="text" name="specialization" value={editData.specialization} onChange={handleInputChange} className="input-field text-blue-600" placeholder="Specialization" />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                                <p className="text-blue-600 font-medium text-lg">{profile.specialization}</p>
                            </>
                        )}

                        <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start text-sm text-gray-600">
                            <span className="flex items-center gap-1"><Mail size={16} /> {profile.email}</span>
                            <span className="flex items-center gap-1"><Phone size={16} /> {profile.personalPhone}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="col-span-2 space-y-6">

                    {/* Bio */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <BookOpen className="text-blue-600" size={20} /> About Me
                        </h2>
                        {isEditingProfile ? (
                            <textarea
                                name="bio"
                                value={editData.bio || ''}
                                onChange={handleInputChange}
                                className="input-field h-32"
                                placeholder="Write a short bio..."
                            />
                        ) : (
                            <p className="text-gray-600 leading-relaxed text-justify">{profile.bio || "No bio added yet."}</p>
                        )}
                    </div>

                    {/* Search Keywords */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Search className="text-blue-600" size={20} /> Search Keywords
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {/* Display Keywords */}
                            {((isEditingProfile ? editData.keywords : profile.keywords) || []).map((keyword, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full flex items-center gap-1 border border-blue-100">
                                    <Tag size={12} /> {keyword}
                                    {isEditingProfile && (
                                        <button onClick={() => removeKeyword(index)} className="hover:text-red-500 ml-1">
                                            <X size={12} />
                                        </button>
                                    )}
                                </span>
                            ))}

                            {/* Add Button */}
                            {isEditingProfile && (
                                <button
                                    onClick={addKeyword}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-full flex items-center gap-1 border border-gray-200 transition"
                                >
                                    + Add Keyword
                                </button>
                            )}

                            {/* Empty State */}
                            {(!profile.keywords || profile.keywords.length === 0) && !isEditingProfile && (
                                <p className="text-gray-500 text-sm italic">No keywords added.</p>
                            )}
                        </div>
                    </div>

                    {/* Languages Spoken */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Globe className="text-purple-600" size={20} /> Languages Spoken
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {((isEditingProfile ? editData.languages : profile.languages) || []).map((lang, index) => (
                                <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-semibold rounded-full flex items-center gap-1 border border-purple-100">
                                    {lang}
                                    {isEditingProfile && (
                                        <button onClick={() => removeLanguage(index)} className="hover:text-red-500 ml-1">
                                            <X size={12} />
                                        </button>
                                    )}
                                </span>
                            ))}

                            {isEditingProfile && (
                                <button
                                    onClick={addLanguage}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-full flex items-center gap-1 border border-gray-200 transition"
                                >
                                    + Add Language
                                </button>
                            )}

                            {(!profile.languages || profile.languages.length === 0) && !isEditingProfile && (
                                <p className="text-gray-500 text-sm italic">No languages added.</p>
                            )}
                        </div>
                    </div>

                    {/* Clinic Facilities */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <CheckSquare className="text-green-600" size={20} /> Clinic Facilities
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {['labAvailable', 'scanAvailable', 'pharmacyAvailable', 'bloodTestAvailable', 'ecgAvailable', 'xRayAvailable', 'wheelchairAccess', 'parkingAvailable'].map((facility) => {
                                const isAvailable = isEditingProfile 
                                    ? editData.facilities?.[facility] 
                                    : profile.facilities?.[facility];
                                
                                // Format label from camelCase
                                const label = facility.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                                return (
                                    <div 
                                        key={facility} 
                                        onClick={() => isEditingProfile && toggleFacility(facility)}
                                        className={`flex items-center gap-2 p-2 rounded-lg border ${
                                            isAvailable 
                                                ? 'bg-green-50 border-green-200 text-green-800' 
                                                : isEditingProfile 
                                                    ? 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 cursor-pointer' 
                                                    : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'
                                        } ${isEditingProfile ? 'cursor-pointer transition-colors' : ''}`}
                                    >
                                        <div className={`w-4 h-4 rounded shadow-sm border flex items-center justify-center ${
                                            isAvailable ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-300'
                                        }`}>
                                            {isAvailable && <CheckSquare size={12} fill="currentColor" className="text-green-500" stroke="white" />}
                                        </div>
                                        <span className="text-sm font-semibold">{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bank Account & Payouts */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <CreditCard className="text-blue-600" size={20} /> Bank & Payout Settings
                            </h2>
                            {user?.role === 'DOCTOR' && (
                                <div className="flex gap-2">
                                    {isEditingBank ? (
                                        <>
                                            <button onClick={handleBankEditToggle} className="text-gray-500 hover:text-gray-700 p-2 rounded-full bg-gray-100">
                                                <X size={18} />
                                            </button>
                                            <button onClick={handleSaveBank} className="text-green-600 hover:text-green-700 flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 font-bold border border-green-200">
                                                <Save size={16} /> Save
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={handleBankEditToggle} className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium">
                                            <Edit2 size={16} /> Edit Details
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payout Status Banner */}
                        <div className="mb-6">
                            {bankDetails?.razorpayAccountId ? (
                                <div className={`p-4 rounded-xl border flex items-center justify-between ${bankDetails?.kycStatus === 'ACTIVE'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${bankDetails?.kycStatus === 'ACTIVE' ? 'bg-green-100' : 'bg-yellow-100'
                                            }`}>
                                            {bankDetails?.kycStatus === 'ACTIVE' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Payout Account {bankDetails?.kycStatus === 'ACTIVE' ? 'Active' : 'Pending Activation'}</p>
                                            <p className="text-xs opacity-80">ID: {bankDetails?.razorpayAccountId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold uppercase tracking-wider block">KYC Status</span>
                                        <span className="font-bold">{bankDetails?.kycStatus || 'PENDING'}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-gray-200 text-gray-500">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700 text-sm">Payouts Not Configured</p>
                                            <p className="text-xs text-gray-500">Link your bank account to receive payments.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleActivatePayouts}
                                        disabled={!bankDetails?.accountNumber || !bankDetails?.ifscCode}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition ${!bankDetails?.accountNumber
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        Activate Payouts
                                    </button>
                                </div>
                            )}
                        </div>

                        {isEditingBank ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Account Holder Name</label>
                                    <input
                                        type="text"
                                        name="accountHolderName"
                                        value={editData.bankDetails?.accountHolderName || ''}
                                        onChange={(e) => handleInputChange(e, 'bankDetails')}
                                        className="input-field mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Account Number</label>
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={editData.bankDetails?.accountNumber || ''}
                                        onChange={(e) => handleInputChange(e, 'bankDetails')}
                                        className="input-field mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">IFSC Code</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="ifscCode"
                                            value={editData.bankDetails?.ifscCode || ''}
                                            onChange={(e) => handleInputChange(e, 'bankDetails')}
                                            className="input-field mt-1 uppercase"
                                            maxLength={11}
                                        />
                                        <button onClick={verifyIFSC} className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold mt-1 hover:bg-blue-700 shadow-sm">Verify</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Bank Name</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={editData.bankDetails?.bankName || ''}
                                        readOnly
                                        className="input-field mt-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                                        placeholder="Auto-filled"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Branch</label>
                                    <input
                                        type="text"
                                        name="branchName"
                                        value={editData.bankDetails?.branchName || ''}
                                        readOnly
                                        className="input-field mt-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                                        placeholder="Auto-filled"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 opacity-90">
                                {bankDetails?.accountNumber ? (
                                    <>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Bank</label>
                                            <p className="font-medium text-gray-900">{bankDetails.bankName}</p>
                                            <p className="text-sm text-gray-500">{bankDetails.branchName}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Account Holder</label>
                                            <p className="font-medium text-gray-900">{bankDetails.accountHolderName}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Account Number</label>
                                            <p className="font-medium text-gray-900 font-mono tracking-wider">
                                                •••• {bankDetails.accountNumber.slice(-4)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">IFSC</label>
                                            <p className="font-medium text-gray-900 font-mono">{bankDetails.ifscCode}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-2 text-center py-4">
                                        <p className="text-gray-500 text-sm italic">Enter bank details to enable payouts.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Clinic Details */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Building2 className="text-blue-600" size={20} /> Hospital / Clinic
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Hospital Name</label>
                                {isEditingProfile ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={clinicAddress?.name || ''}
                                        onChange={(e) => handleInputChange(e, 'clinicAddress')}
                                        className="input-field mt-1"
                                    />
                                ) : (
                                    <p className="font-medium text-gray-900">{clinicAddress?.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Hospital Phone</label>
                                {isEditingProfile ? (
                                    <input type="text" name="hospitalPhone" value={editData.hospitalPhone || ''} onChange={handleInputChange} className="input-field mt-1" />
                                ) : (
                                    <p className="font-medium text-gray-900">{profile.hospitalPhone}</p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                                <p className="font-medium text-gray-900 flex items-start gap-2 mt-1">
                                    <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>
                                        {clinicAddress?.street}, {clinicAddress?.landmark}<br />
                                        {clinicAddress?.city}, {clinicAddress?.district}<br />
                                        {clinicAddress?.state} - {clinicAddress?.pincode}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Education (Read Only) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Award className="text-blue-600" size={20} /> Education & Verification
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-bold text-gray-900">{profile.education}</p>
                                    <p className="text-gray-600">{educationDetails?.college}</p>
                                </div>
                                <div className="text-right">
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                        Class of {educationDetails?.yearOfPassing}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gender Preference */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <CheckCircle className="text-pink-600" size={20} /> Patient Gender Preference
                        </h2>
                        {isEditingProfile ? (
                            <select
                                name="genderPreference"
                                value={editData.genderPreference || 'Both'}
                                onChange={handleInputChange}
                                className="input-field"
                            >
                                <option value="Both">Both (Male & Female)</option>
                                <option value="Male">Male Only</option>
                                <option value="Female">Female Only</option>
                            </select>
                        ) : (
                            <p className="text-gray-600 font-medium">{profile.genderPreference || 'Both (Male & Female)'}</p>
                        )}
                    </div>

                    {/* Image Gallery */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                            <Tag className="text-teal-600" size={20} /> Image Gallery
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">Treatment Cases Images</label>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {(isEditingProfile ? editData.diseaseImages : profile.diseaseImages)?.length > 0 ? (
                                        (isEditingProfile ? editData.diseaseImages : profile.diseaseImages).map((img, idx) => (
                                            <div key={idx} className="relative group w-24 h-24">
                                                <img src={img} alt="Treatment" className="w-full h-full object-cover rounded-lg shadow-sm border border-gray-200" />
                                                {isEditingProfile && (
                                                    <button onClick={() => removeGalleryImage('diseaseImages', idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs shadow-md hover:bg-red-600 transition">
                                                        <X size={12} strokeWidth={3} />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : !isEditingProfile && <p className="text-gray-500 text-sm italic">No treatment images</p>}

                                    {isEditingProfile && (
                                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition">
                                            <Plus size={24} className="text-gray-400" />
                                            <span className="text-xs text-gray-500 mt-1 font-semibold">Add Photo</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => handleImageUpload(e, 'diseaseImages')} 
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-2">Clinic / Hospital Photos</label>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {(isEditingProfile ? editData.clinicImages : profile.clinicImages)?.length > 0 ? (
                                        (isEditingProfile ? editData.clinicImages : profile.clinicImages).map((img, idx) => (
                                            <div key={idx} className="relative group w-24 h-24">
                                                <img src={img} alt="Clinic" className="w-full h-full object-cover rounded-lg shadow-sm border border-gray-200" />
                                                {isEditingProfile && (
                                                    <button onClick={() => removeGalleryImage('clinicImages', idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full text-xs shadow-md hover:bg-red-600 transition">
                                                        <X size={12} strokeWidth={3} />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : !isEditingProfile && <p className="text-gray-500 text-sm italic">No clinic photos</p>}

                                    {isEditingProfile && (
                                        <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition">
                                            <Plus size={24} className="text-gray-400" />
                                            <span className="text-xs text-gray-500 mt-1 font-semibold">Add Photo</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => handleImageUpload(e, 'clinicImages')} 
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staff / Receptionist Management Section */}
                    {user?.role === 'DOCTOR' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Users className="text-blue-600" size={20} /> Staff & Receptionists
                                </h2>
                                <button
                                    onClick={() => setShowAddStaffModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm"
                                >
                                    <Plus size={14} /> Add Staff
                                </button>
                            </div>

                            {staffList.length === 0 ? (
                                <p className="text-gray-500 text-sm italic py-2">No staff accounts created yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {staffList.map((staff) => (
                                        <div key={staff._id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-gray-950 text-sm">{staff.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {staff.email} • {staff.phone}
                                                    {staff.staffId && ` • ${staff.staffId}`}
                                                </p>
                                                <span className="inline-block px-2 py-0.5 mt-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold uppercase tracking-wider">{staff.role}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteStaff(staff._id)}
                                                className="text-red-500 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition"
                                                title="Delete Staff Account"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Right Column */}
                <div className="space-y-6">

                    {/* QR Code */}
                    <DoctorQRCode profile={profile} />

                    {/* Quick Stats */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-4">At a Glance</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 rounded-xl flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                                    <IndianRupee size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-green-800 font-semibold uppercase">Consultation Fee</p>
                                    {isEditingProfile ? (
                                        <input type="number" name="consultationFee" value={editData.consultationFee} onChange={handleInputChange} className="input-field mt-1 py-1 text-sm" />
                                    ) : (
                                        <p className="text-lg font-bold text-green-900">₹{profile.consultationFee}</p>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50 rounded-xl flex items-center gap-3">
                                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                    <Award size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-purple-800 font-semibold uppercase">Experience</p>
                                    {/* Experience is READ ONLY now even in edit mode */}
                                    <p className="text-lg font-bold text-purple-900">{profile.experience} Years</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Geographic Location */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <MapPin className="text-blue-600" size={20} /> Geographic Location
                        </h2>
                        {clinicAddress?.coordinates?.lat ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-blue-800 font-bold uppercase">Latitude</p>
                                        <p className="font-mono text-blue-900 font-medium">{clinicAddress.coordinates.lat}</p>
                                    </div>
                                    <div className="h-8 w-px bg-blue-200"></div>
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-blue-800 font-bold uppercase">Longitude</p>
                                        <p className="font-mono text-blue-900 font-medium">{clinicAddress.coordinates.lng}</p>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${clinicAddress.coordinates.lat},${clinicAddress.coordinates.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition text-sm"
                                >
                                    <MapPin size={16} /> View on Google Maps
                                </a>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed text-gray-400 text-sm">
                                <MapPin className="mx-auto mb-2 opacity-50" size={24} />
                                No GPS coordinates found
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Add Staff Modal */}
            {showAddStaffModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 relative">
                        <button
                            onClick={() => {
                                setShowAddStaffModal(false);
                                setNewStaffData({ name: '', email: '', phone: '', password: '', role: 'RECEPTIONIST' });
                                setStaffPasswordDisplayValue('');
                                setShowStaffPassword(false);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Users className="text-blue-600" size={24} /> Create Staff Login
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={newStaffData.name}
                                    onChange={handleNewStaffChange}
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Email (Username)</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={newStaffData.email}
                                    onChange={handleNewStaffChange}
                                    placeholder="name@example.com"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={newStaffData.phone}
                                    onChange={handleNewStaffChange}
                                    placeholder="10-digit number"
                                    maxLength={10}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
                                <div className="relative mt-1">
                                    <input
                                        type="text"
                                        name="password"
                                        value={showStaffPassword ? newStaffData.password : staffPasswordDisplayValue}
                                        onChange={handleStaffPasswordChange}
                                        placeholder="Choose password"
                                        className="w-full px-4 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-[#009999] transition-colors focus:outline-none"
                                        onClick={toggleShowStaffPassword}
                                    >
                                        {showStaffPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
                                <select
                                    name="role"
                                    value={newStaffData.role}
                                    onChange={handleNewStaffChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white outline-none mt-1"
                                >
                                    <option value="RECEPTIONIST">Receptionist</option>
                                    <option value="NURSE">Nurse / Assistant</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => {
                                    setShowAddStaffModal(false);
                                    setNewStaffData({ name: '', email: '', phone: '', password: '', role: 'RECEPTIONIST' });
                                    setStaffPasswordDisplayValue('');
                                    setShowStaffPassword(false);
                                }}
                                className="flex-1 px-4 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition border border-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateStaff}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-xl shadow-lg transition"
                            >
                                Create Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
