import React, { useEffect, useState } from 'react';
import { getUsers } from '../services/api';
import Table from '../components/Table';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useRealTime from '../hooks/useRealTime';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUsers = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Real-time: auto-refresh when users update/register
    useRealTime({
        events: [],
        refetch: () => fetchUsers(true),
    });

    const userAddress = (user) => {
        // Helper to formatting address if it exists in schema
        return user.address || 'N/A';
    };

    const columns = [
        {
            header: 'User',
            accessor: 'name',
            render: (user) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm overflow-hidden shrink-0 border border-slate-100">
                        {user.profileImage ? (
                            <img
                                src={`http://localhost:6002/${user.profileImage.replace(/\\/g, '/')}`}
                                alt={user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = user.name?.[0] || 'U'; }}
                            />
                        ) : (
                            user.name?.[0] || 'U'
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            {user.userNumber && (
                                <>
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono font-semibold text-[10px]">
                                        {user.userNumber}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                </>
                            )}
                            <span>{user.role || 'Patient'}</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Contact Info',
            accessor: 'email',
            render: (user) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" /> {user.email}
                    </div>
                    {user.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone size={14} className="text-slate-400" /> {user.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: 'Location',
            accessor: 'address',
            render: (user) => (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-slate-400" /> {userAddress(user)}
                </div>
            )
        },
        {
            header: 'Joined',
            accessor: 'createdAt',
            render: (user) => <span className="text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</span>
        }
    ];

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search) ||
        u.userNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                <p className="text-slate-500">View and manage registered patients</p>
            </div>

            <Table
                columns={columns}
                data={filteredUsers}
                isLoading={loading}
                searchValue={search}
                onSearch={setSearch}
                searchPlaceholder="Search users by name, email, or phone..."
                pagination={true}
                onRowClick={(user) => navigate(`/users/${user._id}`)}
            />
        </div>
    );
};

export default Users;
