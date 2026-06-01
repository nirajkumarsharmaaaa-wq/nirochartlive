import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [models, setModels] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('nirochart_admin_token');

  useEffect(() => {
    if (!token) { navigate('/admin/login'); return; }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const [statsRes, modelsRes] = await Promise.all([
        fetch('${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats', { headers }),
        fetch('${import.meta.env.VITE_API_URL}/api/admin/all-models', { headers })
      ]);
      
      if (statsRes.status === 401 || statsRes.status === 403) {
        localStorage.removeItem('nirochart_admin_token');
        navigate('/admin/login');
        return;
      }
      
      setStats(await statsRes.json());
      setModels(await modelsRes.json());
    } catch (error) { console.error("Admin fetch error", error); }
  };

  const updateModelStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to mark this model as ${status}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/models/${id}/status?status=${status}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData(); // Refresh data
    } catch (err) { console.error(err); }
  };

  const getImageUrl = (path) => `${import.meta.env.VITE_API_URL}/${path.replace(/\\/g, '/')}`;

  // Filter Data
  const pendingModels = models.filter(m => m.status === 'pending');
  const approvedModels = models.filter(m => m.status === 'approved' || m.status === 'blocked');

  if (!stats) return <div className="h-screen bg-gray-900 text-white flex justify-center items-center">Loading Admin...</div>;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-gray-800 text-red-500">Admin Control</div>
        <div className="flex flex-col flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`p-3 text-left rounded ${activeTab === 'dashboard' ? 'bg-red-600' : 'hover:bg-gray-800'}`}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('pending')} className={`p-3 text-left rounded flex justify-between ${activeTab === 'pending' ? 'bg-red-600' : 'hover:bg-gray-800'}`}>
            <span>📋 KYC Requests</span>
            {pendingModels.length > 0 && <span className="bg-white text-red-600 px-2 rounded-full text-xs font-bold py-0.5">{pendingModels.length}</span>}
          </button>
          <button onClick={() => setActiveTab('manage')} className={`p-3 text-left rounded ${activeTab === 'manage' ? 'bg-red-600' : 'hover:bg-gray-800'}`}>👩‍🎤 Manage Models</button>
        </div>
        <div className="p-4">
          <button onClick={() => { localStorage.removeItem('nirochart_admin_token'); navigate('/admin/login'); }} className="w-full bg-gray-800 hover:bg-red-600 p-3 rounded font-bold transition-colors">Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Platform Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <p className="text-gray-400">Total Approved Models</p>
                <p className="text-3xl font-bold text-white">{stats.total_models}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <p className="text-gray-400">Registered Viewers</p>
                <p className="text-3xl font-bold text-white">{stats.total_viewers}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <p className="text-gray-400">Active Live Streams</p>
                <p className="text-3xl font-bold text-green-500">{stats.active_streams}</p>
              </div>
              <div className="bg-gradient-to-br from-red-900/50 to-gray-800 p-6 rounded-xl border border-red-500/30">
                <p className="text-red-300">Platform Revenue (20% Cut)</p>
                <p className="text-3xl font-bold text-yellow-500">💎 {stats.platform_revenue_coins}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENDING KYC */}
        {activeTab === 'pending' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Pending KYC Approvals</h2>
            {pendingModels.length === 0 ? <p className="text-gray-400">No pending requests.</p> : (
              <div className="grid grid-cols-1 gap-6">
                {pendingModels.map(model => (
                  <div key={model.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white">{model.display_name} <span className="text-sm text-gray-400 ml-2">({model.email})</span></h3>
                      <p className="text-gray-400 text-sm mt-1">DOB: {model.dob} | Body: {model.body_type} | Niche: {model.interests}</p>
                      <div className="flex space-x-4 mt-3">
                        <a href={getImageUrl(model.id_front_path)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">ID Front</a>
                        <a href={getImageUrl(model.id_back_path)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">ID Back</a>
                        <a href={getImageUrl(model.selfie_path)} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Selfie</a>
                      </div>
                    </div>
                    <div className="space-x-3">
                      <button onClick={() => updateModelStatus(model.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold">Approve</button>
                      <button onClick={() => updateModelStatus(model.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGE MODELS (Block/Unblock) */}
        {activeTab === 'manage' && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Manage Active Models</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-left text-white">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="p-4">Model Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Wallet Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedModels.map(model => (
                    <tr key={model.id} className="border-b border-gray-800 hover:bg-gray-750">
                      <td className="p-4 font-bold">{model.display_name}</td>
                      <td className="p-4 text-gray-400">{model.email}</td>
                      <td className="p-4 text-yellow-400 font-bold">💎 {model.wallet_balance}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${model.status === 'approved' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {model.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        {model.status === 'approved' ? (
                          <button onClick={() => updateModelStatus(model.id, 'blocked')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold">Block Model</button>
                        ) : (
                          <button onClick={() => updateModelStatus(model.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold">Unblock</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;