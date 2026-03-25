import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function useAuthRedirect(shouldBeAuthed) {
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldBeAuthed && !token) {
      navigate('/login', { replace: true });
    }
    if (!shouldBeAuthed && token) {
      navigate('/', { replace: true });
    }
  }, [shouldBeAuthed, token, navigate]);
}

export default useAuthRedirect;

