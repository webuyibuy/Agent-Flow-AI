import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">AgentFlow</h1>
        <p className="text-gray-600 text-center mb-8">AI-powered agent management platform</p>
        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors block text-center"
          >
            View Dashboard (Demo)
          </Link>
        </div>
      </div>
    </div>
  )
}
