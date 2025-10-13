'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuthStore } from '@/store/useAuthStore';
import { db } from '@/lib/db/dexie';
import { getSyncStats, syncLeads, isOnline } from '@/lib/db/sync';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Settings,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ExternalLink,
  Server,
  HardDrive,
} from 'lucide-react';

interface SyncStats {
  total: number;
  synced: number;
  pending: number;
  error: number;
}

interface DBStats {
  totalLeads: number;
  storageUsed: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { config, hasPermission } = useAuthStore();
  const online = isOnline();
  const canEditSettings = hasPermission('edit_settings');

  const [syncStats, setSyncStats] = useState<SyncStats>({
    total: 0,
    synced: 0,
    pending: 0,
    error: 0,
  });
  const [dbStats, setDbStats] = useState<DBStats>({
    totalLeads: 0,
    storageUsed: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Load sync and database statistics
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        // Get sync statistics
        const stats = await getSyncStats();
        setSyncStats(stats);

        // Get database statistics
        const totalLeads = await db.leads.count();
        const allLeads = await db.leads.toArray();
        const estimatedSize = new Blob([JSON.stringify(allLeads)]).size;

        setDbStats({
          totalLeads,
          storageUsed: estimatedSize,
        });
      } catch (error) {
        console.error('Failed to load statistics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load database statistics',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [toast]);

  // Handle manual sync
  const handleManualSync = async () => {
    if (!online) {
      toast({
        title: 'Offline',
        description: 'Cannot sync while offline. Please check your connection.',
        variant: 'destructive',
      });
      return;
    }

    if (!config.isConfigured) {
      toast({
        title: 'Not Configured',
        description: 'Please configure your API settings first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncLeads();

      // Reload stats after sync
      const stats = await getSyncStats();
      setSyncStats(stats);

      if (result.success) {
        toast({
          title: 'Sync Successful',
          description: `Synced ${result.synced} leads successfully`,
        });
      } else {
        toast({
          title: 'Sync Completed with Errors',
          description: `${result.synced} synced, ${result.failed} failed`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync with CRM',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle clear database
  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      await db.leads.clear();

      toast({
        title: 'Database Cleared',
        description: 'All local data has been removed successfully',
      });

      setShowClearDialog(false);

      // Reload stats
      setSyncStats({ total: 0, synced: 0, pending: 0, error: 0 });
      setDbStats({ totalLeads: 0, storageUsed: 0 });
    } catch (error) {
      console.error('Failed to clear database:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear database. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Handle change API key (redirect to setup)
  const handleChangeApiKey = () => {
    router.push('/setup');
  };

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Manage your app configuration and preferences
            </p>
          </div>
          <Badge
            variant={online ? 'default' : 'secondary'}
            className={`h-8 px-3 ${online ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
          >
            {online ? (
              <>
                <Wifi className="mr-1 h-4 w-4" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="mr-1 h-4 w-4" />
                Offline
              </>
            )}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="api" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
            <TabsTrigger value="api" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">API Config</span>
              <span className="sm:hidden">API</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Sync</span>
              <span className="sm:hidden">Sync</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
              <span className="sm:hidden">About</span>
            </TabsTrigger>
          </TabsList>

          {/* API Configuration Tab */}
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-[#C41E3A]" />
                  Twenty CRM Configuration
                </CardTitle>
                <CardDescription>
                  View and manage your Twenty CRM API connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.isConfigured ? (
                  <>
                    <div className="rounded-lg border bg-green-50 border-green-200 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <h4 className="font-medium text-green-900">API Connected</h4>
                          <p className="text-sm text-green-700">
                            Your app is successfully connected to Twenty CRM
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-sm font-medium text-gray-700">API URL</span>
                        <span className="text-sm text-gray-900 font-mono">
                          {config.twentyCRM.apiUrl || 'Not configured'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b">
                        <span className="text-sm font-medium text-gray-700">API Key</span>
                        <span className="text-sm text-gray-500 font-mono">
                          ••••••••••••••••
                        </span>
                      </div>
                      {config.twentyCRM.workspaceId && (
                        <div className="flex items-center justify-between py-3 border-b">
                          <span className="text-sm font-medium text-gray-700">Workspace ID</span>
                          <span className="text-sm text-gray-900 font-mono">
                            {config.twentyCRM.workspaceId}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm font-medium text-gray-700">Status</span>
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border bg-yellow-50 border-yellow-200 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium text-yellow-900">API Not Configured</h4>
                        <p className="text-sm text-yellow-700">
                          Configure your API settings to enable sync with Twenty CRM
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full">
                        <Button
                          onClick={handleChangeApiKey}
                          disabled={!canEditSettings}
                          className="w-full bg-[#C41E3A] hover:bg-[#A01828] disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {config.isConfigured ? 'Change API Configuration' : 'Configure API'}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canEditSettings && (
                      <TooltipContent>
                        <p>You don't have permission to edit settings</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-[#C41E3A]" />
                  Sync Statistics
                </CardTitle>
                <CardDescription>
                  Overview of your data synchronization with Twenty CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2 rounded-lg border p-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2 rounded-lg border p-4 hover:border-[#C41E3A] transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Total Leads</span>
                        <Database className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{syncStats.total}</div>
                    </div>

                    <div className="space-y-2 rounded-lg border p-4 hover:border-green-500 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Synced</span>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {syncStats.synced}
                      </div>
                    </div>

                    <div className="space-y-2 rounded-lg border p-4 hover:border-yellow-500 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Pending</span>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {syncStats.pending}
                      </div>
                    </div>

                    <div className="space-y-2 rounded-lg border p-4 hover:border-red-500 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Errors</span>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {syncStats.error}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleManualSync}
                  disabled={!online || isSyncing || !config.isConfigured}
                  className="w-full bg-[#C41E3A] hover:bg-[#A01828] disabled:bg-gray-300"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-[#C41E3A]" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Manage your local database and storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Total Records</span>
                    <p className="text-2xl font-bold text-gray-900">{dbStats.totalLeads}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Storage Used</span>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatBytes(dbStats.storageUsed)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                    <div className="space-y-1">
                      <h4 className="font-medium text-yellow-900">Clear Local Database</h4>
                      <p className="text-sm text-yellow-700">
                        This will permanently delete all locally stored leads. Make sure your
                        data is synced with Twenty CRM before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={!canEditSettings}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Clear Local Database
                            </Button>
                          </DialogTrigger>
                        </div>
                      </TooltipTrigger>
                      {!canEditSettings && (
                        <TooltipContent>
                          <p>You don't have permission to edit settings</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Clear Local Database?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. All local data will be permanently deleted.
                        Make sure you have synced your data with Twenty CRM first.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        onClick={() => setShowClearDialog(false)}
                        disabled={isClearing}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleClearDatabase}
                        disabled={isClearing}
                      >
                        {isClearing ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          'Yes, Clear Database'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-[#C41E3A]" />
                  App Information
                </CardTitle>
                <CardDescription>
                  Version and status information for Arisys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm font-medium text-gray-700">App Name</span>
                    <span className="text-sm font-semibold text-[#C41E3A]">Arisys</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm font-medium text-gray-700">Version</span>
                    <span className="text-sm text-gray-900">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm font-medium text-gray-700">Online Status</span>
                    <Badge
                      variant={online ? 'default' : 'secondary'}
                      className={online ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {online ? (
                        <>
                          <Wifi className="mr-1 h-3 w-3" />
                          Online
                        </>
                      ) : (
                        <>
                          <WifiOff className="mr-1 h-3 w-3" />
                          Offline
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm font-medium text-gray-700">Platform</span>
                    <span className="text-sm text-gray-900">Progressive Web App</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-sm font-medium text-gray-700">API Status</span>
                    <Badge
                      variant={config.isConfigured ? 'default' : 'secondary'}
                      className={config.isConfigured ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {config.isConfigured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-700">Database Records</span>
                    <span className="text-sm text-gray-900">{dbStats.totalLeads} leads</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About Arisys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Arisys is an enterprise-grade Progressive Web App designed for
                  roofing companies to manage leads, track opportunities,
                  and seamlessly sync with Twenty CRM.
                </p>
                <p className="text-sm text-gray-600">
                  Built with Next.js, React, TypeScript, and IndexedDB for optimal performance
                  and offline-first capabilities. Works seamlessly whether you're online or offline.
                </p>
                <div className="pt-2">
                  <p className="text-xs text-gray-500">
                    &copy; 2024 Arisys. All rights reserved.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
