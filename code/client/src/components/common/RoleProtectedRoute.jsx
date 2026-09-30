import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const RoleProtectedRoute = ({ allowedRoles = ['STAFF', 'BRANCH_MANAGER', 'SUPER_ADMIN'] }) => {
  // Giả định auth state trong Redux hoặc fallback cho phép dev
  const auth = useSelector((state) => state.auth);
  const user = auth?.user || { role: 'STAFF', fullName: 'Nhân viên Quầy TechOne' };

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
