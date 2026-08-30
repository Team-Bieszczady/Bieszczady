import type { ReactNode } from 'react';

export default function AccountPageShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-4 pt-20 lg:px-6 lg:pb-6 lg:pt-16">
      {children}
    </div>
  );
}
