import { useState, forwardRef } from 'react';
import { SlLock } from 'react-icons/sl';
import { IoEyeOutline } from 'react-icons/io5';

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, ...props }, ref) {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div>
        <label className="block text-dark font-semibold text-xs mb-2">
          {label}
        </label>
        <div className="group relative">
          <SlLock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark opacity-40 group-focus-within:text-darkGreen group-focus-within:opacity-100 transition-colors max-sm:w-4 max-sm:h-4" />
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className="text-xs w-full h-10 pl-10 pr-10 bg-white border border-gray-100 transition-all hover:border-darkGreen/60 rounded-lg text-dark placeholder-dark placeholder-opacity-30 focus:outline-none focus:ring-1 focus:ring-darkGreen/60 focus:border-transparent"
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 text-dark opacity-40 hover:opacity-60 transition-all"
          >
            <IoEyeOutline className="max-sm:w-4 max-sm:h-4" />
          </button>
        </div>
      </div>
    );
  },
);
