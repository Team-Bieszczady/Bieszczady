interface ProjectInfoCardProps {
  name: string;
  status: string;
  description: string;
  stage: string;
}

export default function ProjectInfoCard({ name, status, description, stage }: ProjectInfoCardProps) {
  return (
    <div className="mx-4 my-3 p-3 border border-gray-200 rounded-lg bg-white">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
        Wybrany projekt
      </p>
      <h3 className="text-sm font-bold text-dark leading-snug mb-1.5">
        {name}
      </h3>
      <p
        className="text-[11px] text-gray-400 leading-snug mb-2.5 line-clamp-2"
        title={description}
      >
        {description}
      </p>
      <div className="flex items-center gap-2">
        <span className="bg-lightGreen text-darkGreen rounded-full text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5">
          {status}
        </span>
        <span className="text-[10px] text-gray-500">{stage}</span>
      </div>
    </div>
  );
}
