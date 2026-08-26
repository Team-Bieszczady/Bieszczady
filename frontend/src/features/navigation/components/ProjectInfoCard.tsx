interface ProjectInfoCardProps {
  name: string;
  status: string;
}

export default function ProjectInfoCard({ name, status }: ProjectInfoCardProps) {
  return (
    <div className="mx-4 mb-4 p-3 border border-gray rounded-lg">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase text-gray mb-1">
          Wybrany projekt
        </p>
        <p className="font-bold text-dark text-sm">{name}</p>
      </div>
      <div className="inline-block px-2 py-0.5 rounded bg-lightGreen">
        <p className="text-xs font-semibold uppercase text-darkGreen">
          {status}
        </p>
      </div>
    </div>
  );
}
