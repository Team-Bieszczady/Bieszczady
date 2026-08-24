import { IoCheckmarkCircle } from 'react-icons/io5';
import { Button } from '../../../components/ui/Button';
import { PasswordInput } from '../../../components/ui/PasswordInput';

const passwordRules = [
  'Co najmniej 8 znaków',
  'Wielka i mała litera',
  'Co najmniej jedna cyfra',
];

export default function SetPasswordPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // TODO(auth): connect to backend, validate and set password
  };

  return (
    <>
      <h1 className="text-center text-dark font-semibold text-base mb-4  500:text-lg">
        Ustaw swoje hasło
      </h1>

      <p className="text-center text-xs text-dark opacity-70 mb-3">
        To Twoje pierwsze logowanie w Wirtualnym Biurze. Hasła od administratora
        użyjesz tylko ten jeden raz.
      </p>

      <div className="mb-4 flex justify-center">
        <span className="bg-gray-100 px-3 py-2 rounded-full text-xs font-medium text-dark/50">
          anna.wisniowska@gmail.com
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="lg:mb-6 xl:mb-8">
          <PasswordInput
            label="Nowe hasło"
            placeholder="Wpisz nowe hasło..."
            name="newPassword"
          />

          <div className="mt-2 space-y-1.5">
            {passwordRules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <IoCheckmarkCircle className="text-darkGreen w-4 h-4 shrink-0" />
                <span className="text-xs text-dark">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        <PasswordInput
          label="Powtórz nowe hasło"
          placeholder="Wpisz hasło ponownie"
          name="confirmPassword"
        />

        <div className="flex justify-center">
          <Button
            type="submit"
            variant="primary"
            size="small"
            className="px-3 py-2.5"
          >
            Ustaw hasło i zaloguj się
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-dark mt-4 mb-2">
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
