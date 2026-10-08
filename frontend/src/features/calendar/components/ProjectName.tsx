import { LuArrowUpRight } from 'react-icons/lu';

interface ProjectNameProps {
  name: string;
  onOpen?: () => void;
}

export function ProjectName({ name, onOpen }: ProjectNameProps) {
  if (!onOpen) {
    return <p className="font-medium text-darkGreen">{name}</p>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex cursor-pointer items-center gap-1 text-left font-medium text-darkGreen hover:text-darkGreenHover hover:underline"
    >
      {name}
      <LuArrowUpRight size={14} aria-hidden="true" />
    </button>
  );
}
