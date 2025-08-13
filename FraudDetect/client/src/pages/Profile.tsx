import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Save, Shield, Monitor, Smartphone, X } from "lucide-react";

export default function Profile() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    department: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Populate form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        jobTitle: user.jobTitle || "",
        department: user.department || "",
      });
    }
  }, [user]);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    retry: false,
  });

  const { data: models } = useQuery({
    queryKey: ["/api/models"],
    retry: false,
  });

  const { data: predictions } = useQuery({
    queryKey: ["/api/predictions"],
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      // Since we're using Replit Auth, we can't directly update user profile
      // This would typically update user settings or additional profile data
      return await apiRequest("POST", "/api/settings", { userProfile: profileData });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: any) => {
      return await apiRequest("POST", "/api/auth/change-password", passwordData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    },
  });

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  // Calculate user statistics
  const userStats = {
    modelsCreated: (models || []).length,
    datasetsUploaded: (stats || {}).datasets || 0,
    predictionsMade: (predictions || []).length,
    fraudDetected: (predictions || []).filter((p: any) => p.prediction === 'fraud').length,
  };

  const activeSessions = [
    {
      id: 1,
      device: "Desktop - Chrome on Windows",
      location: "San Francisco, CA",
      lastActive: "2 minutes ago",
      current: true,
    },
    {
      id: 2,
      device: "Mobile - Safari on iPhone",
      location: "New York, NY",
      lastActive: "3 hours ago",
      current: false,
    },
  ];

  if (isLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-page-title">
          User Profile
        </h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={user?.profileImageUrl}
                  alt="Profile picture"
                  className="object-cover"
                />
                <AvatarFallback className="text-xl font-semibold bg-primary text-primary-foreground">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-sm text-primary hover:text-blue-700"
                data-testid="button-change-photo"
              >
                <Camera className="mr-2" size={16} />
                Change Photo
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-user-name">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "User"}
              </h2>
              <p className="text-gray-600" data-testid="text-user-title">
                {formData.jobTitle || "Fraud Detection Specialist"}
              </p>
              <p className="text-gray-600" data-testid="text-user-company">
                {formData.company || "FraudGuard ML"}
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <span>
                  Member since: <span data-testid="text-member-since">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                </span>
                <span>
                  Last active: <span data-testid="text-last-active">Now</span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter first name"
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
                data-testid="input-last-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                disabled
                data-testid="input-email"
              />
              <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                data-testid="input-phone"
              />
            </div>
            <div>
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Enter job title"
                data-testid="input-job-title"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Enter company name"
                data-testid="input-company"
              />
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department"
                data-testid="input-department"
              />
            </div>
          </div>
          <Button
            onClick={handleUpdateProfile}
            disabled={updateProfileMutation.isPending}
            className="bg-primary hover:bg-blue-700"
            data-testid="button-update-profile"
          >
            <Save className="mr-2" size={16} />
            {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  data-testid="input-current-password"
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  data-testid="input-new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="mt-4 bg-secondary hover:bg-green-700"
              data-testid="button-change-password"
            >
              <Shield className="mr-2" size={16} />
              {changePasswordMutation.isPending ? "Changing..." : "Update Password"}
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <Button
                variant="outline"
                className="bg-blue-100 hover:bg-blue-200 text-primary"
                data-testid="button-setup-2fa"
              >
                <Shield className="mr-2" size={16} />
                Enable 2FA
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Active Sessions</h3>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {session.device.includes("Desktop") ? (
                      <Monitor className="text-gray-400 mr-3" size={20} />
                    ) : (
                      <Smartphone className="text-gray-400 mr-3" size={20} />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900" data-testid={`text-device-${session.id}`}>
                        {session.device}
                      </p>
                      <p className="text-xs text-gray-500" data-testid={`text-location-${session.id}`}>
                        {session.location} • Last active {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {session.current ? (
                    <Badge variant="default">Current</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-red-700"
                      data-testid={`button-terminate-${session.id}`}
                    >
                      <X size={16} />
                      Terminate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="text-models-created">
                {userStats.modelsCreated}
              </div>
              <div className="text-sm text-gray-600">Models Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary" data-testid="text-datasets-uploaded">
                {userStats.datasetsUploaded}
              </div>
              <div className="text-sm text-gray-600">Datasets Uploaded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600" data-testid="text-predictions-made">
                {userStats.predictionsMade}
              </div>
              <div className="text-sm text-gray-600">Predictions Made</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600" data-testid="text-fraud-detected">
                {userStats.fraudDetected}
              </div>
              <div className="text-sm text-gray-600">Fraud Detected</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
