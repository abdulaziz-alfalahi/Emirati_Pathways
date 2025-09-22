import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Shield,
  Ban,
  CheckCircle,
  AlertTriangle,
  Mail,
  Calendar,
  Clock,
  MoreHorizontal,
  ChevronDown,
  RefreshCw,
  Save,
  X,
  Eye,
  UserPlus,
  UserMinus,
  Settings,
  Download,
  Upload
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  roles: string[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  profile_data?: {
    phone?: string;
    department?: string;
    position?: string;
    location?: string;
  };
}

interface UserFilters {
  status: string;
  role: string;
  department: string;
  date_range: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<User | null>(null);

  const [filters, setFilters] = useState<UserFilters>({
    status: '',
    role: '',
    department: '',
    date_range: ''
  });

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    roles: [] as string[],
    profile_data: {
      phone: '',
      department: '',
      position: '',
      location: ''
    }
  });

  const availableRoles = [
    'super_admin',
    'content_admin',
    'user_admin',
    'content_editor',
    'content_reviewer',
    'job_seeker',
    'hr_recruiter',
    'mentor',
    'educator',
    'assessor'
  ];

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filters]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'sarah.almansouri',
          email: 'sarah.almansouri@emiratijourney.ae',
          full_name: 'Sarah Al-Mansouri',
          roles: ['content_admin', 'educator'],
          is_active: true,
          last_login: '2024-01-28T14:30:00Z',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-28T14:30:00Z',
          profile_data: {
            phone: '+971-50-123-4567',
            department: 'Education',
            position: 'Senior Content Manager',
            location: 'Dubai'
          }
        },
        {
          id: 2,
          username: 'ahmed.alzaabi',
          email: 'ahmed.alzaabi@emiratijourney.ae',
          full_name: 'Ahmed Al-Zaabi',
          roles: ['hr_recruiter', 'mentor'],
          is_active: true,
          last_login: '2024-01-28T09:15:00Z',
          created_at: '2024-01-18T08:30:00Z',
          updated_at: '2024-01-28T09:15:00Z',
          profile_data: {
            phone: '+971-50-234-5678',
            department: 'Human Resources',
            position: 'HR Manager',
            location: 'Abu Dhabi'
          }
        },
        {
          id: 3,
          username: 'fatima.alzahra',
          email: 'fatima.alzahra@emiratijourney.ae',
          full_name: 'Fatima Al-Zahra',
          roles: ['assessor', 'content_reviewer'],
          is_active: true,
          last_login: '2024-01-27T16:45:00Z',
          created_at: '2024-01-20T11:20:00Z',
          updated_at: '2024-01-27T16:45:00Z',
          profile_data: {
            phone: '+971-50-345-6789',
            department: 'Assessment',
            position: 'Senior Assessor',
            location: 'Sharjah'
          }
        },
        {
          id: 4,
          username: 'mohammed.alrashid',
          email: 'mohammed.alrashid@emiratijourney.ae',
          full_name: 'Mohammed Al-Rashid',
          roles: ['job_seeker'],
          is_active: false,
          last_login: '2024-01-25T12:00:00Z',
          created_at: '2024-01-22T14:15:00Z',
          updated_at: '2024-01-26T10:30:00Z',
          profile_data: {
            phone: '+971-50-456-7890',
            department: 'Engineering',
            position: 'Software Developer',
            location: 'Dubai'
          }
        },
        {
          id: 5,
          username: 'admin',
          email: 'admin@emiratijourney.ae',
          full_name: 'System Administrator',
          roles: ['super_admin'],
          is_active: true,
          last_login: '2024-01-28T15:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-28T15:00:00Z',
          profile_data: {
            department: 'IT',
            position: 'System Administrator',
            location: 'Dubai'
          }
        }
      ];

      setUsers(mockUsers);
      setTotalPages(Math.ceil(mockUsers.length / itemsPerPage));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(user => {
          switch (key) {
            case 'status':
              return value === 'active' ? user.is_active : !user.is_active;
            case 'role':
              return user.roles.includes(value);
            case 'department':
              return user.profile_data?.department?.toLowerCase().includes(value.toLowerCase());
            default:
              return true;
          }
        });
      }
    });

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    try {
      // Mock API call - replace with actual implementation
      const newUserData: User = {
        id: Date.now(),
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        roles: newUser.roles,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_data: newUser.profile_data
      };

      setUsers([newUserData, ...users]);
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        full_name: '',
        password: '',
        roles: [],
        profile_data: {
          phone: '',
          department: '',
          position: '',
          location: ''
        }
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_active: isActive, updated_at: new Date().toISOString() } : user
      ));
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const handleUpdateUserRoles = async (userId: number, newRoles: string[]) => {
    try {
      setUsers(users.map(user =>
        user.id === userId ? { ...user, roles: newRoles, updated_at: new Date().toISOString() } : user
      ));
      setShowRoleModal(false);
      setSelectedUserForRole(null);
    } catch (error) {
      console.error('Failed to update user roles:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      switch (action) {
        case 'activate':
          setUsers(users.map(user =>
            selectedUsers.includes(user.id) ? { ...user, is_active: true } : user
          ));
          break;
        case 'deactivate':
          setUsers(users.map(user =>
            selectedUsers.includes(user.id) ? { ...user, is_active: false } : user
          ));
          break;
        case 'delete':
          setUsers(users.filter(user => !selectedUsers.includes(user.id)));
          break;
      }
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'super_admin': 'bg-red-100 text-red-800',
      'content_admin': 'bg-purple-100 text-purple-800',
      'user_admin': 'bg-blue-100 text-blue-800',
      'content_editor': 'bg-green-100 text-green-800',
      'content_reviewer': 'bg-yellow-100 text-yellow-800',
      'job_seeker': 'bg-indigo-100 text-indigo-800',
      'hr_recruiter': 'bg-pink-100 text-pink-800',
      'mentor': 'bg-orange-100 text-orange-800',
      'educator': 'bg-teal-100 text-teal-800',
      'assessor': 'bg-cyan-100 text-cyan-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                onClick={fetchUsers}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  {availableRoles.map(role => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Department"
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                  value={filters.date_range}
                  onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-3" />
              <span className="text-lg font-medium text-gray-700">Loading users...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(filteredUsers.map(user => user.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.full_name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {user.is_active ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4 text-red-500" />
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.slice(0, 2).map((role, index) => (
                            <span key={index} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(role)}`}>
                              {role.replace('_', ' ')}
                            </span>
                          ))}
                          {user.roles.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{user.roles.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.profile_data?.department || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.last_login ? formatRelativeTime(user.last_login) : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUserForRole(user);
                              setShowRoleModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded-md hover:bg-purple-50 transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateUserStatus(user.id, !user.is_active)}
                            className={`p-1 rounded-md transition-colors ${
                              user.is_active 
                                ? 'text-red-600 hover:text-red-900 hover:bg-red-50' 
                                : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            }`}
                          >
                            {user.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {availableRoles.map(role => (
                    <label key={role} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newUser.roles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({ ...newUser, roles: [...newUser.roles, role] });
                          } else {
                            setNewUser({ ...newUser, roles: newUser.roles.filter(r => r !== role) });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newUser.profile_data.department}
                    onChange={(e) => setNewUser({ 
                      ...newUser, 
                      profile_data: { ...newUser.profile_data, department: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter department"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={newUser.profile_data.position}
                    onChange={(e) => setNewUser({ 
                      ...newUser, 
                      profile_data: { ...newUser.profile_data, position: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter position"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUserForRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage User Roles</h3>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUserForRole(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Managing roles for: <strong>{selectedUserForRole.full_name}</strong>
              </p>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableRoles.map(role => (
                <label key={role} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedUserForRole.roles.includes(role)}
                    onChange={(e) => {
                      const newRoles = e.target.checked
                        ? [...selectedUserForRole.roles, role]
                        : selectedUserForRole.roles.filter(r => r !== role);
                      setSelectedUserForRole({ ...selectedUserForRole, roles: newRoles });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(role)}`}>
                    {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUserForRole(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateUserRoles(selectedUserForRole.id, selectedUserForRole.roles)}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Roles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
