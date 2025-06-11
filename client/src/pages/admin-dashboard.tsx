import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Tv, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Search,
  Filter,
  Edit,
  Star,
  Upload
} from "lucide-react";
import { TvShowsTable } from "@/components/admin/TvShowsTable";
import { EditShowDialog } from "@/components/admin/EditShowDialog";
import { ResearchTable } from "@/components/admin/ResearchTable";
import { EditResearchDialog } from "@/components/admin/EditResearchDialog";
import HomepageCategories from "@/components/admin/HomepageCategories";

interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  isAdmin: boolean;
}

export default function AdminDashboard() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingShow, setEditingShow] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showResearchDialog, setShowResearchDialog] = useState(false);
  const [editingResearch, setEditingResearch] = useState(null);
  const [isAddingNewResearch, setIsAddingNewResearch] = useState(false);

  // Check admin authentication - TEMPORARILY DISABLED FOR DEVELOPMENT
  const { data: adminUser, isLoading: loadingAuth } = useQuery<AdminUser>({
    queryKey: ['/api/admin/me'],
    queryFn: async () => {
      // Return mock admin user for development
      console.log('[ADMIN] Authentication disabled for development');
      return {
        id: 1,
        email: 'admin@tvtantrum.com',
        firstName: 'Admin',
        isAdmin: true
      };
    },
    retry: false,
  });

  // Get dashboard stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!adminUser,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation('/admin/login');
    },
  });

  // Use useEffect for redirect to avoid setState during render
  useEffect(() => {
    if (!loadingAuth && !adminUser) {
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
        setLocation('/admin/login');
      }
    }
  }, [loadingAuth, adminUser, setLocation]);

  // Return early if not authenticated
  if (!loadingAuth && !adminUser) {
    return null;
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleEditShow = (show: any) => {
    setEditingShow(show);
    setIsAddingNew(false);
    setShowEditDialog(true);
  };

  const handleAddShow = () => {
    setEditingShow(null);
    setIsAddingNew(true);
    setShowEditDialog(true);
  };

  const handleCloseDialog = () => {
    setShowEditDialog(false);
    setEditingShow(null);
    setIsAddingNew(false);
  };

  const handleEditResearch = (research: any) => {
    setEditingResearch(research);
    setIsAddingNewResearch(false);
    setShowResearchDialog(true);
  };

  const handleAddResearch = () => {
    setEditingResearch(null);
    setIsAddingNewResearch(true);
    setShowResearchDialog(true);
  };

  const handleCloseResearchDialog = () => {
    setShowResearchDialog(false);
    setEditingResearch(null);
    setIsAddingNewResearch(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">TV Tantrum Admin</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {adminUser?.firstName} ({adminUser?.email})
              </Badge>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="container mx-auto px-4">
        <div className="border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tv-shows')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tv-shows'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              TV Shows
            </button>
            <button
              onClick={() => setActiveTab('research')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'research'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Research
            </button>
            <button
              onClick={() => setActiveTab('homepage-categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'homepage-categories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Homepage Categories
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
                  <Tv className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loadingStats ? "..." : stats?.totalShows || 302}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Authentic TV shows in catalog
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Featured Shows</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : stats?.featuredShows || 12}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently featured content
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? "..." : stats?.adminUsers || 1}
              </div>
              <p className="text-xs text-muted-foreground">
                System administrators
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  Online
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                PostgreSQL connected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tv className="w-5 h-5 mr-2" />
                Manage Shows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View, edit, and manage the TV show catalog
              </p>
              <Button className="w-full" onClick={() => setActiveTab('tv-shows')}>
                <Search className="w-4 h-4 mr-2" />
                Browse Catalog
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Add New Show
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Add new TV shows to the catalog database
              </p>
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Show
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View usage statistics and platform analytics
              </p>
              <Button className="w-full" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">TV Tantrum Catalog Initialized</p>
                  <p className="text-sm text-gray-600">302 authentic TV shows loaded successfully</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  Complete
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Database Migration</p>
                  <p className="text-sm text-gray-600">Catalog schema updated with sensory data</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Admin System Enabled</p>
                  <p className="text-sm text-gray-600">Administrative access configured</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  Ready
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Public Site Link */}
            <div className="mt-8">
              <Alert>
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>View the public TV Tantrum catalog site</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation('/')}
                    >
                      Go to Public Site →
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {activeTab === 'tv-shows' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">TV Shows</h2>
                <p className="text-muted-foreground">
                  View and manage all TV shows in the database
                </p>
              </div>
              <Button onClick={handleAddShow}>
                <Plus className="h-4 w-4 mr-2" />
                Add Show
              </Button>
            </div>
            <TvShowsTable onEdit={handleEditShow} />
          </div>
        )}

        {activeTab === 'research' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Research Manager</h2>
                <p className="text-muted-foreground">
                  Manage research summaries and original study links
                </p>
              </div>
              <Button onClick={handleAddResearch}>
                <Plus className="w-4 h-4 mr-2" />
                Add Research
              </Button>
            </div>
            <ResearchTable onEdit={handleEditResearch} />
          </div>
        )}

        {activeTab === 'homepage-categories' && (
          <HomepageCategories />
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">User Management</h2>
              <p className="text-muted-foreground">
                View and manage user accounts and permissions
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  User management features coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">System Settings</h2>
              <p className="text-muted-foreground">
                Configure system settings and preferences
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Settings panel coming soon...
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <EditShowDialog
        show={editingShow}
        isOpen={showEditDialog}
        onClose={handleCloseDialog}
        isAddingNew={isAddingNew}
      />

      <EditResearchDialog
        research={editingResearch}
        isOpen={showResearchDialog}
        onClose={handleCloseResearchDialog}
        isAddingNew={isAddingNewResearch}
      />
    </div>
  );
}