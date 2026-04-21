import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Building2,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Percent
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const InsurancePartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [stats, setStats] = useState({});

  const statusTypes = [
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'SUSPENDED', label: 'Suspended', color: 'bg-orange-100 text-orange-800' },
    { value: 'TERMINATED', label: 'Terminated', color: 'bg-red-100 text-red-800' }
  ];

  const coverageTypes = [
    'CONSULTATION', 'DIAGNOSTICS', 'PHARMACY', 
    'HOSPITALIZATION', 'SURGERY', 'EMERGENCY'
  ];

  useEffect(() => {
    fetchPartners();
  }, [filter]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      
      const res = await api.get(`/insurance/admin/partners?${params}`);
      setPartners(res.data.data.partners);
      setStats(res.data.data.stats);
    } catch (error) {
      toast.error('Failed to fetch insurance partners');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) return;
    
    try {
      await api.delete(`/insurance/admin/partners/${id}`);
      toast.success('Partner deleted successfully');
      fetchPartners();
    } catch (error) {
      toast.error('Failed to delete partner');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/insurance/admin/partners/${id}/status`, { status });
      toast.success(`Partner status updated to ${status}`);
      fetchPartners();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredPartners = partners.filter(partner => 
    partner.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.companyCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => statusTypes.find(s => s.value === status)?.color || 'bg-gray-100';
  const getStatusLabel = (status) => statusTypes.find(s => s.value === status)?.label || status;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Insurance Partners
        </h1>
        <p className="text-gray-600 mt-2">Manage insurance company partnerships and coverage plans</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats && Object.entries(stats).map(([status, count]) => (
          <div key={status} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">{getStatusLabel(status)}</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            {statusTypes.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <button
            onClick={() => { setEditingPartner(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coverage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plans</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </td>
              </tr>
            ) : filteredPartners.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No insurance partners found
                </td>
              </tr>
            ) : (
              filteredPartners.map((partner) => (
                <tr key={partner._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {partner.logo ? (
                        <img src={partner.logo} alt="" className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{partner.companyName}</p>
                        <p className="text-sm text-gray-500">{partner.companyCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{partner.contactPerson?.name}</p>
                      <p className="text-gray-500">{partner.contactPerson?.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {partner.coverageTypes?.slice(0, 3).map(type => (
                        <span key={type} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {type}
                        </span>
                      ))}
                      {partner.coverageTypes?.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{partner.coverageTypes.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {partner.plans?.filter(p => p.isActive).length || 0} active
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partner.status)}`}>
                      {getStatusLabel(partner.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {partner.status === 'PENDING' && (
                        <button
                          onClick={() => handleStatusChange(partner._id, 'ACTIVE')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Activate"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {partner.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(partner._id, 'SUSPENDED')}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title="Suspend"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { setEditingPartner(partner); setShowModal(true); }}
                        className="p-1 text-gray-400 hover:text-primary"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(partner._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <PartnerModal 
          partner={editingPartner} 
          onClose={() => setShowModal(false)} 
          onSave={fetchPartners}
          statusTypes={statusTypes}
          coverageTypes={coverageTypes}
        />
      )}
    </div>
  );
};

const PartnerModal = ({ partner, onClose, onSave, statusTypes, coverageTypes }) => {
  const [formData, setFormData] = useState(partner || {
    companyName: '',
    companyCode: '',
    contactPerson: { name: '', email: '', phone: '', designation: '' },
    companyAddress: { street: '', city: '', state: '', country: 'India', zipCode: '' },
    website: '',
    description: '',
    status: 'PENDING',
    coverageTypes: [],
    plans: [],
    commission: { percentage: 0, flatFee: 0, paymentTerms: 'MONTHLY' }
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (partner) {
        await api.put(`/insurance/admin/partners/${partner._id}`, formData);
        toast.success('Partner updated');
      } else {
        await api.post('/insurance/admin/partners', formData);
        toast.success('Partner created');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save partner');
    } finally {
      setSaving(false);
    }
  };

  const toggleCoverage = (type) => {
    const types = formData.coverageTypes || [];
    if (types.includes(type)) {
      setFormData({ ...formData, coverageTypes: types.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, coverageTypes: [...types, type] });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{partner ? 'Edit Partner' : 'Add Insurance Partner'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Company Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company Code</label>
              <input
                type="text"
                value={formData.companyCode}
                onChange={(e) => setFormData({ ...formData, companyCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Auto-generated if empty"
              />
            </div>
          </div>

          {/* Contact Person */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Contact Person</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.contactPerson.name}
                  onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, name: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.contactPerson.email}
                  onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, email: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.contactPerson.phone}
                  onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, phone: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.contactPerson.designation}
                  onChange={(e) => setFormData({ ...formData, contactPerson: { ...formData.contactPerson, designation: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Coverage Types */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Coverage Types</h3>
            <div className="flex flex-wrap gap-2">
              {coverageTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleCoverage(type)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    formData.coverageTypes?.includes(type)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Commission */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Commission Structure</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Percentage (%)</label>
                <input
                  type="number"
                  value={formData.commission.percentage}
                  onChange={(e) => setFormData({ ...formData, commission: { ...formData.commission, percentage: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Flat Fee</label>
                <input
                  type="number"
                  value={formData.commission.flatFee}
                  onChange={(e) => setFormData({ ...formData, commission: { ...formData.commission, flatFee: parseFloat(e.target.value) } })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Terms</label>
                <select
                  value={formData.commission.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, commission: { ...formData.commission, paymentTerms: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InsurancePartners;
