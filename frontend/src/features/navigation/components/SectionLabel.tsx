interface SectionLabelProps {
  label: string;
}

export default function SectionLabel({ label }: SectionLabelProps) {
  return (
    <p className="text-xs  uppercase tracking-wide text-gray-400 px-4 mb-3 mt-1 lg:mb-2 lg:mt-0">
      {label}
    </p>
  );
}
