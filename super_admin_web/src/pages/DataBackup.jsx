import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  HardDrive,
  Archive,
  RefreshCw,
  Shield,
  FileText,
  Calendar,
  Search,
  Filter,
  Play,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const DataBackup = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [stats, setStats] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const backupTypes = [
    { value: 'FULL', label: 'Full Backup', color: 'bg-blue-100 text-blue-800', icon: Database },
    { value: 'INCREMENTAL', label: 'Incremental', color: 'bg-green-100 text-green-800', icon: RefreshCw },
    { value: 'DATABASE', label: 'Database Only', color: 'bg-purple-100 text-purple-800', icon: HardDrive },
    { value: 'FILES', label: 'Files Only', color: 'bg-yellow-100 text-yellow-800', icon: Archive },
    { value: 'CONFIG', label: 'Configuration', color: 'bg-gray-100 text-gray-800', icon: Settings }
  ];

  const statusTypes = [
    { value: 'PENDING', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'FAILED', label: 'Failed', color: 'bg-red-100 text-red-800' },
    { value: 'VERIFIED', label: 'Verified', color: 'bg-purple-100 text-purple-800' }
  ];

  const storageLocations = [
    { value: 'LOCAL', label: 'Local Storage' },
    { value: 'S3', label: 'AWS S3' },
    { value: 'GCP', label: 'Google Cloud' },
    { value: 'AZURE', label: 'Azure Blob' },
    { value: 'FTP', label: 'FTP Server' }
  ];

  useEffect(() => {
    fetchBackups();
    fetchStats();
  }, [filter]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      
      const res = await api.get(`/backups?${params}`);
      setBackups(res.data.data.backups);
    } catch (error) {
      toast.error('Failed to fetch backups');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/backups/stats/overview');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const handleCreateBackup = async (backupData) => {
    try {
      await api.post('/backups', backupData);
      toast.success('Backup initiated successfully');
      setShowCreateModal(false);
      fetchBackups();
    } catch (error) {
      toast.error('Failed to create backup');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) return;
    
    try {
      await api.delete(`/backups/${id}`);
      toast.success('Backup deleted successfully');
      fetchBackups();
    } catch (error) {
      toast.error('Failed to delete backup');
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.post(`/backups/${id}/verify`);
      toast.success('Backup verified successfully');
      fetchBackups();
    } catch (error) {
      toast.error('Failed to verify backup');
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('WARNING: This will restore data from the selected backup. Current data may be overwritten. Continue?')) return;
    
    try {
      await api.post(`/backups/${id}/restore`);
      toast.success('Restore process initiated');
    } catch (error) {
      toast.error('Failed to initiate restore');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getTypeIcon = (type) => {
    const typeConfig = backupTypes.find(t => t.value === type);
    const Icon = typeConfig?.icon || Database;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeColor = (type) => backupTypes.find(t => t.value === type)?.color || 'bg-gray-100';
  const getTypeLabel = (type) => backupTypes.find(t => t.value === type)?.label || type;
  const getStatusColor = (status) => statusTypes.find(s => s.value === status)?.color || 'bg-gray-100';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          Data Backup & Export
        </h1>
        <p className="text-gray-600 mt-2">Manage database backups, exports, and data restoration</p>
      </div>

      {/* Stats Overview */}
      {stats.overview && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Backups</p>
            <p className="text-2xl font-bold">{stats.overview.totalBackups || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Size</p>
            <p className="text-2xl font-bold">{formatBytes(stats.overview.totalSize || 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Avg Duration</p>
            <p className="text-2xl font-bold">{formatDuration(stats.overview.avgDuration)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Verified</p>
            <p className="text-2xl font-bold text-green-600">
              {backups.filter(b => b.verification?.isVerified).length}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            {backupTypes.map(type => (
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

          <div className="flex-1"></div>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Database className="w-4 h-4" />
            Create Backup
          </button>
        </div>
      </div>

      {/* Recent Backups */}
      {stats.recentBackups && stats.recentBackups.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-3">Recent Backups</h3>
          <div className="flex gap-4 overflow-x-auto">
            {stats.recentBackups.map(backup => (
              <div key={backup._id} className="bg-white rounded-lg p-3 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(backup.type)}
                  <span className="font-medium text-sm">{backup.backupId}</span>
                </div>
                <p className="text-xs text-gray-500">{new Date(backup.createdAt).toLocaleDateString()}</p>
                <p className="text-sm font-medium">{formatBytes(backup.stats?.totalSize || 0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backups Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Backup ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Storage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No backups found
                </td>
              </tr>
            ) : (
              backups.map((backup) => (
                <tr key={backup._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(backup.type)}
                      <span className="font-medium text-gray-900">{backup.backupId}</span>
                    </div>
                    {backup.description && (
                      <p className="text-xs text-gray-500 mt-1">{backup.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(backup.type)}`}>
                      {getTypeLabel(backup.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                      {backup.status}
                    </span>
                    {backup.verification?.isVerified && (
                      <span className="ml-2 text-green-600" title="Verified">
                        <CheckCircle className="w-4 h-4 inline" />
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatBytes(backup.stats?.totalSize || 0)}
                    {backup.stats?.compressionRatio > 0 && (
                      <span className="text-xs text-green-600 ml-1">
                        (-{backup.stats.compressionRatio}%)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDuration(backup.duration)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {backup.storage?.location}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(backup.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {backup.status === 'COMPLETED' && !backup.verification?.isVerified && (
                        <button
                          onClick={() => handleVerify(backup._id)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Verify Backup"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                      {backup.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleRestore(backup._id)}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title="Restore from Backup"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(backup._id)}
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

      {/* Create Backup Modal */}
      {showCreateModal && (
        <CreateBackupModal 
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateBackup}
          backupTypes={backupTypes}
          storageLocations={storageLocations}
        />
      )}

      {/* Export Data Modal */}
      {showExportModal && (
        <ExportDataModal 
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

const CreateBackupModal = ({ onClose, onCreate, backupTypes, storageLocations }) => {
  const [formData, setFormData] = useState({
    type: 'FULL',
    description: '',
    storage: { location: 'LOCAL' },
    source: { database: true, collections: [], filePaths: [] },
    retentionDays: 30
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    await onCreate(formData);
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Create New Backup</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Backup Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {backupTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Storage Location</label>
            <select
              value={formData.storage.location}
              onChange={(e) => setFormData({ ...formData, storage: { ...formData.storage, location: e.target.value } })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {storageLocations.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter backup description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Retention (Days)</label>
            <input
              type="number"
              value={formData.retentionDays}
              onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) })}
              min="1"
              max="365"
              className="w-full px-3 py-2 border rounded-lg"
            />
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
              disabled={creating}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Backup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ExportDataModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    dataType: 'users',
    format: 'json',
    filters: {}
  });
  const [exporting, setExporting] = useState(false);

  const dataTypes = [
    { value: 'users', label: 'Users' },
    { value: 'doctors', label: 'Doctors' },
    { value: 'appointments', label: 'Appointments' },
    { value: 'payments', label: 'Payments' },
    { value: 'ratings', label: 'Ratings & Reviews' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setExporting(true);
    try {
      await api.post('/backups/export/data', formData);
      toast.success('Export initiated. You will be notified when ready.');
      onClose();
    } catch (error) {
      toast.error('Failed to initiate export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Export Data</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data Type</label>
            <select
              value={formData.dataType}
              onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {dataTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Format</label>
            <div className="flex gap-4">
              {['json', 'csv', 'xlsx'].map(format => (
                <label key={format} className="flex items-center gap-2">
                  <input
                    type="radio"
                    value={format}
                    checked={formData.format === format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="rounded"
                  />
                  <span className="text-sm uppercase">{format}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Large exports may take several minutes to process. 
              You will receive a notification when your export is ready for download.
            </p>
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
              disabled={exporting}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Export Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataBackup;
