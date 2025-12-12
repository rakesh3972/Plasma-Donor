import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', bloodGroup: '', address: '' });
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState('');
  const navigate = useNavigate();
  const prevRecipientIds = useRef([]);

  useEffect(() => {
    let interval;
    api.get('/profile')
      .then(res => {
        setUser(res.data);
        setForm({
          name: res.data.name,
          bloodGroup: res.data.bloodGroup,
          address: res.data.location?.address || ''
        });
        // Fetch recipients if location is available
        if (res.data.location?.lat && res.data.location?.lng) {
          const fetchRecipients = () => {
            setRecipientsLoading(true);
            api.get('/search/recipients', {
              params: {
                bloodGroup: res.data.bloodGroup,
                lat: res.data.location.lat,
                lng: res.data.location.lng,
                radius: 10
              }
            })
              .then(rres => {
                setRecipients(rres.data);
                // Notification logic
                const newIds = rres.data.map(r => r._id);
                const prevIds = prevRecipientIds.current;
                const newOnes = rres.data.filter(r => !prevIds.includes(r._id));
                if (prevIds.length > 0 && newOnes.length > 0) {
                  toast.info(`${newOnes.length} new plasma request(s) nearby!`);
                }
                prevRecipientIds.current = newIds;
              })
              .catch(() => setRecipientsError('Failed to fetch recipients'))
              .finally(() => setRecipientsLoading(false));
          };
          fetchRecipients();
          interval = setInterval(fetchRecipients, 30000); // Poll every 30s
        }
      })
      .catch(() => navigate('/'));
    api.get('/donation/history').then(res => setHistory(res.data));
    return () => { if (interval) clearInterval(interval); };
  }, [navigate]);

  // Move logout handler up for Sidebar
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleAvailabilityToggle = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const updated = await api.put('/profile', { isAvailable: !user.isAvailable });
      setUser(updated.data);
    } catch (err) {
      // Optionally show error
      alert('Failed to update availability');
    }
    setIsUpdating(false);
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleEditSave = async e => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updated = await api.put('/profile', {
        name: form.name,
        bloodGroup: form.bloodGroup,
        location: { ...user.location, address: form.address }
      });
      setUser(updated.data);
      setEdit(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Update failed');
    }
    setIsUpdating(false);
  };

  // Helper to calculate next eligible date
  const getNextEligibleDate = () => {
    if (!user?.lastDonationDate) return null;
    const last = new Date(user.lastDonationDate);
    const next = new Date(last);
    next.setDate(last.getDate() + 14); // 14 days after last donation
    return next;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={handleLogout} />
        <main className="flex-1 p-6 md:p-10 space-y-8">
          {user ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Donation Statistics Section */}
                <div className="bg-white/90 p-8 rounded-2xl shadow-lg border border-blue-100">
                  <h2 className="text-xl font-bold mb-3 text-blue-700 tracking-wide">Donation Statistics</h2>
                  <div className="mb-1">Total Donations: <span className="font-semibold text-blue-600">{history.length}</span></div>
                  <div>Last Donation Date: <span className="font-semibold">{history.length > 0 ? history[0].date.slice(0,10) : '-'}</span></div>
                  {history.length >= 5 && (
                    <div className="mt-3 inline-block bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900 px-4 py-2 rounded-xl font-semibold shadow">Super Donor Badge 🏅</div>
                  )}
                </div>
                {/* Next Eligible Donation Date & Availability */}
                <div className="bg-white/90 p-8 rounded-2xl shadow-lg border border-blue-100 flex flex-col gap-4">
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">Welcome, {user.name}!</div>
                    <div className="text-sm text-gray-600">Role: {user.role}</div>
                  </div>
                  <div className="text-sm">
                    {user.lastDonationDate ? (
                      <>
                        Last Donation: <span className="font-semibold">{user.lastDonationDate.slice(0,10)}</span><br />
                        Next Eligible Donation Date: <span className="font-semibold text-blue-700">{getNextEligibleDate().toLocaleDateString()}</span>
                      </>
                    ) : (
                      <span className="text-green-700">You are eligible to donate now.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="font-medium">Available to Donate:</label>
                    <button
                      onClick={handleAvailabilityToggle}
                      className={`px-3 py-1 rounded-lg font-semibold shadow ${user.isAvailable ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                      disabled={isUpdating}
                    >
                      {user.isAvailable ? 'Yes' : 'No'}
                    </button>
                    {isUpdating && <span className="text-xs text-gray-500 ml-2">Updating...</span>}
                  </div>
                </div>
              </div>
              {/* Profile Management */}
              <div className="bg-white/90 p-8 rounded-2xl shadow-lg border border-blue-100">
                <h2 className="text-xl font-bold mb-3 text-blue-700 tracking-wide">Profile Management</h2>
                {edit ? (
                  <form onSubmit={handleEditSave} className="space-y-3">
                    <input name="name" value={form.name} onChange={handleEditChange} className="w-full border p-2 rounded-lg" placeholder="Name" required />
                    <input name="bloodGroup" value={form.bloodGroup} onChange={handleEditChange} className="w-full border p-2 rounded-lg" placeholder="Blood Group" required />
                    <input name="address" value={form.address} onChange={handleEditChange} className="w-full border p-2 rounded-lg" placeholder="Address" />
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition" disabled={isUpdating}>Save</button>
                    <button type="button" className="ml-2 px-4 py-2 rounded-lg border shadow" onClick={() => setEdit(false)} disabled={isUpdating}>Cancel</button>
                  </form>
                ) : (
                  <div>
                    <div className="mb-2">Blood Group: <span className="font-semibold">{user.bloodGroup}</span></div>
                    <div className="mb-2">Address: <span className="font-semibold">{user.location?.address || '-'}</span></div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition" onClick={() => setEdit(true)}>Edit Profile</button>
                  </div>
                )}
              </div>
              {/* Donation History Section */}
              <div className="bg-white/90 p-8 rounded-2xl shadow-lg border border-blue-100">
                <h2 className="text-xl font-bold mb-3 text-blue-700 tracking-wide">Donation History</h2>
                {history.length === 0 ? (
                  <div className="text-gray-500">No donations logged yet.</div>
                ) : (
                  <ul className="divide-y">
                    {history.map(d => (
                      <li key={d._id} className="py-2">
                        <div>Date: <span className="font-semibold">{d.date.slice(0,10)}</span></div>
                        <div>Recipient: <span className="font-semibold">{d.recipientId}</span></div>
                        <div>Notes: <span className="font-semibold">{d.notes || '-'}</span></div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Recipient Requests Section */}
              <div className="bg-white/90 p-8 rounded-2xl shadow-lg border border-blue-100">
                <h2 className="text-xl font-bold mb-3 text-blue-700 tracking-wide">Nearby Recipient Requests</h2>
                {!user?.location?.lat || !user?.location?.lng ? (
                  <div className="text-gray-500">Please update your profile with your location to see nearby requests.</div>
                ) : recipientsLoading ? (
                  <div>Loading recipients...</div>
                ) : recipientsError ? (
                  <div className="text-red-500">{recipientsError}</div>
                ) : recipients.length === 0 ? (
                  <div className="text-gray-500">No matching recipient requests found nearby.</div>
                ) : (
                  <ul className="divide-y">
                    {recipients.map(r => (
                      <li key={r._id} className="py-2">
                        <div className="font-semibold text-blue-700">{r.name} ({r.bloodGroup})</div>
                        <div>Address: <span className="font-semibold">{r.location?.address || '-'}</span> | Lat: {r.location?.lat}, Lng: {r.location?.lng}</div>
                        <div>Distance: <span className="font-semibold">{r.dist?.calculated ? (r.dist.calculated/1000).toFixed(2) + ' km' : '-'}</span></div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div>Loading...</div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard; 