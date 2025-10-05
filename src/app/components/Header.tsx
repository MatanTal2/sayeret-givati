import Image from 'next/image';
import Link from 'next/link';
import AuthButton from './AuthButton';
import HamburgerMenu from '@/components/ui/HamburgerMenu';
import { getMenuItems } from '@/utils/navigationUtils';

interface HeaderProps {
  title: string;
  subtitle: string;
  backLink?: string;
  backText?: string;
  showAuth?: boolean; // New prop to control auth button display
}

export default function Header({ 
  title, 
  subtitle, 
  backLink = "/", 
  backText = "← חזרה לעמוד הבית",
  showAuth = true // Default to showing auth button
}: HeaderProps) {
  const menuItems = getMenuItems();
  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 mb-6">
      <div className="max-w-6xl mx-auto px-4 py-4">
        
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Mobile: Top row with Auth button and Hamburger menu */}
          <div className="flex justify-between items-center mb-4">
            {showAuth && <AuthButton />}
            <HamburgerMenu 
              menuItems={menuItems}
            />
          </div>
          
          {/* Mobile: Logo */}
          <div className="flex justify-center mb-4">
            <Link href={backLink} className="hover:opacity-80 transition-opacity">
              <Image 
                src="/sayeret-givati-logo.png" 
                alt="לוגו סיירת גבעתי" 
                width={80} 
                height={80}
                priority
                className="h-16 w-auto"
              />
            </Link>
          </div>
          
          {/* Mobile: Headline */}
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-primary-600">
              {title}
            </h1>
          </div>
          
          {/* Mobile: Subtitle */}
          <div className="text-center mb-4">
            <p className="text-base text-neutral-700 font-medium">{subtitle}</p>
          </div>
          
          {/* Mobile: Back link (if no auth) */}
          {!showAuth && (
            <div className="flex justify-center">
              <Link 
                href={backLink}
                className="px-4 py-2 text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                {backText}
              </Link>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          {/* Desktop: Hamburger menu, Logo, and Auth button row */}
          <div className="flex items-start justify-between mb-4">
            {/* Desktop: Hamburger menu on left */}
            <HamburgerMenu 
              menuItems={menuItems}
            />
            
            {/* Desktop: Logo in center */}
            <Link href={backLink} className="hover:opacity-80 transition-opacity">
              <Image 
                src="/sayeret-givati-logo.png" 
                alt="לוגו סיירת גבעתי" 
                width={80} 
                height={80}
                priority
                className="h-16 w-auto"
              />
            </Link>
            
            {/* Desktop: Auth button on right */}
            <div className="flex items-center">
              {showAuth && <AuthButton />}
              {!showAuth && (
                <Link 
                  href={backLink}
                  className="px-4 py-2 text-primary-600 hover:text-primary-800 font-medium transition-colors"
                >
                  <span className="hidden md:inline">{backText}</span>
                </Link>
              )}
            </div>
          </div>
          
          {/* Desktop: Headline only (no subtitle) */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary-600">
              {title}
            </h1>
          </div>
        </div>
        
      </div>

    </header>
  );
} 