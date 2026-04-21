import React, { useEffect, useState } from 'react';
import { Search, Filter, Star, MessageSquare, Calendar } from 'lucide-react';
import api from '../services/api';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('recent');

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/ratings/admin/all?page=${page}&limit=20&sortBy=${filter}`);
            if (res.data.success) {
                setReviews(res.data.data);
                setTotalPages(res.data.pagination.pages);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [page, filter]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
                    <p className="text-gray-500">Monitor usage feedback across the platform</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reviews.map((review) => (
                        <div key={review._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
                            {/* Review Score */}
                            <div className="flex flex-col items-center justify-center min-w-[100px] border-r border-gray-100 pr-6">
                                <div className="text-4xl font-bold text-gray-900">{review.overallRating}</div>
                                <div className="flex text-yellow-500 my-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < review.overallRating ? "currentColor" : "none"} />
                                    ))}
                                </div>
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Rating</div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2 items-center">
                                        <span className="font-semibold text-gray-900">
                                            {review.userId?.name || 'Anonymous User'}
                                        </span>
                                        <span className="text-gray-400 text-sm">reviewed</span>
                                        <span className="font-semibold text-primary">
                                            Dr. {review.doctorId?.name || 'Unknown Doctor'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-400 text-xs gap-1">
                                        <Calendar size={12} />
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 italic border border-gray-100 mb-3">
                                    "{review.reviewText || 'No comment provided'}"
                                </div>

                                {review.serviceRatings && (
                                    <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                                        {Object.entries(review.serviceRatings).map(([key, val]) => (
                                            val > 0 && (
                                                <div key={key} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                                                    <span className="capitalize">{key}:</span>
                                                    <span className="font-bold text-gray-700">{val}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {reviews.length === 0 && (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                            No reviews found matching filters.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reviews;
