import { Outlet } from 'react-router';
import logo from '../assets/logo_bieszczadzki_ul.jpg';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#eeeeee] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 max-sm:p-4">
        <div className="flex justify-center mb-2">
          <img
            src={logo}
            alt="Bieszczadzki UL"
            className="h-16 700:h-20 w-16 700:w-20"
          />
        </div>

        <Outlet />
      </div>
    </div>
  );
}
