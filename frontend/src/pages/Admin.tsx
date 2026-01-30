import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/api/api';
import { getFcmToken, listenNotifications } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Utensils,
  IndianRupee,
  ShoppingBag,
  Clock,
  TrendingUp,
  Users,
  LogOut,
  Settings,
  ChefHat,
  CheckCircle,
  Package,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  RefreshCw,
  Ticket,
  Trash2,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ================= TYPES ================= */

type OrderStatus = 'ORDERED' | 'PREPARING' | 'READY' | 'COMPLETED';

interface AdminStats {
  dailyRevenue: number;
  totalOrders: number;
  peakHour: string;
  avgWaitTime: number;
  activeOrders: number;
  completedToday: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  demandAnalysis: { name: string; orderCount: number; demand: string }[];
  salesTrend: { label: string; revenue: number }[];
  hourlyPattern: { hour: string; orders: number }[];
}

interface AdminOrder {
  id: number;
  tokenNumber: number;
  status: OrderStatus;
  totalAmount: number;
  itemNames?: string;
  itemsSummary?: string;
  items?: { name: string; quantity: number }[];
  customerName: string;
  otpExpiry?: string | null;
}

interface UserFeedback {
  id: number;
  rating: number;
  customerName: string;
  tokenNumber: string | number;
  comment: string;
  foodQuality: string;
  deliverySpeed: string;
  items: string[];
  wouldRecommend: boolean;
  createdAt?: string;
}

interface UserQuery {
  id: number;
  userEmail: string;
  userName?: string;
  queryText: string;
  replyText?: string;
  replied: boolean;
  createdAt: string;
}

interface Coupon {
  id: number;
  code: string;
  discountPercentage: number;
  expiryDate?: string;
  active: boolean;
}

/* ================= COMPONENT ================= */

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState<AdminStats>({
    dailyRevenue: 0,
    totalOrders: 0,
    peakHour: '-',
    avgWaitTime: 0,
    activeOrders: 0,
    completedToday: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    demandAnalysis: [],
    salesTrend: [],
    hourlyPattern: [],
  });

  const [analyticsDate, setAnalyticsDate] = useState<string>(''); // For filtering specific day

  const demandColors: Record<string, string> = {
    high: 'hsl(var(--success))',
    medium: 'hsl(var(--warning))',
    low: 'hsl(var(--destructive))',
  };

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [userFeedbacks, setUserFeedbacks] = useState<UserFeedback[]>([]);
  const [userQueries, setUserQueries] = useState<UserQuery[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);
  const [showAllQueries, setShowAllQueries] = useState(false);
  const [replyQueryId, setReplyQueryId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [newCoupon, setNewCoupon] = useState<{
    code: string;
    discountPercentage: string;
    expiryDate: string;
  }>({ code: '', discountPercentage: '', expiryDate: '' });

  const [timeRange, setTimeRange] = useState('weekly');

  // OTP Verification State
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [verificationOtp, setVerificationOtp] = useState('');

  /* ================= AUTH GUARD ================= */

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role?.toLowerCase() !== 'admin') {
      window.location.href = '/auth';
    }
  }, []);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadStats();
    loadOrders();
    loadFeedbacks();
    loadQueries();
    loadCoupons();

    // Init FCM for Admin
    const initFCM = async () => {
      const token = await getFcmToken();
      if (token) {
        await api.post("/api/user/fcm-token", { token });
      }
    };
    initFCM();
    listenNotifications();

    const interval = setInterval(() => {
      loadStats();
      loadOrders();
      loadFeedbacks();
      loadQueries();
    }, 5000);

    return () => clearInterval(interval);
  }, [timeRange, analyticsDate]);

  const loadStats = async () => {
    try {
      let url = `/api/admin/dashboard?range=${timeRange}`;
      if (analyticsDate) {
        url += `&date=${analyticsDate}`;
      }
      const { data } = await api.get(url);
      const normalizedStats: AdminStats = {
        dailyRevenue: data.revenueToday || 0,
        totalOrders: data.totalOrders || 0,
        peakHour: data.peakHour || '-',
        avgWaitTime: data.avgWaitTime || 0,
        activeOrders: data.activeOrders || 0,
        completedToday: data.completedToday || 0,
        weeklyRevenue: data.revenueWeekly || 0,
        monthlyRevenue: data.revenueMonthly || 0,
        demandAnalysis: data.demandAnalysis || [],
        salesTrend: data.salesTrend || [],
        hourlyPattern: data.hourlyPattern || [],
      };
      setStats(normalizedStats);
    } catch (error) {
      console.error("Stats load error:", error);
      toast({
        title: 'Failed to load admin stats',
        variant: 'destructive',
      });
    }
  };

  const loadOrders = () => {
    api.get('/api/admin/orders')
      .then(res => {
        // Sort by ID descending (newest first)
        const sorted = (res.data || []).sort((a: AdminOrder, b: AdminOrder) => b.id - a.id);
        setOrders(sorted);
      })
      .catch(() =>
        toast({
          title: 'Failed to load orders',
          variant: 'destructive',
        })
      );
  };

  const loadFeedbacks = () => {
    api.get('/api/admin/feedbacks')
      .then(res => {
        const sorted = (res.data || []).sort((a: UserFeedback, b: UserFeedback) => b.id - a.id);
        setUserFeedbacks(sorted);
      })
      .catch(() => {
        console.log('Failed to load feedbacks');
      });
  };

  const loadQueries = () => {
    api.get('/api/admin/queries')
      .then(res => {
        setUserQueries(res.data || []);
      })
      .catch(() => console.log('Failed to load queries'));
  };

  const loadCoupons = () => {
    api.get('/api/admin/coupons')
      .then(res => setCoupons(res.data || []))
      .catch(() => console.log('Failed to load coupons'));
  };

  const downloadPdf = async () => {
    try {
      const response = await api.get('/api/admin/reports/daily-pdf', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast({ title: 'PDF Report Downloaded' });
    } catch (error) {
      toast({ title: 'Failed to download PDF report', variant: 'destructive' });
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await api.get('/api/admin/reports/daily-excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast({ title: 'Excel Report Downloaded' });
    } catch (error) {
      toast({ title: 'Failed to download Excel report', variant: 'destructive' });
    }
  };

  const createCoupon = async () => {
    if (!newCoupon.code || !newCoupon.discountPercentage) {
      toast({ title: 'Code and Discount % are required', variant: 'destructive' });
      return;
    }
    try {
      await api.post('/api/admin/coupons', {
        code: newCoupon.code,
        discountPercentage: parseFloat(newCoupon.discountPercentage),
        expiryDate: newCoupon.expiryDate || null,
        isActive: true
      });
      toast({ title: 'Coupon Created' });
      setNewCoupon({ code: '', discountPercentage: '', expiryDate: '' });
      loadCoupons();
    } catch (err: any) {
      toast({ title: 'Failed to create coupon', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const deleteCoupon = async (id: number) => {
    try {
      await api.delete(`/api/admin/coupons/${id}`);
      toast({ title: 'Coupon Deleted' });
      loadCoupons();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleReplySubmit = async () => {
    if (!replyQueryId || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/admin/queries/${replyQueryId}/reply`, { reply: replyText });
      toast({ title: 'Reply sent', description: 'User will be notified via email.' });
      setReplyQueryId(null);
      setReplyText('');
      loadQueries();
    } catch (err) {
      toast({ title: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ================= UPDATE ORDER STATUS ================= */

  const updateOrderStatus = async (id: number, status: OrderStatus) => {
    // If Admin tries to complete a READY order, show OTP dialog first
    const order = orders.find(o => o.id === id);
    if (status === 'COMPLETED' && order?.status === 'READY') {
      setSelectedOrderId(id);
      setVerificationOtp('');
      setShowOtpDialog(true);
      return;
    }

    try {
      await api.put(`/api/admin/orders/${id}/status`, { status });
      toast({
        title: 'Order updated',
        description: `Order marked as ${status}`,
      });
      loadOrders();
      loadStats();
    } catch {
      toast({
        title: 'Update failed',
        variant: 'destructive',
      });
    }
  };

  const verifyOrderOtp = async () => {
    if (!selectedOrderId || !verificationOtp) return;

    try {
      await api.post(`/api/admin/orders/${selectedOrderId}/complete`, { otp: verificationOtp });
      toast({
        title: 'Order Completed',
        description: 'OTP verified successfully!',
      });
      setShowOtpDialog(false);
      loadOrders();
      loadStats();
    } catch (err: any) {
      toast({
        title: 'Verification Failed',
        description: err.response?.data || 'Invalid OTP',
        variant: 'destructive'
      });
    }
  };

  const resendOtp = async (orderId: number) => {
    try {
      await api.post(`/api/admin/orders/${orderId}/resend-otp`);
      toast({
        title: 'OTP Resent',
        description: 'A new OTP has been sent to the customer.',
      });
    } catch {
      toast({
        title: 'Failed to resend OTP',
        variant: 'destructive',
      });
    }
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/auth';
  };

  /* ================= UI ================= */

  const toggleStatus = async (coupon: Coupon) => {
    try {
      await api.put(`/api/admin/coupons/${coupon.id}`, {
        ...coupon,
        active: !coupon.active,
        expiryDate: coupon.expiryDate
      });
      loadCoupons();
      toast({
        title: `Coupon ${coupon.active ? 'deactivated' : 'activated'}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              Campo<span className="text-accent">Bite</span>
            </span>
            <Badge variant="secondary" className="ml-2">Admin</Badge>
          </Link>

          <div className="flex items-center gap-3">

            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* TITLE */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor canteen operations
            </p>
          </div>
          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download Report</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadPdf}>
                  Download PDF Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadExcel}>
                  Download Excel Database
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/admin/menu">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <Utensils className="h-4 w-4 mr-2" />
                Manage Menu
              </Button>
              <Button variant="outline" size="icon" className="sm:hidden">
                <Utensils className="h-4 w-4" />
              </Button>
            </Link>
            <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={loadCoupons}>
                  <Ticket className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Coupons</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Manage Coupons</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="flex gap-4 items-end bg-muted/50 p-4 rounded-lg">
                    <div className="grid gap-2 flex-1">
                      <label className="text-sm font-medium">Code</label>
                      <Input
                        placeholder="e.g. SAVE20"
                        value={newCoupon.code}
                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="grid gap-2 w-32">
                      <label className="text-sm font-medium">Discount %</label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={newCoupon.discountPercentage}
                        onChange={e => setNewCoupon({ ...newCoupon, discountPercentage: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2 w-40">
                      <label className="text-sm font-medium">Expiry (Optional)</label>
                      <Input
                        type="date"
                        value={newCoupon.expiryDate}
                        onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                      />
                    </div>
                    <Button onClick={createCoupon}>Create</Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground border-b">
                        <tr>
                          <th className="p-3 font-medium">Code</th>
                          <th className="p-3 font-medium">Discount</th>
                          <th className="p-3 font-medium">Expiry</th>
                          <th className="p-3 font-medium">Status</th>
                          <th className="p-3 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {coupons.map(c => (
                          <tr key={c.id} className="hover:bg-muted/50">
                            <td className="p-3 font-mono font-bold">{c.code}</td>
                            <td className="p-3">{c.discountPercentage}%</td>
                            <td className="p-3">{c.expiryDate || 'No Expiry'}</td>
                            <td className="p-3">
                              <Badge
                                variant={c.active ? 'default' : 'secondary'}
                                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${c.active ? 'bg-success hover:bg-success/90' : 'bg-muted-foreground/30'}`}
                                onClick={() => toggleStatus(c)}
                                title="Click to toggle status"
                              >
                                {c.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCoupon(c.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {coupons.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">No coupons created yet</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
              <DialogTrigger asChild>
                <Button className="gradient-primary" size="sm">
                  <BarChart3 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">View Analytics</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto w-full p-4 sm:p-6">
                <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
                  <DialogTitle>Advanced Analytics</DialogTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Filter by Date:</span>
                    <Input
                      type="date"
                      className="w-auto h-9"
                      value={analyticsDate}
                      onChange={(e) => setAnalyticsDate(e.target.value)}
                    />
                    {analyticsDate && (
                      <Button variant="ghost" size="sm" onClick={() => setAnalyticsDate('')}>
                        Clear
                      </Button>
                    )}
                  </div>
                </DialogHeader>
                <div className="grid gap-6">
                  {/* Demand Analysis */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                          Demand Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-2 sm:px-6">
                        <div className="h-48 sm:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.demandAnalysis.slice(0, 6)} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                              <YAxis
                                dataKey="name"
                                type="category"
                                width={70}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tick={{ fontSize: 9 }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Bar dataKey="orderCount" radius={[0, 4, 4, 0]}>
                                {stats.demandAnalysis.slice(0, 6).map((entry, index) => (
                                  <Cell key={index} fill={demandColors[entry.demand]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-3 sm:mt-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-success" />
                            <span className="text-xs sm:text-sm text-muted-foreground">High</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-warning" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Medium</span>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-destructive" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Low</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sales Trend */}
                    <Card>
                      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 sm:pb-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                          Sales Trend
                        </CardTitle>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                          <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardHeader>
                      <CardContent className="px-2 sm:px-6">
                        <div className="h-48 sm:h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.salesTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={40} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'hsl(var(--card))',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                  fontSize: '12px'
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--accent))"
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--accent))', r: 3 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Hourly Pattern */}
                  <Card>
                    <CardHeader className="pb-2 sm:pb-4">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        Hourly Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                      <div className="h-40 sm:h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.hourlyPattern}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={8} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={30} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                                fontSize: '12px'
                              }}
                            />
                            <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* STATS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Revenue" value={`₹${stats.dailyRevenue}`} icon={IndianRupee} />
          <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingBag} />
          <StatCard title="Peak Hour" value={stats.peakHour} icon={Clock} />
          <StatCard title="Avg Wait Time" value={`${stats.avgWaitTime} min`} icon={TrendingUp} />
        </div>
        {/* QUICK STATS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickStat title="Active Orders" value={stats.activeOrders} icon={ShoppingBag} />
          <QuickStat title="Completed Today" value={stats.completedToday} icon={CheckCircle} />
          <QuickStat title="Weekly Revenue" value={`₹${stats.weeklyRevenue}`} icon={IndianRupee} />
          <QuickStat title="Monthly Revenue" value={`₹${stats.monthlyRevenue}`} icon={Users} />
        </div>

        {/* FEEDBACK SECTION */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Customer Feedback
            </CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
              {userFeedbacks.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10">
                  <Star className="h-4 w-4 text-success fill-success" />
                  <span className="text-sm font-medium text-success">
                    {(userFeedbacks.reduce((sum, f) => sum + f.rating, 0) / userFeedbacks.length).toFixed(1)} Avg Rating
                  </span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowAllFeedbacks(true)}>View All Feedback</Button>
            </div>
          </CardHeader>
          <CardContent>
            {userFeedbacks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No feedback yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userFeedbacks.slice(0, 6).map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">{feedback.customerName}</p>
                        <p className="text-xs text-muted-foreground">Token #{feedback.tokenNumber}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < feedback.rating
                              ? 'text-warning fill-warning'
                              : 'text-muted-foreground'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-foreground mb-3 line-clamp-2">"{feedback.comment}"</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {feedback.foodQuality && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${feedback.foodQuality.toLowerCase() === 'excellent' ? 'bg-success/10 text-success' :
                            feedback.foodQuality.toLowerCase() === 'good' ? 'bg-accent/10 text-accent' :
                              feedback.foodQuality.toLowerCase() === 'average' ? 'bg-warning/10 text-warning' :
                                'bg-destructive/10 text-destructive'
                            }`}
                        >
                          {feedback.foodQuality}
                        </Badge>
                      )}
                      {feedback.deliverySpeed && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${feedback.deliverySpeed.toLowerCase() === 'fast' ? 'bg-success/10 text-success' :
                            feedback.deliverySpeed.toLowerCase() === 'ontime' ? 'bg-accent/10 text-accent' :
                              'bg-destructive/10 text-destructive'
                            }`}
                        >
                          {feedback.deliverySpeed}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {feedback.items && feedback.items.length > 0 ? (
                          <>
                            {feedback.items.slice(0, 2).join(', ')}
                            {feedback.items.length > 2 && ` +${feedback.items.length - 2}`}
                          </>
                        ) : 'Order details'}
                      </p>
                      {feedback.wouldRecommend ? (
                        <div className="flex items-center gap-1 text-success">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span className="text-xs">Recommends</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-destructive">
                          <ThumbsDown className="h-3.5 w-3.5" />
                          <span className="text-xs">Not satisfied</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Dialog open={showAllFeedbacks} onOpenChange={setShowAllFeedbacks}>
              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto w-full p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>All Customer Feedback</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  {userFeedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground">{feedback.customerName}</p>
                          <p className="text-xs text-muted-foreground">Token #{feedback.tokenNumber} • {new Date(feedback.createdAt || Date.now()).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < feedback.rating
                                ? 'text-warning fill-warning'
                                : 'text-muted-foreground'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-foreground mb-3">"{feedback.comment}"</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {feedback.foodQuality && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${feedback.foodQuality.toLowerCase() === 'excellent' ? 'bg-success/10 text-success' :
                              feedback.foodQuality.toLowerCase() === 'good' ? 'bg-accent/10 text-accent' :
                                feedback.foodQuality.toLowerCase() === 'average' ? 'bg-warning/10 text-warning' :
                                  'bg-destructive/10 text-destructive'
                              }`}
                          >
                            {feedback.foodQuality}
                          </Badge>
                        )}
                        {feedback.deliverySpeed && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${feedback.deliverySpeed.toLowerCase() === 'fast' ? 'bg-success/10 text-success' :
                              feedback.deliverySpeed.toLowerCase() === 'ontime' ? 'bg-accent/10 text-accent' :
                                'bg-destructive/10 text-destructive'
                              }`}
                          >
                            {feedback.deliverySpeed}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          {feedback.items && feedback.items.length > 0 ? (
                            <>
                              {feedback.items.join(', ')}
                            </>
                          ) : 'Order details'}
                        </p>
                        {feedback.wouldRecommend ? (
                          <div className="flex items-center gap-1 text-success">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span className="text-xs">Recommends</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-destructive">
                            <ThumbsDown className="h-3.5 w-3.5" />
                            <span className="text-xs">Not satisfied</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* USER QUERIES SECTION */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              User Queries
            </CardTitle>
            <div className="flex items-center gap-4">
              {userQueries.filter(q => !q.replied).length > 0 && (
                <Badge variant="destructive">
                  {userQueries.filter(q => !q.replied).length} Pending
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowAllQueries(true)}>View All Queries</Button>
            </div>
          </CardHeader>
          <CardContent>
            {userQueries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No queries yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {userQueries.slice(0, 4).map((query) => (
                  <div key={query.id} className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-foreground">{query.userName || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{query.userEmail}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(query.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge variant={query.replied ? "secondary" : "default"} className={query.replied ? "bg-success/10 text-success" : ""}>
                        {query.replied ? "Replied" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mb-3">"{query.queryText}"</p>
                    {!query.replied && (
                      <Button size="sm" variant="outline" onClick={() => setReplyQueryId(query.id)}>Reply</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* All Queries Dialog */}
            <Dialog open={showAllQueries} onOpenChange={setShowAllQueries}>
              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto w-full p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>All User Queries</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  {userQueries.map((query) => (
                    <div key={query.id} className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground">{query.userName || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">{query.userEmail}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(query.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge variant={query.replied ? "secondary" : "default"}>
                          {query.replied ? "Replied" : "Pending"}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-3">"{query.queryText}"</p>
                      {query.replyText && (
                        <div className="mt-2 pt-2 border-t border-border/50 text-sm">
                          <span className="font-semibold text-muted-foreground">Admin Reply:</span>
                          <p className="text-foreground/90">{query.replyText}</p>
                        </div>
                      )}
                      {!query.replied && (
                        <div className="mt-2">
                          <Button size="sm" onClick={() => setReplyQueryId(query.id)}>Reply</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Global Reply Dialog */}
            <Dialog open={replyQueryId !== null} onOpenChange={(open) => {
              if (!open) setReplyQueryId(null);
            }}>
              <DialogContent className="max-w-[95vw] sm:max-w-lg w-full p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>Reply to Query</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="p-3 bg-muted rounded-md text-sm">
                    Original Query: "{userQueries.find(q => q.id === replyQueryId)?.queryText}"
                  </div>
                  <Textarea
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={5}
                  />
                  <div className="flex justify-end gap-2 text-sm text-muted-foreground">
                    This will send an email to the user.
                  </div>
                  <Button onClick={handleReplySubmit} disabled={!replyText.trim() || isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Reply"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>



        {/* OTP VERIFICATION DIALOG */}
        <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Verify Order Pickup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Ask the customer for the OTP displayed on their dashboard or email.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter 4-Digit OTP</label>
                <Input
                  value={verificationOtp}
                  onChange={(e) => setVerificationOtp(e.target.value)}
                  placeholder="e.g. 1234"
                  maxLength={4}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <Button
                className="w-full gradient-primary"
                onClick={verifyOrderOtp}
                disabled={verificationOtp.length < 4}
              >
                Verify & Complete Order
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => selectedOrderId && resendOtp(selectedOrderId)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resend OTP
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* LIVE ORDERS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Live Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length === 0 && (
              <p className="text-muted-foreground text-sm">No active orders</p>
            )}

            {orders.map(order => {
              const itemsList = order.itemNames || (order.items
                ? order.items.map((i: any) => `${i.name || i.menuItemName || i.menuItem?.name || 'Item'} x${i.quantity}`).join(', ')
                : order.itemsSummary);

              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 gap-4 group"
                >
                  <div>
                    <div>
                      <p className="font-semibold">Token #{order.tokenNumber}</p>
                      <p className="text-sm text-foreground/80">{itemsList}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.customerName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-semibold">₹{order.totalAmount}</span>

                    {order.status === 'ORDERED' && (
                      <Button size="sm" onClick={() =>
                        updateOrderStatus(order.id, 'PREPARING')
                      }>
                        Start
                      </Button>
                    )}

                    {order.status === 'PREPARING' && (
                      <Button size="sm" variant="outline" onClick={() =>
                        updateOrderStatus(order.id, 'READY')
                      }>
                        Mark Ready
                      </Button>
                    )}

                    {order.status === 'READY' && (
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90"
                        onClick={() =>
                          updateOrderStatus(order.id, 'COMPLETED')
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}

                    {order.status === 'COMPLETED' && (
                      <Badge variant="secondary">Done</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>


      </div>
    </div >
  );
}

/* ================= REUSABLE ================= */

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <div className={`p-5 rounded-2xl flex items-center gap-5 shadow-sm border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${title === 'Today\'s Revenue' ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20' : 'bg-card border-border/60 hover:border-border'}`}>
      <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${title === 'Today\'s Revenue' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
      </div>
      <div>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">{title}</p>
        <h3 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</h3>
      </div>
    </div>
  );
}

function QuickStat({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-between transition-all duration-300 hover:bg-muted/40 hover:border-border group">
      <div>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{title}</p>
        <p className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">{value}</p>
      </div>
      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-background flex items-center justify-center border border-border/60 shadow-sm group-hover:scale-110 transition-transform">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}
