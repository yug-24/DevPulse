import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import { Zap } from 'lucide-react';

/**
 * This page is hit after a successful GitHub OAuth redirect.
 * The server passes the token in the URL params. We save it to localStorage
 * to support browsers that block third-party cookies, then fetch the user.
 */
const OAuthCallbackPage = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      if (token) {
        localStorage.setItem('token', token);
      }

      const user = await refreshUser();
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/?error=auth_failed', { replace: true });
      }
    };

    handleCallback();
  }, [refreshUser, navigate]);

  return (
    <div className="min-h-screen bg-gh-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mx-auto mb-6">
          <Zap size={22} className="text-white" />
        </div>
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gh-text font-medium">Connecting your GitHub…</p>
        <p className="text-gh-muted text-sm mt-2">Setting up your dashboard</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
