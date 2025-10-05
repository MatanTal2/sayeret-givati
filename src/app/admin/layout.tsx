export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900" dir="ltr">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white text-left">
            🔧 System Admin Panel
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 text-left">
            Sayeret Givati Equipment Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
} 