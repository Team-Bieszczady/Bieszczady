import type { ReactNode } from 'react';

interface OverviewSectionProps {
  number: number;
  title: string;
  titleAside?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export default function OverviewSection({
  number,
  title,
  titleAside,
  actions,
  children,
}: OverviewSectionProps) {
  return (
    <section className="mt-8 800:mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 800:gap-3">
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-dark 800:text-base">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-lightGreen text-xs font-semibold text-darkGreen 800:h-5 800:w-4.5 800:rounded">
              {number}
            </span>
            {title}
          </h2>
          {titleAside}
        </div>
        {actions && (
          <div className="flex items-center gap-2 800:gap-3">{actions}</div>
        )}
      </div>
      {children}
    </section>
  );
}
