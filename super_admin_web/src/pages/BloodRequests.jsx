import React, { useEffect, useState } from 'react';
import { getBloodRequests, matchDonor, getAllDonors } from '../services/api'; // Ensure these are exported
import { Droplet, MapPin, Activity, Heart, Search, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

const BloodRequests = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [availableDonors, setAvailableDonors] = useState([]);
    const [matchLoading, setMatchLoading] = useState(false);

    useEffect(() => {
        loadRequests();
    }, [filter]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getBloodRequests(filter);
            setRequests(data);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load blood requests');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenMatch = async (request) => {
        setSelectedRequest(request);
        setMatchLoading(true);
        setShowMatchModal(true);
        try {
            const donors = await getAllDonors(request.bloodGroup);
            setAvailableDonors(donors);
        } catch (e) {
            toast.error('Failed to fetch donors');
        } finally {
            setMatchLoading(false);
        }
    };

    const handleMatch = async (donorId) => {
        if (!window.confirm('Assign this donor to the request?')) return;
        try {
            await matchDonor(selectedRequest._id, donorId);
            toast.success('Donor Matched Successfully');
            setShowMatchModal(false);
            loadRequests();
        } catch (e) {
            toast.error('Match failed');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Blood Requests</h1>
                    <p className="text-gray-500">Manage emergency blood requirements and donor matching</p>
                </div>
                <div>
                    <select
                        className="bg-white px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Requests</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="FULFILLED">Fulfilled</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
                    <div className="bg-red-50 p-4 rounded-full mb-4">
                        <Droplet size={48} className="text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Blood Requests Found</h3>
                    <p className="text-gray-500 max-w-md">There are currently no blood requests matching your filter criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {requests.map(req => (
                        <div key={req._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden">
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg ${req.urgencyLevel === 'CRITICAL' ? 'bg-red-600' : 'bg-orange-500'
                                }`}>
                                {req.urgencyLevel}
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{req.bloodGroup}</h3>
                                    <p className="text-sm text-gray-500">{req.unitsRequired} Units Required</p>
                                </div>
                                <div className="bg-red-50 p-2 rounded-full text-red-600">
                                    <Droplet size={24} fill="currentColor" />
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Activity size={16} className="text-gray-400" />
                                    <span>Patient: {req.patientName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Heart size={16} className="text-gray-400" />
                                    <span>Hospital: {req.hospitalName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <MapPin size={16} className="text-gray-400" />
                                    <span>{req.location}</span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-100">
                                {req.status === 'OPEN' ? (
                                    <button
                                        onClick={() => handleOpenMatch(req)}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <Search size={16} /> Find Donor
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-lg">
                                        <span className="font-medium">{req.status}</span>
                                        {req.matchedDonorId && <span className="text-xs">({req.matchedDonorId.name})</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Match Donor Modal */}
            {showMatchModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Match Donor for {selectedRequest?.bloodGroup} Request</h2>
                            <button onClick={() => setShowMatchModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            {matchLoading ? (
                                <div className="text-center py-8">Loading suitable donors...</div>
                            ) : availableDonors.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No eligible donors found with blood group {selectedRequest?.bloodGroup}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {availableDonors.map(donor => (
                                        <div key={donor._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                                                    {donor.bloodGroup}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{donor.userId?.name || 'Unknown'}</h4>
                                                    <p className="text-sm text-gray-500">{donor.userId?.phone} • {donor.userId?.address?.city || 'No City'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleMatch(donor._id)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                            >
                                                Select
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BloodRequests;
