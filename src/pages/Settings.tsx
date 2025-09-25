import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Download, 
  LogOut, 
  Bell, 
  Moon, 
  Shield, 
  ChevronRight,
  FileText,
  HelpCircle
} from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Fetch all user data
      const [transactions, categories, incomes, goals, subscriptions] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user?.id),
        supabase.from('categories').select('*').eq('user_id', user?.id),
        supabase.from('incomes').select('*').eq('user_id', user?.id),
        supabase.from('goals').select('*').eq('user_id', user?.id),
        supabase.from('subscriptions').select('*').eq('user_id', user?.id),
      ]);

      const data = {
        exported_at: new Date().toISOString(),
        transactions: transactions.data,
        categories: categories.data,
        incomes: incomes.data,
        goals: goals.data,
        subscriptions: subscriptions.data,
      };

      // Create and download CSV/JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        description: "Your financial data has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">Member since {new Date().getFullYear()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                  </div>
                </div>
                <Switch 
                  id="dark-mode" 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders</p>
                  </div>
                </div>
                <Switch 
                  id="notifications" 
                  checked={notifications} 
                  onCheckedChange={setNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>Manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={exportData}
                disabled={isExporting}
              >
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Data
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => toast({ title: "Coming soon", description: "Privacy settings will be available soon" })}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy Settings
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => toast({ title: "Coming soon", description: "Help documentation will be available soon" })}
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Help Center
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => toast({ title: "Coming soon", description: "Terms of service will be available soon" })}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Terms & Policies
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Version Info */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}