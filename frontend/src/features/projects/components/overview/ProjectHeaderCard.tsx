import { useState } from 'react';
import { HiOutlinePencil } from 'react-icons/hi';
import { ActionMenu } from '../../../../components/ui/ActionMenu';
import { ChipSelectField } from '../../../../components/ui/ChipSelectField';
import type { BackendProject } from '../../../../lib/projectsApi';
import { useProjectOverviewEditing } from '../../hooks/useProjectOverviewEditing';
import ArchivedBadge from '../ArchivedBadge';
import StatusSelect from './StatusSelect';
import ManageStatusesModal from './ManageStatusesModal';
import {
  TitleDescriptionForm,
  type TitleDescriptionValues,
} from '../../../../components/ui/TitleDescriptionForm';

interface ProjectHeaderCardProps {
  project: BackendProject;
  canEdit: boolean;
}

export default function ProjectHeaderCard({
  project,
  canEdit,
}: ProjectHeaderCardProps) {
  const editing = useProjectOverviewEditing(project);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const saveHeader = async (values: TitleDescriptionValues) => {
    const saved = await editing.updateHeader({
      name: values.title,
      description: values.description,
    });
    if (saved) setIsEditingHeader(false);
    return saved;
  };

  return (
    <div className="animate-fade-in rounded-xl border border-gray-200 bg-white px-4 py-5 800:px-6">
      <div className="800:grid 800:grid-cols-[1fr_auto] 800:items-start 800:gap-4">
        <p className="text-[11px] font-semibold tracking-[0.5px] text-mutedText 800:hidden">
          PROJEKT
        </p>

        {isEditingHeader ? (
          <div className="mt-1 800:col-start-1 800:row-start-1 800:mt-0 800:max-w-2xl">
            <TitleDescriptionForm
              title={editing.name}
              description={editing.description}
              titleLabel="Nazwa projektu"
              descriptionLabel="Opis"
              titleEmptyMessage="Nazwa projektu nie może być pusta"
              descriptionEmptyMessage="Opis nie może być pusty"
              titleInputClassName="text-sm font-bold text-dark 800:text-xl lg:text-2xl"
              onSave={saveHeader}
              onCancel={() => setIsEditingHeader(false)}
            />
          </div>
        ) : (
          <>
            <h1 className="mt-1 text-sm leading-tight font-bold text-dark 800:col-start-1 800:mt-0 800:max-w-2xl 800:text-xl lg:text-2xl">
              {editing.name}
            </h1>
            <p className="mt-3 text-xs leading-relaxed text-grayText 800:col-start-1 800:mt-1.5 800:max-w-2xl">
              {editing.description}
            </p>
          </>
        )}

        <div className="mt-3 flex items-center gap-1 800:col-start-2 800:row-start-1 800:mt-0 800:shrink-0">
          {project.archivedAt !== null && <ArchivedBadge />}

          <StatusSelect
            status={editing.status}
            statuses={editing.statuses}
            canEdit={canEdit}
            onSelect={editing.setStatus}
            onCreateStatus={editing.createStatus}
            onManage={() => setIsManageOpen(true)}
          />

          {canEdit && (
            <ActionMenu
              ariaLabel="Akcje projektu"
              items={[
                {
                  id: 'edit',
                  label: 'Edytuj nazwę i opis',
                  icon: (
                    <HiOutlinePencil
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  ),
                  onSelect: () => setIsEditingHeader(true),
                },
              ]}
            />
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <ChipSelectField
          label="TYP"
          values={editing.typeDictionary.values}
          options={editing.typeDictionary.options}
          onAdd={editing.typeDictionary.add}
          onCreate={editing.typeDictionary.create}
          onRemove={editing.typeDictionary.remove}
          canEdit={canEdit}
          searchPlaceholder="Szukaj typu..."
        />
        <ChipSelectField
          label="ODBIORCA"
          values={editing.audienceDictionary.values}
          options={editing.audienceDictionary.options}
          onAdd={editing.audienceDictionary.add}
          onCreate={editing.audienceDictionary.create}
          onRemove={editing.audienceDictionary.remove}
          canEdit={canEdit}
          searchPlaceholder="Szukaj odbiorcy..."
        />
      </div>

      <ManageStatusesModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        statuses={editing.statuses}
        onRename={editing.renameStatus}
        onRecolor={editing.recolorStatus}
        onDelete={editing.deleteStatus}
      />
    </div>
  );
}
