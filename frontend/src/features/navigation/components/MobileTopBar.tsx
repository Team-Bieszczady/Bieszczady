import NotificationBell from '../../notifications/components/NotificationBell';

export default function MobileTopBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-end border-b border-gray-200 bg-white px-5 lg:hidden">
      <NotificationBell />
    </div>
  );
}
