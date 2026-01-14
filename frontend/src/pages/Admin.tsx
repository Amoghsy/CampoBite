import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/api/api';
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
} from "@/components/ui/dialog";
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
  salesTrend: { day: string; revenue: number }[];
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
  queryText: string;
  replyText?: string;
  replied: boolean;
  createdAt: string;
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
  const [timeRange, setTimeRange] = useState('weekly');

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

    const interval = setInterval(() => {
      loadStats();
      loadOrders();
      loadFeedbacks();
      loadQueries();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    api.get('/api/admin/dashboard')
      .then(res => {
        const data = res.data || {};
        const normalizedStats: AdminStats = {
          dailyRevenue: data.revenueToday || data.dailyRevenue || 0,
          totalOrders: data.totalOrders || 0,
          peakHour: data.peakHour !== undefined ? `${data.peakHour}:00` : '-',
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
      })
      .catch((err) => {
        console.error("Stats load error:", err);
        toast({
          title: 'Failed to load admin stats',
          variant: 'destructive',
        });
      });
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

  /* ================= LOGOUT ================= */

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/auth';
  };

  /* ================= UI ================= */

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
            <Link to="/admin/menu">
              <Button variant="outline">
                <Utensils className="h-4 w-4 mr-2" />
                Manage Menu
              </Button>
            </Link>
            <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Advanced Analytics</DialogTitle>
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
                              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
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
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                        <p className="font-medium text-foreground">{query.userEmail || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(query.createdAt).toLocaleString()}</p>
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
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>All User Queries</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  {userQueries.map((query) => (
                    <div key={query.id} className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground">{query.userEmail || 'Anonymous'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(query.createdAt).toLocaleString()}</p>
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
              <DialogContent>
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
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-muted/50 gap-4"
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
    </div>
  );
}

/* ================= REUSABLE ================= */

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="p-6 flex justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStat({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
