'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { useAuthStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowRight,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import type { Company } from '@/types';

interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
  totalLeads: number;
  syncIssues: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'company_created' | 'user_added' | 'sync_error' | 'api_updated';
  description: string;
  timestamp: string;
  companyName?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    totalUsers: 0,
    totalLeads: 0,
    syncIssues: 0,
    recentActivity: [],
  });
  const [companies, setCompanies] = useState<Company[]>([]);

  // Check authentication - only master_admin can access
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'master_admin') {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch companies
      const companiesResponse = await fetch('/api/companies');
      const companiesData = await companiesResponse.json();

      if (companiesResponse.ok) {
        const fetchedCompanies = companiesData.companies || [];
        setCompanies(fetchedCompanies);

        // Calculate stats
        const activeCount = fetchedCompanies.filter((c: Company) => c.isActive).length;
        const inactiveCount = fetchedCompanies.length - activeCount;

        // Mock data for other stats (will be replaced with real API calls)
        setStats({
          totalCompanies: fetchedCompanies.length,
          activeCompanies: activeCount,
          inactiveCompanies: inactiveCount,
          totalUsers: fetchedCompanies.length * 5, // Mock: ~5 users per company
          totalLeads: fetchedCompanies.length * 150, // Mock: ~150 leads per company
          syncIssues: 0,
          recentActivity: generateMockActivity(fetchedCompanies),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivity = (companies: Company[]): ActivityItem[] => {
    // Generate some mock recent activity
    const activities: ActivityItem[] = [];

    companies.slice(0, 3).forEach((company, index) => {
      activities.push({
        id: `activity-${index}`,
        type: 'company_created',
        description: `Company "${company.name}" was created`,
        timestamp: new Date(company.createdAt).toISOString(),
        companyName: company.name,
      });
    });

    return activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'company_created':
        return <Building2 className="h-4 w-4" />;
      case 'user_added':
        return <Users className="h-4 w-4" />;
      case 'sync_error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'api_updated':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-pulse text-[#C41E3A] mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and key metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Companies */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.activeCompanies} Active
                    </Badge>
                    {stats.inactiveCompanies > 0 && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        {stats.inactiveCompanies} Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <Building2 className="h-10 w-10 text-[#C41E3A]" />
              </div>
            </CardContent>
          </Card>

          {/* Total Users */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-500 mt-2">Across all companies</p>
                </div>
                <Users className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Total Leads */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLeads}</p>
                  <p className="text-sm text-gray-500 mt-2">System-wide</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {stats.syncIssues === 0 ? (
                    <>
                      <p className="text-3xl font-bold text-green-600">Healthy</p>
                      <p className="text-sm text-gray-500 mt-2">All systems operational</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-amber-600">{stats.syncIssues}</p>
                      <p className="text-sm text-gray-500 mt-2">Issues detected</p>
                    </>
                  )}
                </div>
                {stats.syncIssues === 0 ? (
                  <CheckCircle className="h-10 w-10 text-green-600" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-amber-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link href="/admin/companies">
                <Button className="w-full bg-[#C41E3A] hover:bg-[#A01829]" size="lg">
                  <Building2 className="mr-2 h-5 w-5" />
                  Manage Companies
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button className="w-full" variant="outline" size="lg">
                  <Users className="mr-2 h-5 w-5" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button className="w-full" variant="outline" size="lg">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Analytics
                </Button>
              </Link>
              <Link href="/admin/activity">
                <Button className="w-full" variant="outline" size="lg">
                  <Activity className="mr-2 h-5 w-5" />
                  Activity Logs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Link href="/admin/activity">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-2 rounded-full bg-white border border-gray-200">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Companies Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Companies</CardTitle>
                <Link href="/admin/companies">
                  <Button variant="ghost" size="sm">
                    Manage All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Active roofing companies</CardDescription>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No companies yet</p>
                  <Link href="/admin/companies">
                    <Button className="mt-4 bg-[#C41E3A] hover:bg-[#A01829]">
                      Add First Company
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.slice(0, 5).map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-full bg-[#C41E3A]/10">
                          <Building2 className="h-4 w-4 text-[#C41E3A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {company.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {company.city}, {company.state}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={
                          company.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {company.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                  {companies.length > 5 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      And {companies.length - 5} more companies
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
