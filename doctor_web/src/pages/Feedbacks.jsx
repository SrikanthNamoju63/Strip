import React, { useEffect, useState } from 'react';
import { getDoctorProfile, getDoctorRatings, respondToRating } from '../services/api';

const Feedbacks = () => {
    const [doctor, setDoctor] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const prof = await getDoctorProfile();
            setDoctor(prof);
            const res = await getDoctorRatings(prof._id);
            setRatings(res.data?.ratings || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleRespond = async (ratingId) => {
        const text = window.prompt('Write your response to this rating:');
        if (!text) return;
        try {
            const res = await respondToRating(ratingId, text);
            if (res.success) {
                alert('Response saved');
                load();
            } else alert('Failed to save response');
        } catch (err) {
            console.error(err);
            alert('Error responding to rating');
        }
    };

    if (loading) return <div className="p-8">Loading feedbacks...</div>;
    if (!doctor) return <div className="p-8">No doctor profile available.</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Patient Feedback</h1>
            <div className="space-y-4">
                {ratings.map(r => (
                    <div key={r._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-medium">{r.userId?.firstName} {r.userId?.lastName}</div>
                                <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-yellow-500 font-bold">⭐ {r.overallRating}</div>
                                <button onClick={() => handleRespond(r._id)} className="mt-2 text-sm bg-blue-500 text-white px-3 py-1 rounded">Respond</button>
                            </div>
                        </div>
                        {r.reviewText && <p className="mt-3 text-gray-700">{r.reviewText}</p>}
                        {r.doctorResponse?.text && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                                <strong>Your response:</strong>
                                <div>{r.doctorResponse.text}</div>
                            </div>
                        )}
                    </div>
                ))}
                {ratings.length === 0 && <div className="text-gray-500">No feedback yet.</div>}
            </div>
        </div>
    );
};

export default Feedbacks;
