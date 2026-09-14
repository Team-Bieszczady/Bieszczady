import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SelectedProjectProvider } from './context/SelectedProjectContext';
import Router from './Router';

export default function App() {
  return (
    <AuthProvider>
      <SelectedProjectProvider>
        <Router />
      </SelectedProjectProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          success: { duration: 3000 },
          error: { duration: 5000 },
        }}
      />
    </AuthProvider>
  );
}
