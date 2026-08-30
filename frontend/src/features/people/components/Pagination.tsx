import { MdKeyboardArrowLeft } from 'react-icons/md';
import { MdKeyboardArrowRight } from 'react-icons/md';

const MAX_VISIBLE_PAGES = 5;
const ELLIPSIS = '...';

function getPageItems(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  let startPage = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
  const endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);

  if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
    startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push(ELLIPSIS);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(ELLIPSIS);
    }
    pages.push(totalPages);
  }

  return pages;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageItems(currentPage, totalPages);

  const arrowClass =
    'p-1 text-dark hover:text-darkGreen disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200';

  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={arrowClass}
        type="button"
        aria-label="Poprzednia strona"
      >
        <MdKeyboardArrowLeft className="h-5 w-5" />
      </button>

      {pages.map((page, idx) =>
        page === ELLIPSIS ? (
          <span
            key={`${page}-${idx}`}
            className="px-1 text-xs text-dark/50 select-none"
            aria-hidden="true"
          >
            {ELLIPSIS}
          </span>
        ) : (
          <button
            key={`${page}-${idx}`}
            onClick={() => onPageChange(page as number)}
            className={`text-xs bg-transparent border-0 p-0 cursor-pointer transition-colors duration-200 ${
              page === currentPage
                ? 'text-darkGreen font-semibold'
                : 'text-dark hover:text-darkGreen'
            }`}
            type="button"
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={arrowClass}
        type="button"
        aria-label="Następna strona"
      >
        <MdKeyboardArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
