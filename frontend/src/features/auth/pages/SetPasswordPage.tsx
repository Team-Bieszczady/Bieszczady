import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { IoCheckmarkCircle } from 'react-icons/io5';
import { GoCircle } from 'react-icons/go';
import { Button } from '../../../components/ui/Button';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Spinner } from '../../../components/ui/Spinner';
import { isApiError } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useSetPassword } from '../hooks/useSetPassword';
import { useStickyErrorMessage } from '../hooks/useStickyErrorMessage';

interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  { label: 'Co najmniej 8 znaków', test: (v) => v.length >= 8 },
  { label: 'Wielka i mała litera', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'Co najmniej jedna cyfra', test: (v) => /\d/.test(v) },
  { label: 'Znak specjalny: @ $ ! % * ? &', test: (v) => /[@$!%*?&]/.test(v) },
];

interface SetPasswordFormInputs {
  newPassword: string;
  confirmPassword: string;
}

interface LocationState {
  tempPassword?: string;
}

export default function SetPasswordPage() {
  const { user, accessToken } = useAuth();
  const { state } = useLocation() as { state: LocationState | null };
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SetPasswordFormInputs>({
    mode: 'onChange',
  });
  const setPasswordMutation = useSetPassword({ accessToken: accessToken ?? '' });
  const newPasswordErrorMsg = useStickyErrorMessage(errors.newPassword?.message);
  const confirmPasswordErrorMsg = useStickyErrorMessage(errors.confirmPassword?.message);
  const newPasswordValue = watch('newPassword') ?? '';

  const onSubmit = (data: SetPasswordFormInputs) => {
    if (!accessToken || !state?.tempPassword) {
      toast.error('Musisz zalogować się, aby ustawić hasło');
      return;
    }

    setPasswordMutation.mutate(
      { currentPassword: state.tempPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success('Hasło zostało ustawione');
          navigate('/profile');
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 401) {
            toast.error('Nieprawidłowe hasło tymczasowe');
          } else {
            toast.error('Coś poszło nie tak. Spróbuj ponownie.');
          }
        },
      }
    );
  };

  return (
    <>
      <h1 className="text-center text-dark font-semibold text-base mb-3  500:text-lg">
        Ustaw swoje hasło
      </h1>

      <p className="text-center text-xs text-dark opacity-70 mb-2">
        To Twoje pierwsze logowanie w Wirtualnym Biurze. Hasła od administratora
        użyjesz tylko ten jeden raz.
      </p>

      <div className="mb-3 flex justify-center">
        <span className="bg-gray-100 px-3 py-2 rounded-full text-xs font-medium text-dark/50">
          {user?.email ?? 'Brak zalogowanego użytkownika'}
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <PasswordInput
            label="Nowe hasło"
            placeholder="Wpisz nowe hasło..."
            {...register('newPassword', {
              required: 'Hasło jest wymagane',
              minLength: { value: 8, message: 'Hasło musi mieć min. 8 znaków' },
            })}
          />
          <div className="min-h-4 mt-0.5">
            <p
              className={`text-red-500 text-xs transition duration-200 ease-out ${
                errors.newPassword ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-0.5'
              }`}
            >
              {newPasswordErrorMsg}
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
              validate: (value, formValues) => value === formValues.newPassword || 'Hasła nie są takie same',
            })}
          />
          <div className="min-h-4 mt-0.5">
            <p
              className={`text-red-500 text-xs transition duration-200 ease-out ${
                errors.confirmPassword ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-0.5'
              }`}
            >
              {confirmPasswordErrorMsg}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="small"
            className="px-3 py-2.5"
            disabled={setPasswordMutation.isPending}
          >
            {setPasswordMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner variant="light" size="16" />
                Ustawianie hasła...
              </span>
            ) : (
              'Ustaw hasło i zaloguj się'
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-dark mt-3 mb-1">
        Problem z logowaniem?{' '}
        <a
          href="#"
          className="font-semibold text-darkGreen transition-all duration-300 hover:text-darkGreenHover hover:underline"
        >
          Skontaktuj się z administratorem
        </a>
      </p>
    </>
  );
}
