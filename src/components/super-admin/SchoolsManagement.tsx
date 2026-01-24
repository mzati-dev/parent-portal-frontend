import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface School {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    isActive: boolean;
    createdAt: string;
}

interface SchoolsManagementProps {
    onSchoolSelect?: (schoolId: string) => void;
}

const SchoolsManagement: React.FC<SchoolsManagementProps> = ({ onSchoolSelect }) => {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        // ADD THESE 3 NEW FIELDS:
        adminEmail: '',
        adminPassword: '',
        adminName: '',
    });

    // ===== START: ADD PASSWORD VISIBILITY STATE =====
    const [showPassword, setShowPassword] = useState(false);
    // ===== END: ADD PASSWORD VISIBILITY STATE =====

    // Load schools
    const loadSchools = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://eduspace-portal-backend.onrender.com/schools', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to load schools');

            const data = await response.json();
            setSchools(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchools();
    }, []);

    // Handle form changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Create or update school
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const url = editingSchool
                ? `http://localhost:3000/schools/${editingSchool.id}`
                : 'http://localhost:3000/schools';

            const method = editingSchool ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Operation failed');
            }

            const message = editingSchool ? 'School updated successfully!' : 'School created successfully!';
            setSuccess(message);

            // Reset form and reload
            setShowForm(false);
            setEditingSchool(null);
            setFormData({
                name: '', email: '', phone: '', address: '', adminEmail: '',
                adminPassword: '',
                adminName: ''
            });
            loadSchools();

        } catch (err: any) {
            setError(err.message || 'Operation failed');
        }
    };

    // Delete school (soft delete)
    const handleDeleteSchool = async (schoolId: string) => {
        if (!confirm('Are you sure you want to deactivate this school?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/schools/${schoolId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to delete school');

            setSuccess('School deactivated successfully!');
            loadSchools();
        } catch (err: any) {
            setError(err.message || 'Failed to delete school');
        }
    };

    // Restore school
    const handleRestoreSchool = async (schoolId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/schools/${schoolId}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to restore school');

            setSuccess('School restored successfully!');
            loadSchools();
        } catch (err: any) {
            setError(err.message || 'Failed to restore school');
        }
    };

    // Start editing school
    const startEditSchool = (school: School) => {
        setEditingSchool(school);
        setFormData({
            name: school.name,
            email: school.email,
            phone: school.phone || '',
            address: school.address || '',
            // For editing, you might not want to show passwords
            adminEmail: '',  // You might need to fetch this from API
            adminPassword: '', // Usually empty for security
            adminName: '',   // You might need to fetch this from API
        });
        setShowForm(true);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Schools Management</h2>
                    <p className="text-gray-500">Manage all schools in the system</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSchool(null);
                        setFormData({
                            name: '', email: '', phone: '', address: '', adminEmail: '',
                            adminPassword: '',
                            adminName: ''
                        });
                        setShowForm(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add School
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <p className="text-emerald-700">{success}</p>
                </div>
            )}

            {/* School Form */}
            {showForm && (
                <div className="mb-8 p-6 border border-gray-200 rounded-xl bg-gray-50">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingSchool ? 'Edit School' : 'Add New School'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    School Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter school name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="school@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter School's phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="School physical address"
                                />
                            </div>
                            {/* ===== START: NEW ADMIN CREDENTIALS SECTION ===== */}
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h4 className="font-medium text-gray-700 mb-3">Admin Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Admin Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="adminName"
                                            value={formData.adminName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter Admin Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Admin Login Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="adminEmail"
                                            value={formData.adminEmail}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="admin@school.edu"
                                        />
                                    </div>
                                    {/* <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="adminPassword"
                                            value={formData.adminPassword}
                                            onChange={handleInputChange}
                                            required
                                            minLength={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="At least 6 characters"
                                        />
                                    </div> */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password *
                                        </label>
                                        {/* ===== START: UPDATED PASSWORD FIELD WITH TOGGLE ===== */}
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="adminPassword"
                                                value={formData.adminPassword}
                                                onChange={handleInputChange}
                                                required
                                                minLength={6}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                                placeholder="At least 6 characters"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                                )}
                                            </button>
                                        </div>
                                        {/* ===== END: UPDATED PASSWORD FIELD WITH TOGGLE ===== */}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    These credentials will be used by the school administrator to login.
                                </p>
                            </div>
                            {/* ===== END: NEW ADMIN CREDENTIALS SECTION ===== */}
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {editingSchool ? 'Update School' : 'Create School'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingSchool(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Schools Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                School
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {schools.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No schools found. Add your first school!
                                </td>
                            </tr>
                        ) : (
                            schools.map((school) => (
                                <tr key={school.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{school.name}</div>
                                            {onSchoolSelect && (
                                                <button
                                                    onClick={() => onSchoolSelect(school.id)}
                                                    className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                                                >
                                                    View data →
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{school.email}</div>
                                        {school.phone && (
                                            <div className="text-sm text-gray-500">{school.phone}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {school.isActive ? (
                                                <>
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                                    <span className="text-sm text-emerald-700">Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                    <span className="text-sm text-red-700">Inactive</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatDate(school.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => startEditSchool(school)}
                                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>

                                            {school.isActive ? (
                                                <button
                                                    onClick={() => handleDeleteSchool(school.id)}
                                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                                    title="Deactivate"
                                                >
                                                    <EyeOff className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRestoreSchool(school.id)}
                                                    className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                                    title="Activate"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">{schools.length}</div>
                    <div className="text-sm text-blue-600">Total Schools</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-700">
                        {schools.filter(s => s.isActive).length}
                    </div>
                    <div className="text-sm text-emerald-600">Active Schools</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">
                        {schools.filter(s => !s.isActive).length}
                    </div>
                    <div className="text-sm text-gray-600">Inactive Schools</div>
                </div>
            </div>
        </div>
    );
};

export default SchoolsManagement;