import type { ReactNode } from 'react';
import { HiOutlinePencil } from 'react-icons/hi';
import { FiTrash2 } from 'react-icons/fi';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import PartnerAgreement from './PartnerAgreement';
import PartnerStatusPill from './PartnerStatusPill';
import type { Partner } from '../data';

interface PartnerDetailsModalProps {
  partner: Partner | null;
  onClose: () => void;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-1.5 text-xs">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-dark min-w-0 break-words">{children || '—'}</dd>
    </div>
  );
}

const SECTION_TITLE_CLASSES =
  'text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2';

const LINK_CLASSES = 'text-darkGreen hover:underline';

export default function PartnerDetailsModal({
  partner,
  onClose,
  onEdit,
  onDelete,
}: PartnerDetailsModalProps) {
  if (!partner) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={partner.name}
      size="lg"
      header={
        <div className="flex items-center gap-3 min-w-0">
          <Avatar initials={partner.initials} size="md" />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-dark">{partner.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{partner.type}</span>
              <PartnerStatusPill status={partner.status} size="sm" />
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className={SECTION_TITLE_CLASSES}>Organizacja</h3>
          <dl>
            <DetailRow label="NIP">{partner.nip}</DetailRow>
            <DetailRow label="Miejscowość">{partner.city}</DetailRow>
            <DetailRow label="E-mail">
              {partner.email && (
                <a href={`mailto:${partner.email}`} className={LINK_CLASSES}>
                  {partner.email}
                </a>
              )}
            </DetailRow>
          </dl>
        </section>

        <div className="border-t border-gray-200" />

        <section>
          <h3 className={SECTION_TITLE_CLASSES}>Osoba kontaktowa</h3>
          <dl>
            <DetailRow label="Imię i nazwisko">{partner.contactName}</DetailRow>
            <DetailRow label="E-mail">
              {partner.contactEmail && (
                <a
                  href={`mailto:${partner.contactEmail}`}
                  className={LINK_CLASSES}
                >
                  {partner.contactEmail}
                </a>
              )}
            </DetailRow>
            <DetailRow label="Telefon">
              {partner.contactPhone && (
                <a
                  href={`tel:${partner.contactPhone.replace(/\s/g, '')}`}
                  className={LINK_CLASSES}
                >
                  {partner.contactPhone}
                </a>
              )}
            </DetailRow>
          </dl>
        </section>

        <div className="border-t border-gray-200" />

        <section>
          <h3 className={SECTION_TITLE_CLASSES}>
            Projekty ({partner.projects.length})
          </h3>
          {partner.projects.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {partner.projects.map((project) => (
                <li
                  key={project.id}
                  className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-md"
                >
                  {project.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">Brak przypisanych projektów</p>
          )}
        </section>

        <div className="border-t border-gray-200" />

        <section>
          <h3 className={SECTION_TITLE_CLASSES}>Umowa</h3>
          <PartnerAgreement partner={partner} />
        </section>

        <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={() => onDelete(partner)}
            className="flex items-center gap-2 text-darkRed!"
          >
            <FiTrash2 className="h-4 w-4" aria-hidden="true" />
            Usuń
          </Button>
          <Button
            variant="primary"
            size="small"
            type="button"
            onClick={() => onEdit(partner)}
            className="flex items-center gap-2"
          >
            <HiOutlinePencil className="h-4 w-4" aria-hidden="true" />
            Edytuj
          </Button>
        </div>
      </div>
    </Modal>
  );
}
