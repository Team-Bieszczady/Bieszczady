import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { useRequestPasswordReset } from '../hooks/useRequestPasswordReset';
import { GoMail } from 'react-icons/go';
import { Button } from '../../../components/ui/Button';
import { isApiError } from '../../../lib/api';
import toast from 'react-hot-toast';

interface FormInputs {
  email: string;
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    mode: 'onChange',
  });

  const passwordReset = useRequestPasswordReset();
  const onError = (error: Error) => {
    const options = { id: 'reset-error' };

    if (!isApiError(error) || error.status !== 429) {
      toast.error('Coś poszło nie tak. Spróbuj ponownie.', options);
      return;
    }

    toast.error(
      'Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.',
      options,
    );
  };
  const onSubmit = (data: FormInputs) => {
    passwordReset.mutate(data.email, {
      onSuccess: () => {
        setEmail(data.email);
        setSent(true);
      },
      onError,
    });
  };

  if (sent) {
    return (
      <>
        <h1 className="text-center text-dark font-semibold text-base mb-2 500:text-lg">
          Sprawdź skrzynkę e-mail
        </h1>

        <p className="text-center text-xs text-dark/60 mb-4">
          Jeśli konto o tym adresie istnieje, wysłaliśmy na nie link do
          ustawienia nowego hasła. Link jest ważny 60 minut.
        </p>

        <div className="flex justify-center mb-10">
          <span className="inline-block max-w-full break-all rounded-full bg-[#F4F6F8] px-6 py-1.5 text-xs text-dark/60">
            {email}
          </span>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="primary"
            size="small"
            className="w-full max-w-[250px] px-3 py-2.5"
            onClick={() => navigate('/login')}
          >
            Wróć do logowania
          </Button>
        </div>

        <p className="text-center text-sm text-dark/60 mt-8">
          Nie dostałeś wiadomości?{' '}
          <button
            type="button"
            className="cursor-pointer text-darkGreen transition-all duration-300 hover:text-darkGreenHover hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
            disabled={passwordReset.isPending}
            onClick={() =>
              passwordReset.mutate(email, {
                onSuccess: () => toast.success('Wysłaliśmy nowy link'),
                onError,
              })
            }
          >
            Wyślij link ponownie
          </button>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-center text-dark font-semibold text-base mb-8 500:text-lg">
        Nie pamiętasz hasła?
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
              className="text-xs w-full h-10 pl-10 pr-4 bg-white border border-gray-100 transition-all hover:border-darkGreen/60 rounded-lg text-dark placeholder-dark placeholder-opacity-30 focus:outline-none focus:ring-1 focus:ring-darkGreen/60 focus:border-transparent"
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
                errors.email
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-0.5'
              }`}
            >
              {errors.email?.message}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="small"
            className="px-3 py-2.5"
            isPending={passwordReset.isPending}
          >
            Wyślij link do hasła
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-dark mt-8">
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
