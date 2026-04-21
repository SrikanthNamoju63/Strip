import React, { useEffect, useState } from 'react';
import { getBloodDonations } from '../services/api';
import { Droplet, MapPin, User } from 'lucide-react';

const BloodDonations = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDonations = async () => {
            try {
                const data = await getBloodDonations();
                setDonations(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDonations();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Blood Donation History</h1>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
            ) : donations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
                    <div className="bg-red-50 p-4 rounded-full mb-4">
                        <Droplet size={48} className="text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Blood Donation History</h3>
                    <p className="text-gray-500 max-w-md">There are no recorded blood donations in the system.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">Donor</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Group</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Location</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">Units</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {donations.map(d => (
                                <tr key={d._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                                                {d.bloodGroup}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{d.userId?.name || 'Guest Donor'}</div>
                                                <div className="text-xs text-gray-500">{d.userId?.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-red-600">
                                        {d.bloodGroup}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} /> {d.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(d.donationDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-800">
                                        {d.units} Units
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default BloodDonations;
