import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import DashboardLayout from './layouts/DashboardLayout';
import FullscreenLayout from './layouts/FullscreenLayout';
import PrintLayout from './layouts/PrintLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Users from './pages/Users';
import SystemUsers from './pages/SystemUsers';
import StudentManagement from './pages/StudentManagement';
import Rooms from './pages/Rooms';
import Contracts from './pages/Contracts';
import Payments from './pages/Payments';
import Services from './pages/Services';
import ServiceOrders from './pages/ServiceOrders';
import Activities from './pages/Activities';
import ActivityRegistrations from './pages/ActivityRegistrations';
import CheckoutRequests from './pages/CheckoutRequests';
import BusTrips from './pages/BusTrips';
import FoodMenu from './pages/FoodMenu';
import FoodOrders from './pages/FoodOrders';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Error404 from './pages/Error404';
import Unauthorized from './pages/Unauthorized'; // You'll need to create this page
import ForgotPassword from './pages/ForgotPassword'; // Fixed typo: was 'ForgotPasswordl'
import ResetPassword from './pages/ChangePassword'; // Fixed import: was 'ChangePassword'

// Role-based access control configuration
const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  RESTAURANT: 'restaurant'
};

const ROUTE_PERMISSIONS = {
  '/dashboard': [ROLES.ADMIN],
  '/users': [ROLES.ADMIN],
  '/system-users': [ROLES.ADMIN],
  '/students': [ROLES.ADMIN],
  '/rooms': [ROLES.ADMIN],
  '/contracts': [ROLES.ADMIN],
  '/payments': [ROLES.ADMIN],
  '/services': [ROLES.ADMIN, ROLES.STAFF],
  '/orders': [ROLES.ADMIN, ROLES.STAFF],
  '/activities': [ROLES.ADMIN],
  '/activity-registrations': [ROLES.ADMIN],
  '/checkout-requests': [ROLES.ADMIN],
  '/bus-trips': [ROLES.ADMIN],
  '/food-menu': [ROLES.ADMIN, ROLES.RESTAURANT],
  '/food-orders': [ROLES.ADMIN, ROLES.RESTAURANT],
  '/reports': [ROLES.ADMIN],
  '/settings': [ROLES.ADMIN],
  '/profile': [ROLES.ADMIN, ROLES.STAFF, ROLES.RESTAURANT],
  '/print/*': [ROLES.ADMIN, ROLES.STAFF, ROLES.RESTAURANT]
};

// Auth guard component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Role-based route protection component
const RoleProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  const userRole = user?.role?.toLowerCase();
  const hasPermission = requiredRoles.length === 0 || requiredRoles.includes(userRole);
  
  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// Guest route component (for unauthenticated access)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }
  
  // If user is already authenticated, redirect to their default route
  if (isAuthenticated) {
    const defaultRoute = getDefaultRoute(user?.role);
    return <Navigate to={defaultRoute} replace />;
  }
  
  return children;
};

// Helper function to get default route based on user role
const getDefaultRoute = (userRole) => {
  switch (userRole?.toLowerCase()) {
    case ROLES.ADMIN:
      return '/dashboard';
    case ROLES.STAFF:
      return '/services';
    case ROLES.RESTAURANT:
      return '/food-menu';
    default:
      return '/dashboard';
  }
};

// Dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useAuth();
  const defaultRoute = getDefaultRoute(user?.role);
  return <Navigate to={defaultRoute} replace />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<DashboardRedirect />} />
      
      {/* Guest routes (unauthenticated access) */}
      <Route path="/login" element={
        <GuestRoute>
          <FullscreenLayout>
            <Login />
          </FullscreenLayout>
        </GuestRoute>
      } />
      
      <Route path="/forgot-password" element={
        <GuestRoute>
          <FullscreenLayout>
            <ForgotPassword />
          </FullscreenLayout>
        </GuestRoute>
      } />
      
      <Route path="/reset-password" element={
        <GuestRoute>
          <FullscreenLayout>
            <ResetPassword />
          </FullscreenLayout>
        </GuestRoute>
      } />
      
      {/* Unauthorized page */}
      <Route path="/unauthorized" element={
        <ProtectedRoute>
          <FullscreenLayout>
            <Unauthorized />
          </FullscreenLayout>
        </ProtectedRoute>
      } />
      
      {/* Protected routes with role-based access */}
      <Route path="/dashboard" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/dashboard']}>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      {/* Admin only routes */}
      <Route path="/users" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/users']}>
          <DashboardLayout>
            <Users />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/system-users" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/system-users']}>
          <DashboardLayout>
            <SystemUsers />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/students" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/students']}>
          <DashboardLayout>
            <StudentManagement />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/rooms" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/rooms']}>
          <DashboardLayout>
            <Rooms />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/contracts" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/contracts']}>
          <DashboardLayout>
            <Contracts />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/payments" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/payments']}>
          <DashboardLayout>
            <Payments />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/activities" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/activities']}>
          <DashboardLayout>
            <Activities />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/activity-registrations" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/activity-registrations']}>
          <DashboardLayout>
            <ActivityRegistrations />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/checkout-requests" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/checkout-requests']}>
          <DashboardLayout>
            <CheckoutRequests />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/bus-trips" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/bus-trips']}>
          <DashboardLayout>
            <BusTrips />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/reports']}>
          <DashboardLayout>
            <Reports />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/settings']}>
          <DashboardLayout>
            <Settings />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      {/* Admin and Staff routes */}
      <Route path="/services" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/services']}>
          <DashboardLayout>
            <Services />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/orders']}>
          <DashboardLayout>
            <ServiceOrders />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      {/* Admin and Restaurant routes */}
      <Route path="/food-menu" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/food-menu']}>
          <DashboardLayout>
            <FoodMenu />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      <Route path="/food-orders" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/food-orders']}>
          <DashboardLayout>
            <FoodOrders />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      {/* All authenticated users */}
      <Route path="/profile" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/profile']}>
          <DashboardLayout>
            <Profile />
          </DashboardLayout>
        </RoleProtectedRoute>
      } />
      
      {/* Print routes */}
      <Route path="/print/*" element={
        <RoleProtectedRoute requiredRoles={ROUTE_PERMISSIONS['/print/*']}>
          <PrintLayout />
        </RoleProtectedRoute>
      } />
      
      {/* Error routes */}
      <Route path="*" element={
        <FullscreenLayout>
          <Error404 />
        </FullscreenLayout>
      } />
    </Routes>
  );
}

export default App;