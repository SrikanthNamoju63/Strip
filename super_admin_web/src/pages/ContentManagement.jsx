import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Calendar,
  Tag,
  User,
  CheckCircle,
  XCircle,
  Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const ContentManagement = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stats, setStats] = useState({});

  const contentTypes = [
    { value: 'ARTICLE', label: 'Article', color: 'bg-blue-100 text-blue-800' },
    { value: 'BLOG', label: 'Blog Post', color: 'bg-green-100 text-green-800' },
    { value: 'TESTIMONIAL', label: 'Testimonial', color: 'bg-purple-100 text-purple-800' },
    { value: 'FAQ', label: 'FAQ', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'PAGE', label: 'Page', color: 'bg-gray-100 text-gray-800' },
    { value: 'BANNER', label: 'Banner', color: 'bg-pink-100 text-pink-800' },
    { value: 'PROMOTION', label: 'Promotion', color: 'bg-red-100 text-red-800' }
  ];

  const statusTypes = [
    { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'PUBLISHED', label: 'Published', color: 'bg-green-100 text-green-800' },
    { value: 'ARCHIVED', label: 'Archived', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchContent();
  }, [filter]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      
      const res = await api.get(`/content/admin/all?${params}`);
      setContent(res.data.data.content);
      setStats(res.data.data.stats);
    } catch (error) {
      toast.error('Failed to fetch content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return;
    
    try {
      await api.delete(`/content/${id}`);
      toast.success('Content deleted successfully');
      fetchContent();
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/content/${id}/duplicate`);
      toast.success('Content duplicated successfully');
      fetchContent();
    } catch (error) {
      toast.error('Failed to duplicate content');
    }
  };

  const filteredContent = content.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = (type) => contentTypes.find(t => t.value === type)?.label || type;
  const getTypeColor = (type) => contentTypes.find(t => t.value === type)?.color || 'bg-gray-100';
  const getStatusColor = (status) => statusTypes.find(s => s.value === status)?.color || 'bg-gray-100';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Content Management
        </h1>
        <p className="text-gray-600 mt-2">Manage website content, articles, testimonials, and promotions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats && Object.entries(stats).map(([type, count]) => (
          <div key={type} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">{type}</p>
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
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            {contentTypes.map(type => (
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
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <Plus className="w-4 h-4" />
            Add Content
          </button>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="loader mx-auto"></div>
                </td>
              </tr>
            ) : filteredContent.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No content found
                </td>
              </tr>
            ) : (
              filteredContent.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">/{item.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                      {getTypeLabel(item.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.author?.name || item.createdBy?.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.views?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDuplicate(item._id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingItem(item); setShowModal(true); }}
                        className="p-1 text-gray-400 hover:text-primary"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
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

      {/* Modal placeholder - would be expanded */}
      {showModal && (
        <ContentModal 
          item={editingItem} 
          onClose={() => setShowModal(false)} 
          onSave={fetchContent}
          contentTypes={contentTypes}
          statusTypes={statusTypes}
        />
      )}
    </div>
  );
};

// Simple Modal Component
const ContentModal = ({ item, onClose, onSave, contentTypes, statusTypes }) => {
  const [formData, setFormData] = useState(item || {
    title: '',
    slug: '',
    type: 'ARTICLE',
    status: 'DRAFT',
    content: '',
    excerpt: '',
    category: '',
    tags: [],
    author: { name: '', email: '' }
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (item) {
        await api.put(`/content/${item._id}`, formData);
        toast.success('Content updated');
      } else {
        await api.post('/content', formData);
        toast.success('Content created');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{item ? 'Edit Content' : 'Create Content'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="auto-generated-if-empty"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {contentTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {statusTypes.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Excerpt</label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
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
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentManagement;
