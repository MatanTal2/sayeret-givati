export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900" dir="ltr">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-left">
            🔧 System Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-left">
            Sayeret Givati Equipment Management System
          </p>
        </div>
        {children}
      </div>
    </div>
  );
} 