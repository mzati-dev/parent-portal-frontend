import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit2, Camera, Save, X, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  school: string;
  dateOfBirth?: string;
  studentId?: string;
}

interface FamilyProfileProps {
  students: Student[];
}

// Define a more specific auth user type
interface AuthUser {
  id?: string;
  email?: string;
  full_name?: string;
  user_metadata?: {
    full_name?: string;
  };
  // Add other properties your auth system provides
}

interface ParentInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  relationship: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

const FamilyProfile: React.FC<FamilyProfileProps> = ({ students }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cast user to AuthUser type or use type assertion
  const authUser = user as unknown as AuthUser;

  // Get user info from auth - handle type safely
  const getDisplayName = (): string => {
    if (!authUser) return 'Parent';

    // Check different possible properties
    if (authUser.full_name) return authUser.full_name;
    if (authUser.user_metadata?.full_name) return authUser.user_metadata.full_name;
    if (authUser.email) return authUser.email.split('@')[0];

    return 'Parent';
  };

  const getUserEmail = (): string => {
    return authUser?.email || '';
  };

  const [parentInfo, setParentInfo] = useState<ParentInfo>({
    name: getDisplayName(),
    email: getUserEmail(),
    phone: '(555) 123-4567',
    address: '123 Oak Street, Springfield, IL 62701',
    relationship: 'Parent',
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: 'Michael Johnson', relationship: 'Father', phone: '(555) 234-5678' },
    { name: 'Mary Smith', relationship: 'Grandmother', phone: '(555) 345-6789' },
  ]);

  // Update parent info when user changes
  useEffect(() => {
    if (authUser) {
      setParentInfo(prev => ({
        ...prev,
        name: getDisplayName(),
        email: getUserEmail(),
      }));
    }
  }, [authUser]);

  // Mock save function - replace with your actual API call
  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Here you would make your actual API call
      // Example: await yourApi.updateParentProfile(user.id, parentInfo);

      console.log('Saving parent info:', parentInfo);
      console.log('Saving emergency contacts:', emergencyContacts);

      // In a real app, you would:
      // 1. Send parentInfo to your backend API
      // 2. Send emergencyContacts to your backend API
      // 3. Handle success/error responses

      setIsEditing(false);
      alert('Profile updated successfully!');

    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmergencyContact = () => {
    const newContact: EmergencyContact = {
      name: 'New Contact',
      relationship: 'Family Friend',
      phone: '(555) 000-0000'
    };
    setEmergencyContacts([...emergencyContacts, newContact]);
  };

  const handleRemoveEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Profile</h1>
          <p className="text-gray-500">Manage your family information and contacts</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Parent Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Parent/Guardian Information</h2>

            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(parentInfo.name)}
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={parentInfo.name}
                        onChange={(e) => setParentInfo({ ...parentInfo, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{parentInfo.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    {isEditing ? (
                      <select
                        value={parentInfo.relationship}
                        onChange={(e) => setParentInfo({ ...parentInfo, relationship: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{parentInfo.relationship}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500">Email Address</label>
                  <p className="text-gray-900">{parentInfo.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed here. Contact support if needed.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={parentInfo.phone}
                      onChange={(e) => setParentInfo({ ...parentInfo, phone: e.target.value })}
                      className="w-full px-0 py-1 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{parentInfo.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500">Home Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={parentInfo.address}
                      onChange={(e) => setParentInfo({ ...parentInfo, address: e.target.value })}
                      className="w-full px-0 py-1 bg-transparent border-0 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{parentInfo.address}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Emergency Contacts</h2>
              {isEditing && (
                <button
                  onClick={handleAddEmergencyContact}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact
                </button>
              )}
            </div>

            <div className="space-y-4">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.relationship}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{contact.phone}</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveEmergencyContact(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Children Cards */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Children</h2>
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.grade}</p>
                      <p className="text-xs text-gray-400">{student.school}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Student ID</p>
                      <p className="font-medium text-gray-900">{student.studentId || 'STU-2024-001'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date of Birth</p>
                      <p className="font-medium text-gray-900">{student.dateOfBirth || 'Jan 15, 2014'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
            <h3 className="font-semibold mb-4">Need Help?</h3>
            <p className="text-blue-100 text-sm mb-4">
              Contact the school office for any questions about your profile or student information.
            </p>
            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors">
              Contact School Office
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyProfile;