'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
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
  GOOGLE_ADS: CHART_COLORS.primary,
  GOOGLE_LSA: CHART_COLORS.secondary,
  FACEBOOK_ADS: CHART_COLORS.accent,
  CANVASS: CHART_COLORS.tertiary,
  REFERRAL: CHART_COLORS.success,
  WEBSITE: CHART_COLORS.warning,
  google_ads: CHART_COLORS.primary,
  google_lsa: CHART_COLORS.secondary,
  facebook_ads: CHART_COLORS.accent,
  canvass: CHART_COLORS.tertiary,
  referral: CHART_COLORS.success,
  website: CHART_COLORS.warning,
};

const MEDIUM_COLORS: Record<string, string> = {
  CPC: '#E6546A',
  LSAS: '#F1A3AF',
  SOCIAL_ADS: '#9A1730',
  CANVASS: '#731126',
  REFERRAL: '#10B981',
  ORGANIC: '#F59E0B',
  cpc: '#E6546A',
  lsas: '#F1A3AF',
  social_ads: '#9A1730',
  canvass: '#731126',
  referral: '#10B981',
  organic: '#F59E0B',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3B82F6',
  CONTACTED: '#8B5CF6',
  SCHEDULED: '#06B6D4',
  INSPECTION_INSURANCE: '#F59E0B',
  PROPOSAL_SENT: '#10B981',
  CONTRACT_SIGNED: '#22C55E',
  LOST: '#EF4444',
  JOB_SCHEDULED: '#84CC16',
  JOB_COMPLETED: '#65A30D',
  INVOICE_SENT: '#14B8A6',
  PAST_DUE_30_DAYS: '#F97316',
  PAID: CHART_COLORS.success,
  PAID_30_DAYS: '#059669',
};

export default function AnalyticsPage() {
  const params = useParams();
  const companyId = params.company_id as string;
  const { leads, isLoading, fetchLeads } = useLeadStore();

  const [mounted, setMounted] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Leads are already fetched by the lead store, no need to fetch again
    if (leads.length === 0 && !isLoading) {
      fetchLeads();
    }
  }, [companyId, leads.length, isLoading, fetchLeads]);

  // Helper function to get lead value from either estimatedValue or estValue
  const getLeadValue = (lead: any): number => {
    if (lead.estimatedValue) {
      return lead.estimatedValue;
    }
    if (lead.estValue?.amountMicros) {
      return lead.estValue.amountMicros / 1000000;
    }
    return 0;
  };

  // Calculate key metrics
  const metrics = useMemo(() => {
    // Define converted statuses (successful conversions)
    const convertedStatuses = [
      'CONTRACT_SIGNED',
      'JOB_SCHEDULED',
      'JOB_COMPLETED',
      'INVOICE_SENT',
      'PAST_DUE_30_DAYS',
      'PAID',
      'PAID_30_DAYS'
    ];

    const totalLeads = leads.length;
    const convertedLeads = leads.filter((lead) => convertedStatuses.includes(lead.status)).length;
    const lostLeads = leads.filter((lead) => lead.status === 'LOST').length;
    const closedLeads = convertedLeads + lostLeads; // Only converted + lost count toward conversion rate

    // Conversion rate = converted / (converted + lost)
    const conversionRate = closedLeads > 0 ? (convertedLeads / closedLeads) * 100 : 0;
    const winRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Only count revenue from PAID statuses (PAID and PAID_30_DAYS)
    const paidStatuses = ['PAID', 'PAID_30_DAYS'];
    const totalRevenue = leads
      .filter((lead) => paidStatuses.includes(lead.status))
      .reduce((sum, lead) => sum + getLeadValue(lead), 0);

    const paidLeads = leads.filter((lead) => paidStatuses.includes(lead.status)).length;
    const avgDealSize = paidLeads > 0 ? totalRevenue / paidLeads : 0;

    return {
      totalLeads,
      conversionRate,
      totalRevenue,
      winRate,
      avgDealSize,
      wonLeads: convertedLeads,
    };
  }, [leads, getLeadValue]);

  // Lead source breakdown data with medium drill-down
  const sourceData = useMemo(() => {
    if (selectedSource) {
      // Show medium breakdown for selected source
      const mediumCount: Record<string, number> = {};

      leads
        .filter(lead => lead.source === selectedSource ||
          lead.source?.toLowerCase() === selectedSource.toLowerCase())
        .forEach((lead) => {
          const medium = lead.medium || 'unknown';
          mediumCount[medium] = (mediumCount[medium] || 0) + 1;
        });

      return Object.entries(mediumCount).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
        color: MEDIUM_COLORS[name] || MEDIUM_COLORS[name.toUpperCase()] || CHART_COLORS.accent,
        isMedium: true,
      }));
    } else {
      // Show source breakdown
      const sourceCount: Record<string, number> = {};

      leads.forEach((lead) => {
        const source = lead.source || 'unknown';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });

      return Object.entries(sourceCount).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
        color: SOURCE_COLORS[name] || SOURCE_COLORS[name.toUpperCase()] || CHART_COLORS.primary,
        rawName: name,
        isMedium: false,
      }));
    }
  }, [leads, selectedSource]);

  // Lead status funnel data
  const statusData = useMemo(() => {
    const statusCount: Record<string, number> = {};

    // Count leads by status
    leads.forEach((lead) => {
      statusCount[lead.status] = (statusCount[lead.status] || 0) + 1;
    });

    // Convert to array and format
    return Object.entries(statusCount)
      .map(([name, count]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count,
        color: STATUS_COLORS[name] || CHART_COLORS.primary,
      }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [leads]);

  // Leads over time data (last 6 months) - using Twenty CRM createdAt
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
      // Use createdAt from Twenty CRM (this is when they were added to Twenty)
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

  // Revenue by month data - using Twenty CRM updatedAt
  const revenueByMonthData = useMemo(() => {
    // Only count revenue from PAID statuses
    const paidStatuses = ['PAID', 'PAID_30_DAYS'];

    const monthlyRevenue: Record<string, number> = {};
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyRevenue[key] = 0;
    }

    leads
      .filter((lead) => paidStatuses.includes(lead.status))
      .forEach((lead) => {
        // Use updatedAt to determine when lead moved to PAID status
        const dateField = lead.updatedAt || lead.createdAt;
        if (dateField) {
          const leadDate = new Date(dateField);
          const key = leadDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (monthlyRevenue.hasOwnProperty(key)) {
            monthlyRevenue[key] += getLeadValue(lead);
          }
        }
      });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }, [leads, getLeadValue]);

  if (!mounted) {
    return null;
  }

  return (
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
          {/* Lead Source Breakdown - Pie Chart with Medium Drill-down */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedSource
                    ? `Medium Breakdown - ${selectedSource.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`
                    : 'Lead Source Breakdown'}
                </CardTitle>
                {selectedSource && (
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="text-sm text-[#C41E3A] hover:underline"
                  >
                    ← Back to Sources
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedSource
                  ? 'Click the back button to return to source view'
                  : 'Click on a source to see medium breakdown'}
              </p>
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
                      onClick={(data) => {
                        if (!selectedSource && !data.isMedium) {
                          setSelectedSource(data.rawName);
                        }
                      }}
                      style={{ cursor: selectedSource ? 'default' : 'pointer' }}
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
  );
}
