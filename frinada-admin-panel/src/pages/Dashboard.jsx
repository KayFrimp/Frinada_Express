import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (err) {
      // Optionally handle error
    } finally {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f6fa',
        position: 'relative',
      }}
    >
      <Button
        variant="contained"
        onClick={handleLogout}
        sx={{
          position: 'absolute',
          top: 32,
          right: 32,
          backgroundColor: '#02830A',
          color: '#fff',
          fontWeight: 700,
          '&:hover': { backgroundColor: '#020051' },
          boxShadow: '0 4px 16px 0 rgba(2, 131, 10, 0.10)',
        }}
      >
        Logout
      </Button>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#02830A' }}>
        Welcome to Dashboard
      </Typography>
      <Typography variant="body1" sx={{ color: '#020051' }}>
        You have successfully logged in to your account.
      </Typography>
    </Box>
  );
};

export default Dashboard; 