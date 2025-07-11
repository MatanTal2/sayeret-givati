import Image from 'next/image';
// import Link from 'next/link';
import FeatureCard from './components/FeatureCard';

export default function HomePage() {
  const features = [
    {
      title: "ניהול שבצ\"ק",
      description: "מעקב וניהול סטטוס חיילים",
      icon: "✓",
      href: "/status",
      available: true,
      color: "bg-purple-600"
    },
    {
      title: "לוגיסטיקה",
      description: "ניהול ציוד ואספקה",
      icon: "📦",
      href: "/logistics",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "צלם",
      description: "ניהול תיעוד וצילומים",
      icon: "📸",
      href: "/photographer", 
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "שיירות",
      description: "תכנון וניהול שיירות",
      icon: "🚗",
      href: "/convoys",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "הגדרות",
      description: "הגדרות מערכת וצוותים",
      icon: "⚙️",
      href: "/admin",
      available: false,
      color: "bg-gray-400"
    },
    {
      title: "עזרה",
      description: "מדריך למשתמש ותמיכה",
      icon: "❓",
      href: "/help",
      available: false,
      color: "bg-gray-400"
    }
  ];

    return (
    <div className="min-h-screen bg-gray-50 relative" dir="rtl">
      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <Image 
          src="/sayeret-givati-logo.png" 
          alt="לוגו סיירת גבעתי" 
          width={400} 
          height={400}
          className="max-w-lg"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-12">
          <div className="flex justify-center mb-6">
            <Image 
              src="/sayeret-givati-logo.png" 
              alt="לוגו סיירת גבעתי" 
              width={120} 
              height={120}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            מסייעת סיירת גבעתי
          </h1>
          <h2 className="text-2xl md:text-3xl font-medium text-purple-600">
            פלגה ד
          </h2>
      </header>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
                    </div>
                  </div>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-600">
          <p className="text-sm">
            מערכת ניהול מסייעת • גרסה 0.2.0-alpha
          </p>
        </footer>
      </div>
    </div>
  );
}
