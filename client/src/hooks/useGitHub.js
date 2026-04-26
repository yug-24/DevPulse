import { useState, useEffect, useCallback, useRef } from 'react';
import api, { getErrorMessage } from '../utils/api';
import toast from 'react-hot-toast';

const useGitHub = (username = null) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const fetchedRef = useRef(false);

  const fetch = useCallback(async (bust = false) => {
    setLoading(true);
    setError(null);
    try {
      if (bust) await api.post('/github/refresh').catch(() => {});
      const params = username ? { username } : {};
      const res = await api.get('/github/all', { params });
      setData(res.data.data);  // Extract the data from the response
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch();
  }, [fetch]);

  const refresh = useCallback(async () => {
    fetchedRef.current = false;
    await fetch(true);
  }, [fetch]);

  return { data, loading, error, refresh };
};

export default useGitHub;
