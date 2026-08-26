import { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { slide as Slide } from 'react-burger-menu';
import Logo from './Logo';
import SectionLabel from './SectionLabel';
import OrgNavList from './OrgNavList';
import UserFooter from './UserFooter';
import { ORG_NAV_ITEMS, MOCK_USER } from '../data';

export default function MobileNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const customBurgerIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const customCrossIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const burgerStyles = {
    bmBurgerButton: {
      position: 'fixed' as const,
      width: '24px',
      height: '24px',
      left: '20px',
      top: '20px',
      zIndex: 40,
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
        onStateChange={(state: { isOpen: boolean }) => setIsMenuOpen(state.isOpen)}
        styles={burgerStyles}
        customBurgerIcon={customBurgerIcon}
        customCrossIcon={customCrossIcon}
        right={false}
        width={250}
      >
        <div className="w-full h-full">
          <div className="flex flex-col h-full">
            <Logo />
            <SectionLabel label="Organizacja" />
            <OrgNavList
              items={ORG_NAV_ITEMS}
              onNavigate={() => setIsMenuOpen(false)}
            />
            <div className="mt-auto">
              <UserFooter
                initials={MOCK_USER.initials}
                name={MOCK_USER.name}
                className="mx-4"
              />
            </div>
          </div>
        </div>
      </Slide>
    </div>
  );
}
