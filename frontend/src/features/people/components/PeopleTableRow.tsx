import { useNavigate } from 'react-router';
import type { Person } from '../data';
import ProjectChips from './ProjectChips';
import PersonRowActions from './PersonRowActions';
import { Avatar } from '../../../components/ui/Avatar';
import { StatusPill } from '../../../components/ui/StatusPill';

interface PeopleTableRowProps {
  person: Person;
}

export default function PeopleTableRow({ person }: PeopleTableRowProps) {
  const navigate = useNavigate();
  const isDeleted = person.status === 'DELETED';

  const handleRowClick = () => {
    if (isDeleted) return;
    navigate(`/people/${person.id}`);
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`border-b border-gray-200 transition-colors ${
        isDeleted ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'
      }`}
    >
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <Avatar initials={person.initials} src={person.avatar} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-dark">
              {person.firstName} {person.lastName}
            </p>
            <p className="text-xs text-gray-500">{person.email}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-xs text-gray-800">{person.role}</td>

      <td className="px-4 py-3">
        <ProjectChips projects={person.projects} />
      </td>

      <td className="px-4 py-3 text-xs text-gray-800">{person.tasksCount} zadań</td>

      <td className="px-4 py-3">
        <StatusPill status={person.status} size="md" />
      </td>

      <td
        className="px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <PersonRowActions person={person} />
        </div>
      </td>
    </tr>
  );
}
