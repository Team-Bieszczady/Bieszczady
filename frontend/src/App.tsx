import { useEffect } from 'react';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SelectedProjectProvider } from './context/SelectedProjectContext';
import Router from './Router';

const MAX_VISIBLE_TOASTS = 3;

export default function App() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((item) => item.visible)
      .filter((_, index) => index >= MAX_VISIBLE_TOASTS)
      .forEach((item) => toast.dismiss(item.id));
  }, [toasts]);

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
