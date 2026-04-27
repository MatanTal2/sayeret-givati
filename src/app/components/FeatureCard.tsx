import Link from 'next/link';
import { cn } from '@/lib/cn';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  available: boolean;
  color: string;
}

export default function FeatureCard({ title, description, icon, href, available, color }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'relative block p-5 rounded-2xl shadow-soft hover:shadow-medium text-white',
        'transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        color
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl shrink-0" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold truncate">{title}</h3>
          <p className="text-xs opacity-90 mt-0.5 line-clamp-2">{description}</p>
        </div>
      </div>
      {!available && (
        <span className="absolute top-2 start-2 bg-neutral-900/60 text-white text-[10px] px-2 py-0.5 rounded-full">
          בקרוב
        </span>
      )}
    </Link>
  );
}
