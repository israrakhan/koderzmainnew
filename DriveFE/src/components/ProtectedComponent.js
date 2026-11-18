import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const ProtectedComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Example protected API call: GET /users/{uuid}
        // Replace {uuid} with actual UUID
        const response = await api.get('/users/some-uuid'); // Adjust endpoint as needed
        setData(response.data);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          // Redirect to login on 401
          navigate('/login');
        } else {
          setError('Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (refreshToken) {
        const response = await api.post('/logout', { refreshToken });
        console.log('Logout response from backend:', response);
      } else {
        console.warn('No refresh token found, clearing local tokens only');
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Continue to clear local storage even if backend logout fails
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      console.log('Cleared local storage, redirecting to login',localStorage());
      navigate('/login');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Protected Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default ProtectedComponent;