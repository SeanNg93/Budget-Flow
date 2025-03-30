import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RedirectRoute = ({ to }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);
  
  return null;
};

export default RedirectRoute; 