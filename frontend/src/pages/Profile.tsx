import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Mail, Phone, Hash, Shield, Key, Edit2, Save, X, Lock } from 'lucide-react';

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    role: string;
    usn?: string;
}

export default function Profile() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        email: '',
        phone: '',
        usn: ''
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password Change State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);

    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/api/user/me');
            setUser(res.data);
            setEditFormData({
                email: res.data.email || '',
                phone: res.data.phone || '',
                usn: res.data.usn || ''
            });
        } catch (err) {
            console.error("Failed to fetch profile", err);
            toast({
                title: "Error",
                description: "Failed to load profile. Please login again.",
                variant: "destructive"
            });
            navigate('/auth');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSavingProfile(true);

            const payload: any = {
                email: editFormData.email,
                phone: editFormData.phone
            };

            // Only include USN if it's currently empty in the original user object
            if (!user?.usn && editFormData.usn) {
                payload.usn = editFormData.usn;
            }

            const res = await api.put('/api/user/update', payload);

            setUser(res.data);
            setEditFormData({
                email: res.data.email || '',
                phone: res.data.phone || '',
                usn: res.data.usn || ''
            });
            setIsEditing(false);

            toast({
                title: "Profile Updated",
                description: "Your profile details have been saved.",
            });

        } catch (err: any) {
            toast({
                title: "Update Failed",
                description: err.response?.data?.message || err.response?.data || "Failed to update profile.",
                variant: "destructive"
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmNewPassword) {
            toast({
                title: "Password Mismatch",
                description: "New passwords do not match.",
                variant: "destructive"
            });
            return;
        }

        if (passwords.newPassword.length < 6) {
            toast({
                title: "Invalid Password",
                description: "Password must be at least 6 characters.",
                variant: "destructive"
            });
            return;
        }

        try {
            setChangingPassword(true);
            await api.post('/api/user/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });

            toast({
                title: "Success",
                description: "Password changed successfully.",
            });

            setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });

        } catch (err: any) {
            toast({
                title: "Failed",
                description: err.response?.data || "Failed to change password.",
                variant: "destructive"
            });
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const canEditUsn = user?.role?.toLowerCase() === 'student' && (!user?.usn || user?.usn.trim() === '');

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 to-background/0 -z-10" />

            <div className="container py-8 max-w-5xl">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

                    {/* Profile Info Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                                <p className="text-muted-foreground mt-1">
                                    Manage your personal information
                                </p>
                            </div>
                            <Button
                                variant={isEditing ? "outline" : "default"}
                                onClick={() => {
                                    if (isEditing) {
                                        // Cancel changes
                                        setEditFormData({
                                            email: user?.email || '',
                                            phone: user?.phone || '',
                                            usn: user?.usn || ''
                                        });
                                    }
                                    setIsEditing(!isEditing);
                                }}
                                className={isEditing ? "border-destructive/50 text-destructive hover:bg-destructive/10" : "gradient-primary border-0 shadow-lg text-white"}
                            >
                                {isEditing ? (
                                    <>
                                        <X className="h-4 w-4 mr-2" /> Cancel
                                    </>
                                ) : (
                                    <>
                                        <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                                    </>
                                )}
                            </Button>
                        </div>

                        <form onSubmit={handleProfileUpdate}>
                            <Card className="border-border/50 shadow-card overflow-hidden">
                                {/* Cover Image */}
                                <div className="h-32 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 relative">
                                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
                                </div>

                                <CardContent className="relative pt-0 pb-8 px-8">
                                    {/* Avatar */}
                                    <div className="-mt-12 mb-6 flex justify-between items-end">
                                        <div className="h-24 w-24 rounded-2xl gradient-primary flex items-center justify-center text-4xl font-bold text-white shadow-xl border-4 border-background transform transition-transform hover:scale-105">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        {!isEditing && (
                                            <Badge variant="secondary" className="mb-2 text-sm px-3 py-1 bg-accent/10 text-accent border-accent/20">
                                                {user?.role?.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>

                                    {!isEditing ? (
                                        /* VIEW MODE */
                                        <div className="grid gap-6 animate-in fade-in duration-300">
                                            <div>
                                                <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
                                                <p className="text-muted-foreground">{user?.email}</p>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors group">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 rounded-lg bg-background shadow-xs text-primary group-hover:scale-110 transition-transform">
                                                            <Mail className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Email</span>
                                                    </div>
                                                    <p className="font-medium pl-1">{user?.email}</p>
                                                </div>

                                                <div className="p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors group">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 rounded-lg bg-background shadow-xs text-primary group-hover:scale-110 transition-transform">
                                                            <Phone className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Phone</span>
                                                    </div>
                                                    <p className="font-medium pl-1">{user?.phone || 'Not provided'}</p>
                                                </div>

                                                {user?.role?.toLowerCase() === 'student' && (
                                                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors group sm:col-span-2">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="p-2 rounded-lg bg-background shadow-xs text-primary group-hover:scale-110 transition-transform">
                                                                <Hash className="h-4 w-4" />
                                                            </div>
                                                            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">USN (Student ID)</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium pl-1">{user?.usn || 'Not provided'}</p>
                                                            {user.usn && <Lock className="h-3 w-3 text-muted-foreground" />}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        /* EDIT MODE */
                                        <div className="grid gap-6 animate-in slide-in-from-bottom-4 duration-300">
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                        Full Name
                                                    </label>
                                                    <Input value={user?.name} disabled className="bg-muted/50" />
                                                    <p className="text-[10px] text-muted-foreground">Name cannot be changed.</p>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium leading-none">Email</label>
                                                        <div className="relative">
                                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                value={editFormData.email}
                                                                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                                                className="pl-9"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium leading-none">Phone</label>
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                value={editFormData.phone}
                                                                onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                                                                className="pl-9"
                                                                placeholder="+91..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {user?.role?.toLowerCase() === 'student' && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-sm font-medium leading-none">USN (Student ID)</label>
                                                            {!canEditUsn && (
                                                                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                                                                    <Lock className="h-2 w-2" /> Locked
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="relative">
                                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                value={editFormData.usn}
                                                                onChange={e => setEditFormData({ ...editFormData, usn: e.target.value })}
                                                                className={`pl-9 ${!canEditUsn ? 'bg-muted/50' : ''}`}
                                                                disabled={!canEditUsn}
                                                                placeholder="Enter your USN"
                                                            />
                                                        </div>
                                                        {canEditUsn && (
                                                            <p className="text-[10px] text-amber-500 font-medium">
                                                                Note: You can only set your USN once. Please ensure it is correct.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <Button type="submit" className="gradient-primary text-white shadow-lg min-w-[120px]" disabled={savingProfile}>
                                                    {savingProfile ? (
                                                        <>
                                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="h-4 w-4 mr-2" /> Save Changes
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </form>
                    </div>

                    {/* Security Section Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-border/50 shadow-soft h-fit sticky top-6">
                            <CardHeader className="border-b border-border/50 pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Security</CardTitle>
                                        <CardDescription className="text-xs">Update your password</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium uppercase text-muted-foreground">Current Password</p>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-9 transition-all hover:border-primary/50 focus:border-primary"
                                                value={passwords.currentPassword}
                                                onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-medium uppercase text-muted-foreground">New Password</p>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-9 transition-all hover:border-primary/50"
                                                value={passwords.newPassword}
                                                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-medium uppercase text-muted-foreground">Confirm New</p>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="pl-9 transition-all hover:border-primary/50"
                                                value={passwords.confirmNewPassword}
                                                onChange={e => setPasswords({ ...passwords, confirmNewPassword: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90 mt-2" disabled={changingPassword}>
                                        {changingPassword ? 'Updating...' : 'Update Password'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}
