import { useState } from 'react';
import { slide as Slide } from 'react-burger-menu';
import { IoCloseOutline, IoMenuOutline } from 'react-icons/io5';
import SidebarContent from './SidebarContent';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

export default function MobileNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isTablet = useMediaQuery('(min-width: 640px)');
  const closeMenu = () => setIsMenuOpen(false);

  const customBurgerIcon = <IoMenuOutline size={24} />;

  const customCrossIcon = <IoCloseOutline size={24} />;

  const burgerStyles = {
    bmBurgerButton: {
      position: 'fixed' as const,
      width: '24px',
      height: '24px',
      left: '20px',
      top: '16px',
      zIndex: '40',
    },
    bmBurgerBars: {
      background: 'var(--color-dark)',
    },
    bmCrossButton: {
      height: '24px',
      width: '24px',
    },
    bmCross: {
      color: 'var(--color-dark)',
    },
    bmMenu: {
      background: 'var(--color-white)',
      padding: '0',
    },
    bmMorphShape: {
      fill: 'var(--color-white)',
    },
    bmItemList: {
      display: 'flex',
      flexDirection: 'column' as const,
      paddingTop: '32px',
      height: '100%',
    },
    bmItem: {
      display: 'block',
    },
    bmOverlay: {
      background: 'rgba(0, 0, 0, 0.3)',
    },
  };

  return (
    <div className="lg:hidden">
      <Slide
        isOpen={isMenuOpen}
        onStateChange={(state: { isOpen: boolean }) =>
          setIsMenuOpen(state.isOpen)
        }
        styles={burgerStyles}
        customBurgerIcon={customBurgerIcon}
        customCrossIcon={customCrossIcon}
        right={false}
        width={isTablet ? 300 : 250}
      >
        <div className="w-full h-full">
          <SidebarContent onNavigate={closeMenu} />
        </div>
      </Slide>
    </div>
  );
}
