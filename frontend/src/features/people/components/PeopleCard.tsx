import { useNavigate } from 'react-router';
import type { Person } from '../data';
import ProjectChips from './ProjectChips';
import PersonRowActions from './PersonRowActions';
import { Avatar } from '../../../components/ui/Avatar';
import { StatusPill } from '../../../components/ui/StatusPill';

interface PeopleCardProps {
  person: Person;
}

export default function PeopleCard({ person }: PeopleCardProps) {
  const navigate = useNavigate();
  const isDeleted = person.status === 'DELETED';

  const handleCardClick = () => {
    if (isDeleted) return;
    navigate(`/people/${person.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`border border-gray-200 rounded-lg bg-white p-4 transition-colors ${
        isDeleted ? 'opacity-60' : 'cursor-pointer hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar initials={person.initials} src={person.avatar} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-dark">
              {person.firstName} {person.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{person.email}</p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <PersonRowActions person={person} />
        </div>
      </div>

      <div className="border-t border-gray-200 mb-3" />

      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2">
          <div>
            <p className="text-gray-500">Rola</p>
            <p className="text-dark font-medium">{person.role}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Status</p>
            <StatusPill status={person.status} size="sm" />
          </div>
        </div>

        <div>
          <p className="text-gray-500">Projekt</p>
          <ProjectChips projects={person.projects} chipClassName="rounded" />
        </div>

        <div>
          <p className="text-gray-500">Zadania</p>
          <p className="text-dark">{person.tasksCount} zadań</p>
        </div>
      </div>
    </div>
  );
}
