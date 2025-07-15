import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle: string;
  backLink?: string;
  backText?: string;
}

export default function Header({ 
  title, 
  subtitle, 
  backLink = "/", 
  backText = "← חזרה לעמוד הבית" 
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href={backLink} className="hover:opacity-80 transition-opacity">
            <Image 
              src="/sayeret-givati-logo.png" 
              alt="לוגו סיירת גבעתי" 
              width={80} 
              height={80}
              className="h-16 w-auto"
            />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {title}
            </h1>
            <p className="text-lg text-gray-700 font-medium">{subtitle}</p>
          </div>
          <div className="mr-auto">
            <Link 
              href={backLink}
              className="px-4 py-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              <span className="md:hidden">🏠 ←</span>
              <span className="hidden md:inline">{backText}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
} 