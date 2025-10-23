'use client';

import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeadStore } from '@/store/useLeadStore';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Award,
} from 'lucide-react';

const SPARTAN_RED = '#C41E3A';
const CHART_COLORS = {
  primary: SPARTAN_RED,
  secondary: '#9A1730',
  tertiary: '#731126',
  accent: '#E6546A',
  light: '#F1A3AF',
  success: '#10B981',
  warning: '#F59E0B',
};

const SOURCE_COLORS: Record<string, string> = {
  google_ads: CHART_COLORS.primary,
  google_lsa: CHART_COLORS.secondary,
  facebook_ads: CHART_COLORS.accent,
  canvass: CHART_COLORS.tertiary,
  referral: CHART_COLORS.success,
  website: CHART_COLORS.warning,
};

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  contacted: '#8B5CF6',
  qualified: '#F59E0B',
  proposal_sent: '#10B981',
  won: CHART_COLORS.success,
  lost: '#EF4444',
};

export default function AnalyticsPage() {
  const { leads, isLoading, fetchLeads } = useLeadStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchLeads();
  }, [fetchLeads]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter((lead) => lead.status === 'won').length;
    const lostLeads = leads.filter((lead) => lead.status === 'lost').length;
    const closedLeads = wonLeads + lostLeads;

    const conversionRate = closedLeads > 0 ? (wonLeads / closedLeads) * 100 : 0;
    const winRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    const totalRevenue = leads
      .filter((lead) => lead.status === 'won' && lead.estimatedValue)
      .reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

    const avgDealSize = wonLeads > 0 ? totalRevenue / wonLeads : 0;

    return {
      totalLeads,
      conversionRate,
      totalRevenue,
      winRate,
      avgDealSize,
      wonLeads,
    };
  }, [leads]);

  // Lead source breakdown data
  const sourceData = useMemo(() => {
    const sourceCount: Record<string, number> = {};

    leads.forEach((lead) => {
      sourceCount[lead.source] = (sourceCount[lead.source] || 0) + 1;
    });

    return Object.entries(sourceCount).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
      color: SOURCE_COLORS[name] || CHART_COLORS.primary,
    }));
  }, [leads]);

  // Lead status funnel data
  const statusData = useMemo(() => {
    const statusCount: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal_sent: 0,
      won: 0,
      lost: 0,
    };

    leads.forEach((lead) => {
      statusCount[lead.status] = (statusCount[lead.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, count]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
      color: STATUS_COLORS[name] || CHART_COLORS.primary,
    }));
  }, [leads]);

  // Leads over time data (last 6 months)
  const leadsOverTimeData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[key] = 0;
    }

    leads.forEach((lead) => {
      if (lead.createdAt) {
        const leadDate = new Date(lead.createdAt);
        const key = leadDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData.hasOwnProperty(key)) {
          monthlyData[key] += 1;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count,
    }));
  }, [leads]);

  // Revenue by month data
  const revenueByMonthData = useMemo(() => {
    const monthlyRevenue: Record<string, number> = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyRevenue[key] = 0;
    }

    leads
      .filter((lead) => lead.status === 'won' && lead.estimatedValue)
      .forEach((lead) => {
        if (lead.createdAt) {
          const leadDate = new Date(lead.createdAt);
          const key = leadDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (monthlyRevenue.hasOwnProperty(key)) {
            monthlyRevenue[key] += lead.estimatedValue || 0;
          }
        }
      });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }, [leads]);

  if (!mounted) {
    return null;
  }

  return (
    <ProtectedRoute requiredPermission="view_analytics">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Comprehensive insights into your sales performance
            </p>
          </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.totalLeads}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.wonLeads} won this period
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics.conversionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    {metrics.conversionRate >= 50 ? (
                      <>
                        <TrendingUp className="h-3 w-3 mr-1 text-success" />
                        <span className="text-success">Above average</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 mr-1 text-warning" />
                        <span className="text-warning">Below average</span>
                      </>
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${metrics.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: ${metrics.avgDealSize.toLocaleString()}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {metrics.winRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.wonLeads} of {metrics.totalLeads} leads
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Lead Source Breakdown - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Source Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill={SPARTAN_RED}
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Status Funnel - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads Over Time - Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Leads Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : leadsOverTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={leadsOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={SPARTAN_RED}
                      strokeWidth={2}
                      dot={{ fill: SPARTAN_RED, r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Leads"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Month - Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Month</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : revenueByMonthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueByMonthData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SPARTAN_RED} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={SPARTAN_RED} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={SPARTAN_RED}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Best Source
                  </p>
                  <p className="text-2xl font-bold" style={{ color: SPARTAN_RED }}>
                    {sourceData.length > 0
                      ? sourceData.reduce((max, curr) =>
                          curr.value > max.value ? curr : max
                        ).name
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Most Common Status
                  </p>
                  <p className="text-2xl font-bold" style={{ color: SPARTAN_RED }}>
                    {statusData.length > 0
                      ? statusData.reduce((max, curr) =>
                          curr.count > max.count ? curr : max
                        ).name
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Deal Size
                  </p>
                  <p className="text-2xl font-bold" style={{ color: SPARTAN_RED }}>
                    ${metrics.avgDealSize.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Closed
                  </p>
                  <p className="text-2xl font-bold" style={{ color: SPARTAN_RED }}>
                    {metrics.wonLeads}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
