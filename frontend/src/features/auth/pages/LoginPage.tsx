import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { GoMail } from 'react-icons/go';
import { Button } from '../../../components/ui/Button';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Spinner } from '../../../components/ui/Spinner';
import { isApiError } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useLogin } from '../hooks/useLogin';
import { useStickyErrorMessage } from '../hooks/useStickyErrorMessage';

interface LoginFormInputs {
  email: string;
  password: string;
}

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    mode: 'onChange',
  });
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const emailErrorMsg = useStickyErrorMessage(errors.email?.message);
  const passwordErrorMsg = useStickyErrorMessage(errors.password?.message);

  const onSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: (response) => {
          setSession(response.accessToken, response.user);
          toast.success('Zalogowano pomyślnie');
          navigate(
            response.user.mustChangePassword ? '/set-password' : '/profile',
            response.user.mustChangePassword
              ? { state: { tempPassword: data.password } }
              : undefined,
          );
        },
        onError: (error) => {
          if (isApiError(error) && error.status === 401) {
            toast.error('Nieprawidłowy e-mail lub hasło');
          } else {
            toast.error('Coś poszło nie tak. Spróbuj ponownie.');
          }
        },
      },
    );
  };

  return (
    <>
      <h1 className="text-center text-dark font-semibold text-base mb-8 500:text-lg">
        Witaj z powrotem
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div>
          <label className="block text-dark font-semibold text-xs mb-2">
            E-mail
          </label>
          <div className="group relative">
            <GoMail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark opacity-40 group-focus-within:text-darkGreen group-focus-within:opacity-100 transition-all w-4 h-4" />
            <input
              type="email"
              placeholder="Podaj e-mail..."
              className="text-xs w-full h-10 pl-10 pr-4 bg-white border border-lightGreen transition-all hover:border-darkGreen/60 rounded-lg text-dark placeholder-dark placeholder-opacity-30 focus:outline-none focus:ring-1 focus:ring-darkGreen/60 focus:border-transparent"
              {...register('email', {
                required: 'E-mail jest wymagany',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Podaj poprawny adres e-mail',
                },
              })}
            />
          </div>
          <div className="min-h-4 mt-0.5">
            <p
              className={`text-red-500 text-xs transition duration-200 ease-out ${
                errors.email ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-0.5'
              }`}
            >
              {emailErrorMsg}
            </p>
          </div>
        </div>

        <div>
          <PasswordInput
            label="Hasło"
            placeholder="Podaj hasło..."
            {...register('password', { required: 'Hasło jest wymagane' })}
          />
          <div className="min-h-4 mt-0.5">
            <p
              className={`text-red-500 text-xs transition duration-200 ease-out ${
                errors.password ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-0.5'
              }`}
            >
              {passwordErrorMsg}
            </p>
          </div>
        </div>

        <div className="text-right">
          <a
            href="#"
            className="text-darkGreen text-xs font-medium transition-all duration-300 hover:text-darkGreenHover hover:underline"
          >
            Nie pamiętasz hasła?
          </a>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="small"
            className="px-3 py-2.5"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner variant="light" size="16" />
              </span>
            ) : (
              'Zaloguj się'
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-dark mt-8">
        Nie masz konta?{' '}
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
