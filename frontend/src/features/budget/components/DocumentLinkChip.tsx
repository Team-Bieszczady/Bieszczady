import { Link } from 'react-router';
import { FiFileText, FiFolder } from 'react-icons/fi';
import type { DocumentLink } from '../types';

interface DocumentLinkChipProps {
  link: DocumentLink;
  folderPaths: Map<string, string> | null;
  label?: string;
}

export function DocumentLinkChip({
  link,
  folderPaths,
  label,
}: DocumentLinkChipProps) {
  const path = folderPaths?.get(link.folderId);
  const Icon = link.kind === 'FILE' ? FiFileText : FiFolder;
  const name =
    label ??
    (link.kind === 'FILE'
      ? link.name
      : (path?.split(' / ').at(-1) ?? 'Folder w Dokumentach'));
  const caption =
    folderPaths === null ? null : (path ?? 'Brak dostępu do folderu');

  const content = (
    <>
      <Icon
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-darkGreen"
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className="block font-semibold whitespace-nowrap text-darkGreen group-hover/doc:underline">
          {name}
        </span>
        {caption && (
          <span className="block max-w-56 truncate text-[11px] text-mutedText">
            {caption}
          </span>
        )}
      </span>
    </>
  );

  if (!path) {
    return <span className="flex items-start gap-1.5">{content}</span>;
  }

  return (
    <Link
      to={
        link.kind === 'FILE'
          ? `/project/documents?folder=${link.folderId}&doc=${link.documentId}`
          : `/project/documents?folder=${link.folderId}`
      }
      className="group/doc flex items-start gap-1.5 rounded-md focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none"
    >
      {content}
    </Link>
  );
}
