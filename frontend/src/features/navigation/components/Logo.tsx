import logoSrc from '../../../assets/logo_bieszczadzki_ul.jpg';

export default function Logo() {
  return (
    <div className="h-16 lg:h-20 flex items-center justify-center px-4 mb-6 lg:mb-4">
      <img src={logoSrc} alt="Logo" className="h-22  object-contain" />
    </div>
  );
}
