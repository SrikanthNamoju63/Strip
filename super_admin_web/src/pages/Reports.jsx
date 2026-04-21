import React from 'react';
import { Download, FileText, BarChart2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Reports = () => {
    const handleDownload = (type) => {
        toast.success(`Generating ${type} Report... Download will start shortly.`);
        // In real app, trigger backend blob download
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-500 mb-8">Generate and export system data</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                    title="Financial Statement"
                    desc="Monthly revenue, payouts, and taxes."
                    icon={BarChart2}
                    color="blue"
                    onClick={() => handleDownload('Financial')}
                />
                <ReportCard
                    title="User Registration Report"
                    desc="New user signups and demographics."
                    icon={FileText}
                    color="green"
                    onClick={() => handleDownload('User')}
                />
                <ReportCard
                    title="Doctor Performance"
                    desc="Consultations, ratings, and attendance."
                    icon={FileText}
                    color="purple"
                    onClick={() => handleDownload('Doctor')}
                />
                <ReportCard
                    title="Appointment Audit"
                    desc="Detailed log of all appointments."
                    icon={FileText}
                    color="orange"
                    onClick={() => handleDownload('Appointment')}
                />
            </div>
        </div>
    );
};

const ReportCard = ({ title, desc, icon: Icon, color, onClick }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start hover:shadow-md transition-shadow">
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600 mb-4`}>
            <Icon size={24} />
        </div>
        <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{desc}</p>
        <button
            onClick={onClick}
            className={`mt-auto flex items-center gap-2 text-${color}-600 font-medium hover:underline`}
        >
            <Download size={16} /> Download CSV
        </button>
    </div>
);

export default Reports;
