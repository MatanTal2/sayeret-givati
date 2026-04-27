interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-600">{title}</h1>
      {subtitle && (
        <p className="mt-1 text-sm sm:text-base text-neutral-600">{subtitle}</p>
      )}
    </div>
  );
}
