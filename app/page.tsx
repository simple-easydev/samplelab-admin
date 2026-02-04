export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to SampleLab Admin
        </h1>
        <p className="text-gray-600 mb-8">
          Next.js 16 with Supabase Integration
        </p>
        <a
          href="/admin"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Admin Panel
        </a>
      </div>
    </div>
  );
}
