import Link from 'next/link';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  available: boolean;
  color: string;
}

export default function FeatureCard({ 
  title, 
  description, 
  icon, 
  href, 
  available, 
  color 
}: FeatureCardProps) {
  const CardContent = () => (
    <div className={`
      relative p-8 rounded-2xl shadow-lg transition-all duration-300 h-48
      ${available 
        ? `${color} hover:shadow-xl hover:scale-105 cursor-pointer text-white` 
        : 'bg-gray-200 cursor-not-allowed text-gray-500'
      }
    `}>
      <div className="text-center">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
        {!available && (
          <span className="absolute top-4 left-4 bg-gray-400 text-white text-xs px-2 py-1 rounded-full">
            בקרוב
          </span>
        )}
      </div>
    </div>
  );

  if (available) {
    return (
      <Link href={href}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
} 