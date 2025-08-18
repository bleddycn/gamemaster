import Layout from "@/components/Layout";
import { Card, CardHeader } from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";

export default function Home() {
  return (
    <Layout title="Dashboard" subtitle="Welcome to GameMaster">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Welcome Card */}
        <div className="md:col-span-2 lg:col-span-3">
          <Card>
            <div className="p-8 text-center">
              <Logo size="lg" className="justify-center mb-6" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to GameMaster
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The ultimate sports competition platform for multi-club tournaments, 
                Last Man Standing competitions, and more. Manage your clubs, create competitions, 
                and engage your community with ease.
              </p>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader title="Quick Stats" subtitle="Platform overview" />
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Clubs</span>
                <span className="font-semibold text-lg">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Live Competitions</span>
                <span className="font-semibold text-lg">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Players</span>
                <span className="font-semibold text-lg">3</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader title="Quick Actions" subtitle="Get started" />
          <div className="p-6">
            <div className="space-y-3">
              <a 
                href="/clubs" 
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-gray-900">View Clubs</div>
                <div className="text-xs text-gray-500">Browse all clubs</div>
              </a>
              <a 
                href="/admin/templates" 
                className="block w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-gray-900">Templates</div>
                <div className="text-xs text-gray-500">Manage game templates</div>
              </a>
              <a 
                href="/auth/sign-in" 
                className="block w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <div className="font-medium text-indigo-900">Sign In</div>
                <div className="text-xs text-indigo-600">Access your account</div>
              </a>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest updates" />
          <div className="p-6">
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm">No recent activity</p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
