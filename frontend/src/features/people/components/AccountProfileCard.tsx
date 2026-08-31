import type { ReactNode } from 'react';
import { TfiEmail, TfiMobile } from 'react-icons/tfi';
import { StatusPill } from '../../../components/ui/StatusPill';
import type { PersonStatus } from '../data';
import {
  formatAbsoluteDateTime,
  formatDate,
  formatLastLogin,
} from '../utils/formatDateTime';

interface AccountProfileCardProps {
  email: string;
  phone: string;
  projects: Array<{ id: string; name: string; role: string }>;
  tasksCount: number;
  lastLoginAt: string | null;
  createdAt: string;
  status: PersonStatus;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="p-3 lg:py-4 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[180px_minmax(0,1fr)]">
      <dt className="text-xs text-gray-500 sm:py-1 sm:text-sm">{label}</dt>
      {children}
    </div>
  );
}

export default function AccountProfileCard({
  email,
  phone,
  projects,
  tasksCount,
  lastLoginAt,
  createdAt,
  status,
}: AccountProfileCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-200">
      <Section title="Kontakt">
        <dl className="space-y-2 sm:space-y-1">
          <Row label="E-mail">
            <dd className="flex min-w-0 items-center gap-2 text-sm text-dark sm:py-1">
              <TfiEmail
                className="h-4 w-4 shrink-0 text-gray-400"
                aria-hidden="true"
              />
              <span className="truncate">{email}</span>
            </dd>
          </Row>
          <Row label="Telefon">
            <dd className="flex min-w-0 items-center gap-2 text-sm text-dark sm:py-1">
              <TfiMobile
                className="h-4 w-4 shrink-0 text-gray-400"
                aria-hidden="true"
              />
              <span className="truncate">{phone || '—'}</span>
            </dd>
          </Row>
        </dl>
      </Section>

      <Section title="Projekty">
        {projects.length === 0 ? (
          <p className="text-sm text-gray-400">Brak przypisanych projektów</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-200 rounded-lg px-2.5 py-2 flex items-center justify-between gap-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-darkGreen shrink-0" />
                  <span className="truncate text-sm text-dark">
                    {project.name}
                  </span>
                </div>
                <span className="bg-lightGreen text-darkGreen rounded-full text-xs font-medium px-3 py-1 shrink-0 whitespace-nowrap">
                  {project.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Aktywność">
        <dl className="space-y-2 sm:space-y-1">
          <Row label="Zadania">
            <dd className="min-w-0 text-sm text-dark sm:py-1">
              {tasksCount} zadań
            </dd>
          </Row>
          <Row label="Ostatnie logowanie">
            <dd
              className="min-w-0 wrap-words text-sm text-dark sm:py-1"
              title={formatAbsoluteDateTime(lastLoginAt)}
            >
              {formatLastLogin(lastLoginAt)}
            </dd>
          </Row>
          <Row label="Konto utworzone">
            <dd
              className="min-w-0 wrap-words text-sm text-dark sm:py-1"
              title={formatAbsoluteDateTime(createdAt)}
            >
              {formatDate(createdAt)}
            </dd>
          </Row>
        </dl>
      </Section>

      <Section title="Konto">
        <dl>
          <Row label="Status">
            <dd className="min-w-0 sm:py-0.5">
              <StatusPill status={status} size="md" />
            </dd>
          </Row>
        </dl>
      </Section>
    </div>
  );
}
