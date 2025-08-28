'use client';

import { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import QuestionsManager from './QuestionsManager';

// Minimal inline button replacement for redesigned static UI areas
function SmallButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        'px-3 py-1 rounded-md border border-black bg-black text-white text-xs font-semibold hover:opacity-80 transition ' +
        (props.className || '')
      }
    />
  );
}

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  streak: number;
  problemsSolved: number;
  lastActive: Date;
  status: 'active' | 'inactive' | 'banned';
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProblems: number;
  totalSubmissions: number;
}

interface Question {
  id?: string;
  title: string;
  description: string;
  difficulty?: string;
  category?: string;
  tags?: string[];
  example?: string;
  constraints?: string;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProblems: 45,
    totalSubmissions: 0
  });
  const [selectedTab, setSelectedTab] = useState<'users' | 'analytics' | 'content' | 'questions' | 'settings'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [extractedQuestions, setExtractedQuestions] = useState<Question[]>([]);

  // Color scheme matching Dashboard
  const baseBg = '#FED3A8'; // page background
  const orange = '#FF7D21'; // primary panel color
  const orangeLight = '#FF7D21'; // accent color
  const cream = '#FED3A8';

  // Fetch users and stats from Firebase Admin API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
          const usersResponse = await fetch('/api/admin?action=users');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(usersData.users || []);
          } else {
            const text = await usersResponse.text();
            console.error('Error response (users):', text);
          }

          // Fetch stats
          const statsResponse = await fetch('/api/admin?action=stats');
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData.stats || {
              totalUsers: 0,
              activeUsers: 0,
              totalProblems: 45,
              totalSubmissions: 0
            });
          } else {
            const text = await statsResponse.text();
            console.error('Error response (stats):', text);
          }
        
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'banned') => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateUser',
          userId,
          updateData: { status }
        })
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
      } else {
        console.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteUser',
          userId
        })
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md border-2 border-black bg-white"
        />
        <SmallButton>Add User</SmallButton>
      </div>

      {/* Users Table */}
      <div
        className="rounded-md border-2 border-black overflow-hidden"
        style={{ backgroundColor: cream }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: orange }} className="border-b-2 border-black">
                <th className="px-4 py-3 text-left font-bold text-black">Name</th>
                <th className="px-4 py-3 text-left font-bold text-black">Email</th>
                <th className="px-4 py-3 text-left font-bold text-black">Streak</th>
                <th className="px-4 py-3 text-left font-bold text-black">Problems</th>
                <th className="px-4 py-3 text-left font-bold text-black">Status</th>
                <th className="px-4 py-3 text-left font-bold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-black/20">
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border border-black"
                      style={{ backgroundColor: '#000', color: orangeLight }}
                    >
                      {user.streak}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{user.problemsSolved}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold border border-black ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <select
                        value={user.status}
                        onChange={(e) => updateUserStatus(user.id, e.target.value as any)}
                        className="text-xs px-2 py-1 rounded border border-black bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="banned">Banned</option>
                      </select>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-xs px-2 py-1 rounded border border-red-500 bg-red-500 text-white hover:opacity-80"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: 'Total Users', value: stats.totalUsers, icon: '👥' },
        { label: 'Active Users', value: stats.activeUsers, icon: '🟢' },
        { label: 'Total Problems', value: stats.totalProblems, icon: '📝' },
        { label: 'Submissions', value: stats.totalSubmissions, icon: '📊' }
      ].map((stat, index) => (
        <div
          key={index}
          className="rounded-md border-2 border-black p-6 text-center"
          style={{ backgroundColor: cream }}
        >
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div
            className="text-3xl font-bold mb-2 font-arbutus"
            style={{ color: '#1A1109' }}
          >
            {stat.value.toLocaleString()}
          </div>
          <div className="text-sm font-semibold" style={{ fontFamily: 'monospace', color: '#27190D' }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );

  const renderContentTab = () => (
    <div className="space-y-6">
      <div
        className="rounded-md border-2 border-black p-6"
        style={{ backgroundColor: cream }}
      >
        <h3 className="font-bold text-xl mb-4 font-arbutus" style={{ color: '#1A1109' }}>
          Daily Question Management
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Today's Question</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-md border-2 border-black bg-white"
              placeholder="Enter today's coding challenge..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2 rounded-md border-2 border-black bg-white h-32"
              placeholder="Detailed description of the problem..."
            />
          </div>
          <SmallButton>Update Question</SmallButton>
        </div>
      </div>
    </div>
  );

  const renderQuestionsTab = () => (
    <div className="space-y-6">
      {extractedQuestions.length === 0 ? (
        <FileUpload 
          onQuestionsExtracted={setExtractedQuestions}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl font-arbutus" style={{ color: '#1A1109' }}>
              Manage Questions
            </h3>
            <SmallButton onClick={() => setExtractedQuestions([])}>
              Upload New File
            </SmallButton>
          </div>
          <QuestionsManager 
            questions={extractedQuestions}
            onQuestionsUpdate={setExtractedQuestions}
          />
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div
        className="rounded-md border-2 border-black p-6"
        style={{ backgroundColor: cream }}
      >
        <h3 className="font-bold text-xl mb-4 font-arbutus" style={{ color: '#1A1109' }}>
          System Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Maintenance Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">User Registration</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Daily Streak Reset Time</label>
            <input
              type="time"
              className="px-4 py-2 rounded-md border-2 border-black bg-white"
              defaultValue="00:00"
            />
          </div>
          <SmallButton>Save Settings</SmallButton>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: baseBg }}>
        <div className="text-2xl font-bold font-arbutus">Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: baseBg }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-arbutus" style={{ color: '#000' }}>
            Admin Dashboard
          </h1>
          <p className="text-xs mt-1" style={{ color: '#181818' }}>
            System administration panel
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-black text-white rounded-full px-6 h-12 border-2 border-black shadow" style={{ fontFamily: 'monospace' }}>
            <span className="text-lg font-semibold mr-2 font-arbutus">Admin</span>
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: orangeLight, color: '#000' }}>A</span>
          </div>
          <button
            onClick={onLogout}
            className="w-12 h-12 rounded-full border-4 border-black flex items-center justify-center bg-white hover:scale-95 transition shadow"
          >
            <span className="text-lg font-bold text-black">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </span>
          </button>
        </div>
      </div>

      <div className="px-6 pb-12">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { key: 'users', label: 'Users', icon: '👥' },
            { key: 'analytics', label: 'Analytics', icon: '📊' },
            { key: 'content', label: 'Content', icon: '📝' },
            { key: 'questions', label: 'Questions', icon: '📋' },
            { key: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-6 py-3 rounded-md border-2 border-black font-bold text-sm whitespace-nowrap transition ${
                selectedTab === tab.key
                  ? 'text-white shadow-md'
                  : 'text-black hover:opacity-80'
              }`}
              style={{
                backgroundColor: selectedTab === tab.key ? orange : cream
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          className="rounded-md border-2 border-black p-8"
          style={{ backgroundColor: orange }}
        >
          {selectedTab === 'users' && renderUsersTab()}
          {selectedTab === 'analytics' && renderAnalyticsTab()}
          {selectedTab === 'content' && renderContentTab()}
          {selectedTab === 'questions' && renderQuestionsTab()}
          {selectedTab === 'settings' && renderSettingsTab()}
        </div>
      </div>
    </div>
  );
}
