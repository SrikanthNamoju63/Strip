import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Plus, 
  Edit2, 
  Trash2, 
  Send, 
  Eye, 
  Clock,
  CheckCircle,
  XCircle,
  Users,
  BarChart3,
  Search,
  Filter,
  Copy,
  Play
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [stats, setStats] = useState({});

  const campaignTypes = [
    { value: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-800' },
    { value: 'SMS', label: 'SMS', icon: MessageSquare, color: 'bg-green-100 text-green-800' },
    { value: 'PUSH', label: 'Push', icon: Send, color: 'bg-purple-100 text-purple-800' },
    { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-100 text-green-800' }
  ];

  const campaignPurposes = [
    { value: 'PROMOTION', label: 'Promotion' },
    { value: 'ANNOUNCEMENT', label: 'Announcement' },
    { value: 'REMINDER', label: 'Reminder' },
    { value: 'NEWSLETTER', label: 'Newsletter' },
    { value: 'WELCOME', label: 'Welcome' },
    { value: 'RE_ENGAGEMENT', label: 'Re-engagement' },
    { value: 'TRANSACTIONAL', label: 'Transactional' }
  ];

  const statusTypes = [
    { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'SENDING', label: 'Sending', color: 'bg-blue-100 text-blue-800' },
    { value: 'SENT', label: 'Sent', color: 'bg-green-100 text-green-800' },
    { value: 'PAUSED', label: 'Paused', color: 'bg-orange-100 text-orange-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, [filter]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      
      const res = await api.get(`/campaigns?${params}`);
      setCampaigns(res.data.data.campaigns);
    } catch (error) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/campaigns/stats/overview');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      await api.delete(`/campaigns/${id}`);
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleSend = async (id) => {
    if (!window.confirm('Are you sure you want to send this campaign now?')) return;
    
    try {
      await api.post(`/campaigns/${id}/send`);
      toast.success('Campaign queued for sending');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to send campaign');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/campaigns/${id}/duplicate`);
      toast.success('Campaign duplicated successfully');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to duplicate campaign');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type) => {
    const typeConfig = campaignTypes.find(t => t.value === type);
    const Icon = typeConfig?.icon || Mail;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeColor = (type) => campaignTypes.find(t => t.value === type)?.color || 'bg-gray-100';
  const getStatusColor = (status) => statusTypes.find(s => s.value === status)?.color || 'bg-gray-100';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Mail className="w-8 h-8 text-primary" />
          Marketing Campaigns
        </h1>
        <p className="text-gray-600 mt-2">Create and manage email, SMS, and push notification campaigns</p>
      </div>

      {/* Stats Overview */}
      {stats.overview && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Campaigns</p>
            <p className="text-2xl font-bold">{stats.overview.totalCampaigns || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Sent</p>
            <p className="text-2xl font-bold">{stats.overview.totalSent?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.overview.totalDelivered?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Opened</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.overview.totalOpened?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Clicked</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.overview.totalClicked?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            {campaignTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>

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
            onClick={() => { setEditingCampaign(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
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
            ) : filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No campaigns found
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => (
                <tr key={campaign._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{campaign.subject}</p>
                      <p className="text-xs text-gray-400">{campaign.campaignCode}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(campaign.type)}`}>
                      {getTypeIcon(campaign.type)}
                      {campaign.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {campaign.stats?.totalRecipients?.toLocaleString() || 0}
                    </div>
                    {campaign.scheduledAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(campaign.scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {campaign.status === 'SENT' ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Open Rate:</span>
                          <span className="font-medium">{campaign.stats?.openRate?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Click Rate:</span>
                          <span className="font-medium">{campaign.stats?.clickRate?.toFixed(1) || 0}%</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                        <button
                          onClick={() => handleSend(campaign._id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Send Now"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(campaign._id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingCampaign(campaign); setShowModal(true); }}
                        className="p-1 text-gray-400 hover:text-primary"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign._id)}
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
        <CampaignModal 
          campaign={editingCampaign} 
          onClose={() => setShowModal(false)} 
          onSave={fetchCampaigns}
          campaignTypes={campaignTypes}
          campaignPurposes={campaignPurposes}
          statusTypes={statusTypes}
        />
      )}
    </div>
  );
};

const CampaignModal = ({ campaign, onClose, onSave, campaignTypes, campaignPurposes, statusTypes }) => {
  const [formData, setFormData] = useState(campaign || {
    name: '',
    type: 'EMAIL',
    purpose: 'PROMOTION',
    subject: '',
    content: '',
    smsContent: '',
    status: 'DRAFT',
    targetAudience: {
      userType: 'ALL',
      filters: {}
    },
    scheduledAt: '',
    tracking: {
      trackOpens: true,
      trackClicks: true
    }
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (campaign) {
        await api.put(`/campaigns/${campaign._id}`, formData);
        toast.success('Campaign updated');
      } else {
        await api.post('/campaigns', formData);
        toast.success('Campaign created');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{campaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            {['content', 'audience', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {campaignTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {campaignPurposes.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  placeholder="Enter your message content..."
                />
              </div>

              {formData.type === 'SMS' && (
                <div>
                  <label className="block text-sm font-medium mb-1">SMS Content (160 chars max)</label>
                  <textarea
                    value={formData.smsContent}
                    onChange={(e) => setFormData({ ...formData, smsContent: e.target.value })}
                    rows={3}
                    maxLength={160}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.smsContent?.length || 0}/160 characters
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audience' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Audience</label>
                <select
                  value={formData.targetAudience.userType}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    targetAudience: { ...formData.targetAudience, userType: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="ALL">All Users</option>
                  <option value="USERS">Patients Only</option>
                  <option value="DOCTORS">Doctors Only</option>
                  <option value="ADMINS">Admins Only</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Filters (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="City name"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Min Appointments</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to save as draft</p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.tracking.trackOpens}
                    onChange={(e) => setFormData({
                      ...formData,
                      tracking: { ...formData.tracking, trackOpens: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Track opens</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.tracking.trackClicks}
                    onChange={(e) => setFormData({
                      ...formData,
                      tracking: { ...formData.tracking, trackClicks: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">Track clicks</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
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
              {saving ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Campaigns;
