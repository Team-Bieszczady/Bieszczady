import { useNavigate } from 'react-router';
import logo from '../assets/logo_bieszczadzki_ul.jpg';
import { Button } from '../components/ui/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#eeeeee] flex items-center justify-center px-6 py-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg px-6 py-10 max-sm:px-4 max-sm:py-8">
        <div className="flex justify-center mb-8">
          <img
            src={logo}
            alt="Bieszczadzki UL"
            className="h-24 500:h-28 700:h-32 w-24 500:w-28 700:w-32"
          />
        </div>

        <div className="text-center space-y-6">
          <h1 className="text-5xl 500:text-6xl 700:text-7xl font-bold text-darkGreen">
            404
          </h1>

          <h2 className="text-lg 500:text-xl font-semibold text-dark">
            Ups, coś poszło nie tak
          </h2>

          <p className="text-sm 500:text-base text-gray-500">
            Nie znaleźliśmy strony, której szukasz.
          </p>

          <Button
            onClick={() => navigate(-1)}
            variant="primary"
            size="medium"
          >
            Cofnij
          </Button>
        </div>
      </div>
    </div>
  );
}
