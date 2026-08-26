interface SectionLabelProps {
  label: string;
}

export default function SectionLabel({ label }: SectionLabelProps) {
  return (
    <p className="text-xs font-semibold uppercase text-gray px-4 mb-3 mt-1 lg:mb-2 lg:mt-0">
      {label}
    </p>
  );
}
