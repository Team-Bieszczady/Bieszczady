import { GoMail } from 'react-icons/go';
import { Button } from '../../../components/ui/Button';
import { PasswordInput } from '../../../components/ui/PasswordInput';

export default function LoginPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // TODO(auth): connect to backend login API
  };

  return (
    <>
      <h1 className="text-center text-dark font-semibold text-base mb-8 500:text-lg">
        Witaj z powrotem
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>
        </div>

        <PasswordInput label="Hasło" placeholder="Podaj hasło..." />

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
          >
            Zaloguj się
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-dark mt-8">
        Nie masz konta?{' '}
        <a href="#" className="font-semibold text-darkGreen transition-all duration-300 hover:text-darkGreenHover hover:underline">
          Skontaktuj się z administratorem
        </a>
      </p>
    </>
  );
}
