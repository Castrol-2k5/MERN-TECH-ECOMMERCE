import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AppRoutes from './routes/AppRoutes.jsx';
import DataModeToggle from './components/common/DataModeToggle.jsx';
import { bootstrapAuth } from './store/slices/authSlice.js';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return (
    <>
      <AppRoutes />
      <DataModeToggle />
    </>
  );
}

export default App;

