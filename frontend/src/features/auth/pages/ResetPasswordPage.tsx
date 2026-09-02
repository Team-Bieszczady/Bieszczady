import { useForm, useWatch } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { GoAlert, GoCircle } from 'react-icons/go';
import { Button } from '../../../components/ui/Button';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { isApiError } from '../../../lib/api';
import { useConfirmPasswordReset } from '../hooks/useConfirmPasswordReset';
import { useAuth } from '../../../context/useAuth';
import { useState } from 'react';

interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: 'Co najmniej 8 znaków', test: (v) => v.length >= 8 },
  {
    label: 'Wielka i mała litera',
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  { label: 'Co najmniej jedna cyfra', test: (v) => /\d/.test(v) },
  { label: 'Znak specjalny: @ $ ! % * ? &', test: (v) => /[@$!%*?&]/.test(v) },
];

interface ResetPasswordFormInputs {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuth();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>({
    mode: 'onChange',
  });
  const [searchParams] = useSearchParams();
  const newPasswordMutation = useConfirmPasswordReset();
  const newPasswordValue = useWatch({ control, name: 'newPassword' }) ?? '';
  const [linkDead, setLinkDead] = useState<boolean>(false);

  const token = searchParams.get('token');

  if (!token || linkDead) {
    return (
      <>
        <h1 className="text-center text-dark font-semibold text-base mb-2 500:text-lg">
          Link jest nieaktualny
        </h1>

        <p className="text-center text-xs text-dark/60 mb-6">
          Ten link do ustawienia hasła wygasł lub został już użyty. Wyślij nowy
          link, żeby ustawić hasło.
        </p>

        <div className="flex items-start gap-3 rounded-lg bg-[#FDF4EC] px-4 py-3 mb-10">
          <GoAlert className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[#C2703A]" />
          <div className="text-xs text-dark/60 space-y-1">
            <p>Link jest ważny 60 minut i można użyć go tylko raz.</p>
            <p>Otwórz zawsze najnowszą wiadomość e-mail.</p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="primary"
            size="small"
            className="w-full max-w-[250px] px-3 py-2.5"
            onClick={() => navigate('/forgot-password')}
          >
            Wyślij nowy link
          </Button>
        </div>

        <p className="text-center text-sm text-dark/60 mt-8">
          Pamiętasz hasło?{' '}
          <Link
            to="/login"
            className="text-darkGreen transition-all duration-300 hover:text-darkGreenHover hover:underline"
          >
            Wróć do logowania
          </Link>
        </p>
      </>
    );
  }
  const onSubmit = (data: ResetPasswordFormInputs) =>
    newPasswordMutation.mutate(
      {
        token: token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success('Hasło zostało ustawione');
          // The backend just revoked every session for this user; drop ours too,
          // so a logged-in visitor cannot keep browsing on the old one.
          clearSession();
          queryClient.clear();
          navigate('/login');
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 400) {
            setLinkDead(true);
          } else {
            toast.error('Coś poszło nie tak. Spróbuj ponownie.');
          }
        },
      },
    );

  return (
    <>
      <h1 className="text-center text-dark font-semibold text-base mb-3  500:text-lg">
        Ustaw nowe hasło
      </h1>

      <p className="text-center text-xs text-dark opacity-70 mb-2">
        Wpisz nowe hasło do swojego konta w Wirtualnym Biurze. Link z wiadomości
        działa tylko raz.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <PasswordInput
            label="Nowe hasło"
            placeholder="Wpisz nowe hasło..."
            {...register('newPassword', {
              required: 'Hasło jest wymagane',
              minLength: { value: 8, message: 'Hasło musi mieć min. 8 znaków' },
              validate: (value) => {
                return (
                  passwordRules.every((rule) => rule.test(value)) ||
                  'Hasło nie spełnia wymagań'
                );
              },
              deps: ['confirmPassword'],
            })}
          />
          <div className="min-h-4 mt-0.5">
            <p
              className={`text-red-500 text-xs transition duration-200 ease-out ${
                errors.newPassword
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-0.5'
              }`}
            >
              {errors.newPassword?.message}
            </p>
          </div>

          <div className="mt-1.5 space-y-1">
            {passwordRules.map((rule) => {
              const met = rule.test(newPasswordValue);
              return (
                <div key={rule.label} className="flex items-center gap-2">
                  <span className="relative inline-flex w-4 h-4 shrink-0">
                    <GoCircle
                      className={`absolute inset-0 w-4 h-4 text-gray-300 transition-opacity duration-200 ease-out ${
                        met ? 'opacity-0' : 'opacity-100'
                      }`}
                    />
                    <IoCheckmarkCircle
                      className={`absolute inset-0 w-4 h-4 text-darkGreen transition-opacity duration-200 ease-out ${
                        met ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </span>
                  <span
                    className={`text-xs transition-colors duration-200 ease-out ${
                      met ? 'text-darkGreen' : 'text-gray-400'
                    }`}
                  >
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <PasswordInput
            label="Powtórz nowe hasło"
            placeholder="Wpisz hasło ponownie"
            {...register('confirmPassword', {
              required: 'Powtórz hasło',
              validate: (value, formValues) =>
                value === formValues.newPassword || 'Hasła nie są takie same',
            })}
          />
          <div className="min-h-4 mt-0.5">
            <p
              className={`text-red-500 text-xs transition duration-200 ease-out ${
                errors.confirmPassword
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-0.5'
              }`}
            >
              {errors.confirmPassword?.message}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="small"
            className="px-3 py-2.5"
            isPending={newPasswordMutation.isPending}
          >
            {newPasswordMutation.isPending
              ? 'Ustawianie hasła...'
              : 'Zapisz nowe hasło'}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-dark mt-3 mb-1">
        Pamiętasz hasło?{' '}
        <Link
          to="/login"
          className="font-semibold text-darkGreen transition-all duration-300 hover:text-darkGreenHover hover:underline"
        >
          Wróć do logowania
        </Link>
      </p>
    </>
  );
}
