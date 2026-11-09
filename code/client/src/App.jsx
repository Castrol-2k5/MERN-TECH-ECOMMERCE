import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AppRoutes from './routes/AppRoutes.jsx';
import DataModeToggle from './components/common/DataModeToggle.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { bootstrapAuth } from './store/slices/authSlice.js';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <AppRoutes />
      <DataModeToggle />
    </ErrorBoundary>
  );
}

export default App;
