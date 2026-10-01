import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const RoleProtectedRoute = ({ allowedRoles = ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN'] }) => {
  const location = useLocation();
  const auth = useSelector((state) => state.auth);
  const user = auth?.user;

  if (!auth?.isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
