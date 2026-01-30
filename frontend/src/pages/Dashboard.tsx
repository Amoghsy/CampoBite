import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/api/api';
import { Chatbot } from '@/components/chatbot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FeedbackModal } from '@/components/FeedbackModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Utensils,
  ShoppingCart,
  Plus,
  Minus,
  Ticket,
  LogOut,
  User,
  CheckCircle,
  Sparkles,
  MessageSquare,
  Clock,
  Star,
  History,
  Bell,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';
import { getFcmToken } from '@/firebase';
import { listenNotifications } from '@/firebase';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* ================= TYPES ================= */

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'snacks' | 'beverages';
  available: boolean;
  imageUrl: string;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface BackendOrder {
  id: number;
  tokenNumber: number;
  status: 'ORDERED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  itemNames?: string;
  otp?: string;
}

/* ================= CONSTANTS ================= */

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

const steps = [
  { key: 'ORDERED', label: 'Ordered' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY', label: 'Ready' }
] as const;

/* ================= COMPONENTS ================= */

function OrderStatusProgress({ status }: { status: BackendOrder['status'] }) {
  const currentStatusIndex = steps.findIndex(s => s.key === status);
  // data from backend might be 'COMPLETED', handle it:
  const activeIndex = currentStatusIndex === -1 && status === 'COMPLETED' ? steps.length : currentStatusIndex;

  return (
    <div className="flex items-center w-full px-2">
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isCurrent = index === activeIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step Circle */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`
                  relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500
                  ${isCompleted
                    ? 'bg-emerald-500 text-white shadow-soft'
                    : isCurrent
                      ? 'gradient-primary text-white ring-4 ring-emerald-500/20 shadow-glow animate-pulse'
                      : 'bg-muted text-muted-foreground border-2 border-border'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6" />
                ) : (
                  <span className={isCurrent ? "font-bold" : ""}>{index + 1}</span>
                )}
              </div>
              <span
                className={`
                  absolute top-12 md:top-14 text-[10px] md:text-xs font-medium whitespace-nowrap transition-colors duration-300
                  ${isCurrent ? 'text-primary font-semibold' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-muted -mt-4 md:-mt-6">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'w-full bg-emerald-500' : 'w-0'
                    }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | MenuItem['category']>('all');
  const [user, setUser] = useState<{ name: string; email: string; role?: string; usn?: string } | null>(null);
  const [activeOrders, setActiveOrders] = useState<BackendOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<BackendOrder[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<MenuItem[]>([]);
  // Local state for UI order ratings
  const [orderRatings, setOrderRatings] = useState<Record<number, number>>({});

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [lastOrderToken, setLastOrderToken] = useState<string>('');
  const [lastOrderItems, setLastOrderItems] = useState<string[]>([]);
  const [lastOrderId, setLastOrderId] = useState<number>(0);
  const [shownFeedbackForOrderIds, setShownFeedbackForOrderIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('shownFeedbackForOrderIds');
    return saved ? JSON.parse(saved) : [];
  });
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercentage: number } | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  /* ================= HELPERS & HANDLERS ================= */

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const loadDashboardData = useCallback(() => {
    api.get(`/api/dashboard?_t=${Date.now()}`)
      .then(res => {
        if (!res.data.user || res.data.user.name === 'guest' || !res.data.user.name) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '/auth';
          return;
        }
        setUser(res.data.user);
        setActiveOrders(res.data.activeOrders || (res.data.activeOrder ? [res.data.activeOrder] : []));
        setOrderHistory(res.data.orderHistory);
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '/auth';
        }
      });
  }, [navigate]);

  const loadMenu = useCallback(() => {
    api.get('/api/admin/menu')
      .then(res => setMenuItems(res.data))
      .catch((err) => {
        console.error("Failed to load menu", err);
        toast({ title: 'Failed to load menu', variant: 'destructive' });
      });
  }, [toast]);

  const loadRecommended = useCallback(() => {
    api.get('/api/admin/menu/recommended')
      .then(res => setRecommendedItems(res.data))
      .catch(err => console.error("Failed to load recommendations", err));
  }, []);

  const addToCart = (item: MenuItem) => {
    if (!item.available) {
      toast({
        title: 'Item Unavailable',
        description: `${item.name} is currently not available.`,
        variant: 'destructive',
      });
      return;
    }

    setCart(prev => {
      const found = prev.find(i => i.menuItem.id === item.id);
      if (found) {
        return prev.map(i =>
          i.menuItem.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });

    toast({
      title: 'Added to Cart',
      description: `${item.name} added to your cart.`,
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev =>
      prev
        .map(i =>
          i.menuItem.id === id
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter(i => i.quantity > 0)
    );
  };

  const cartTotal = cart.reduce(
    (sum, i) => sum + i.menuItem.price * i.quantity,
    0
  );

  const discountAmount = appliedCoupon
    ? (cartTotal * appliedCoupon.discountPercentage) / 100
    : 0;

  const finalTotal = cartTotal - discountAmount;

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await api.post('/api/coupons/validate', { code: couponCode });
      setAppliedCoupon({
        code: res.data.code,
        discountPercentage: res.data.discountPercentage
      });
      toast({
        title: 'Coupon Applied!',
        description: `You saved ${res.data.discountPercentage}%!`,
      });
    } catch (err: any) {
      setAppliedCoupon(null);

      // Robust error parsing: Backend might send plain string "Invalid ..." or JSON { message: "..." }
      const errorMessage = err.response?.data?.message || err.response?.data || 'Could not apply coupon.';

      toast({
        title: 'Coupon Error', // more generic title covering Expired/Inactive/Invalid
        description: typeof errorMessage === 'string' ? errorMessage : 'Invalid coupon code',
        variant: 'destructive',
      });
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const placeOrder = () => {
    if (!cart.length) return;

    const options = {
      key: RAZORPAY_KEY,
      amount: Math.round(finalTotal * 100), // Razorpay expects paise, integers
      currency: "INR",
      name: "CampoBite",
      description: "Smart Canteen Order",

      handler: async () => {
        try {
          setIsProcessingOrder(true); // Immediate UI feedback
          const itemNames = cart.map((c) => `${c.menuItem.name} x${c.quantity}`).join(", ");
          const res = await api.post("/api/orders", {
            total: finalTotal,
            totalAmount: finalTotal,
            itemNames,
            items: cart.map((c) => ({
              menuItemId: c.menuItem.id,
              quantity: c.quantity,
            })),
            couponCode: appliedCoupon?.code || null
          });

          toast({
            title: "Payment Successful 🎉",
            description: `Token #${res.data.tokenNumber}`,
          });

          setLastOrderToken(res.data.tokenNumber.toString());
          setLastOrderItems(cart.map((c) => `${c.menuItem.name} x${c.quantity}`));
          setLastOrderId(res.data.id);

          setCart([]);
          setAppliedCoupon(null);
          setCouponCode('');
          // Add new order to activeOrders immediately
          setActiveOrders(prev => [res.data, ...prev]);

          // Feedback modal will be triggered by the useEffect observing activeOrders logic

        } catch (err) {
          console.error("ORDER ERROR:", err);
          toast({
            title: "Order failed",
            description: "Unauthorized (JWT missing)",
            variant: "destructive",
          });
        } finally {
          setIsProcessingOrder(false);
        }
      },
    };

    // @ts-expect-error Razorpay is loaded via script tag
    new window.Razorpay(options).open();
  };

  const openFeedback = (order: BackendOrder) => {
    setLastOrderToken(order.tokenNumber.toString());
    const items = order.itemNames ? order.itemNames.split(', ') : [];
    setLastOrderItems(items);
    setLastOrderId(order.id);
    setShowFeedbackModal(true);
  };



  const rateOrder = (orderId: number, rating: number) => {
    setOrderRatings(prev => ({ ...prev, [orderId]: rating }));
    toast({
      title: "Thanks for rating!",
      description: `You rated this order ${rating} stars.`,
    });
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      await api.put(`/api/orders/${orderId}/cancel`);
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully.',
      });
      // Refresh data
      loadDashboardData();
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.response?.data?.message || 'Could not cancel order.',
        variant: 'destructive',
      });
    }
  };

  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter(i => i.category === activeCategory);

  const categories: ('all' | MenuItem['category'])[] = [
    'all', 'breakfast', 'lunch', 'snacks', 'beverages'
  ];

  /* ================= EFFECTS ================= */

  useEffect(() => {
    loadDashboardData();
    loadMenu();
    loadRecommended();

    const interval = setInterval(() => {
      loadDashboardData();
    }, 2000);

    return () => clearInterval(interval);
  }, [loadDashboardData, loadMenu]);

  useEffect(() => {
    const initFCM = async () => {
      const token = await getFcmToken();
      if (token) {
        await api.post("/api/user/fcm-token", { token });
      }
    };
    initFCM();
    listenNotifications();
  }, []);

  // Monitor activeOrders and history for completion to show feedback modal
  useEffect(() => {
    // If we have active orders, we don't necessarily show feedback for them yet unless one JUST finished.
    // Ideally backend tells us "this order just finished".
    // But here we rely on checking if an order IS NOT in activeOrders BUT IS in history and we haven't shown feedback yet.
    // Or simpler: check history. If latest is completed and not shown, show it.

    // Check the most recent order from history
    if (orderHistory.length > 0) {
      const latestHistoryOrder = orderHistory[0]; // expecting sorted (latest first)

      if (latestHistoryOrder.status === 'COMPLETED') {
        // Check if we already showed feedback for this order
        if (!shownFeedbackForOrderIds.includes(latestHistoryOrder.id)) {
          setLastOrderToken(latestHistoryOrder.tokenNumber.toString());
          const items = latestHistoryOrder.itemNames ? latestHistoryOrder.itemNames.split(', ') : [];
          setLastOrderItems(items);
          setLastOrderId(latestHistoryOrder.id);
          setShowFeedbackModal(true);

          // Mark as shown so we don't pop it up again for this session or future sessions
          const newShownIds = [...shownFeedbackForOrderIds, latestHistoryOrder.id];
          setShownFeedbackForOrderIds(newShownIds);
          localStorage.setItem('shownFeedbackForOrderIds', JSON.stringify(newShownIds));
        }
      }
    }
  }, [activeOrders, orderHistory, shownFeedbackForOrderIds]);

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <Utensils className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold">
              Campo<span className="text-accent">Bite</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">


            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                  <Bell className="h-5 w-5" />
                  {activeOrders.length > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Card className="border-0 shadow-none">
                  <CardHeader className="border-b pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Active Order Section */}
                    {activeOrders.length > 0 ? (
                      <div className="max-h-[250px] overflow-y-auto">
                        <div className="p-2 bg-muted/10 text-xs font-semibold text-muted-foreground px-4 border-b">
                          Active Orders
                        </div>
                        {activeOrders.map(order => (
                          <div key={order.id} className="p-4 bg-muted/30 border-b last:border-b-0">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-semibold text-primary">Order #{order.tokenNumber}</span>
                              <Badge className={`
                                    ${order.status === 'READY' ? 'bg-success text-success-foreground' : 'bg-accent text-accent-foreground'} 
                                `}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3 truncate">
                              {order.itemNames || 'Your delicious food'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground border-b">
                        No active orders right now.
                      </div>
                    )}

                    {/* Recent History Section */}
                    {orderHistory.length > 0 && (
                      <div className="max-h-[200px] overflow-y-auto border-t">
                        <div className="p-2 bg-muted/10 text-xs font-semibold text-muted-foreground px-4">
                          Recent Completed
                        </div>
                        {orderHistory.slice(0, 3).map(order => (
                          <div key={order.id} className="p-3 px-4 border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium">Order #{order.tokenNumber}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {order.status}
                              </span>
                              {order.status === 'COMPLETED' && (
                                <CheckCircle className="h-3 w-3 text-success" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>
            <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium hidden md:inline">{user?.name || 'Guest'}</span>
            </Link>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-4 sm:py-8 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="order-1 lg:order-none lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-muted-foreground">Ready to order your favorite campus food?</p>
            </div>

            {/* USN Alert for Students */}
            {user?.role && user.role.toLowerCase() === 'student' && (!user.usn || user.usn.trim() === '') && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-700">Complete your profile</h4>
                    <p className="text-sm text-amber-600/80">Add your USN to ensure smooth order processing.</p>
                  </div>
                </div>
                <Link to="/profile">
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10">
                    Update Now
                  </Button>
                </Link>
              </div>
            )}

            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  Active Orders
                </h3>
                <div className="grid gap-6">
                  {activeOrders.map(activeOrder => (
                    <Card key={activeOrder.id} className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-card animate-in fade-in slide-in-from-bottom-2">
                      <div className="absolute top-0 left-0 w-full h-1 gradient-primary" />
                      <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col gap-6">
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="token-badge text-xl shadow-glow">
                                #{activeOrder.tokenNumber}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-orange-100 text-orange-600 border-orange-200">
                                    {activeOrder.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {activeOrder.itemNames && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {activeOrder.itemNames}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Order Status Progress */}
                          <div className="w-full pb-2">
                            <OrderStatusProgress status={activeOrder.status} />
                          </div>

                          {/* OTP Display */}
                          {activeOrder.status === 'READY' && activeOrder.otp && (
                            <div className="mt-2 p-4 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-xl text-center relative overflow-hidden group">
                              <div className="absolute inset-0 bg-emerald-100/20 group-hover:bg-emerald-100/40 transition-colors" />
                              <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1 relative z-10">
                                Pickup Verification Code
                              </p>
                              <div className="flex items-center justify-center gap-3 relative z-10">
                                {activeOrder.otp.split('').map((digit, i) => (
                                  <span key={i} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm border border-emerald-100 text-2xl font-black text-emerald-600 font-mono">
                                    {digit}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] font-medium text-emerald-600 mt-2 relative z-10 flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3" />
                                Valid for 5 minutes
                              </p>
                            </div>
                          )}

                          {activeOrder.status === 'ORDERED' && (
                            <div className="mt-2 flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelOrder(activeOrder.id)}
                                className="w-full sm:w-auto"
                              >
                                Cancel Order
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {recommendedItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                  Recommended for You
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {recommendedItems.map(item => (
                    <Card key={item.id} className="min-w-[280px] md:min-w-[320px] overflow-hidden flex flex-col bg-card/50 hover:bg-card transition-colors border-accent/20">
                      <div className="h-32 relative overflow-hidden bg-muted">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        {!item.available && (
                          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                            <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold truncate">{item.name}</h4>
                          <span className="font-bold">₹{item.price}</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-auto gradient-primary text-white border-0 shadow-soft hover:shadow-glow transition-all"
                          onClick={() => addToCart(item)}
                          disabled={!item.available}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}


            {/* Tabs */}
            <Tabs defaultValue="menu" className="space-y-6">
              <TabsList className="bg-muted/20 p-1 w-full justify-start overflow-x-auto">
                <TabsTrigger value="menu" className="flex-1 min-w-[100px] md:flex-none data-[state=active]:gradient-primary data-[state=active]:text-white">
                  Menu
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 min-w-[120px] md:flex-none data-[state=active]:gradient-primary data-[state=active]:text-white">
                  Order History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="menu" className="space-y-6">
                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveCategory(cat)}
                      className={`rounded-full transition-all duration-200 capitalize ${activeCategory === cat
                        ? 'gradient-primary border-0 shadow-soft text-white'
                        : 'hover:border-accent/50 hover:bg-accent/5'
                        }`}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  {filteredItems.map(item => (
                    <Card
                      key={item.id}
                      className={`menu-card overflow-hidden h-full flex flex-col ${!item.available ? 'opacity-60 grayscale-[30%]' : ''}`}
                    >
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        {!item.available && (
                          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                            <Badge variant="secondary" className="text-sm px-4 py-1.5 bg-background/90 border-destructive/30 text-destructive">
                              Out of Stock
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3 flex-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-lg truncate">{item.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                          <div>
                            <p className="text-xl font-bold text-foreground">₹{item.price}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item)}
                            disabled={!item.available}
                            className="gradient-primary border-0 shadow-soft hover:shadow-glow transition-all text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="col-span-2 text-center py-12 text-muted-foreground">
                      No items found in this category.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <Card className="shadow-soft">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <History className="h-4 w-4 text-primary" />
                      </div>
                      Your Order History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {orderHistory.map((o) => {
                        const currentRating = orderRatings[o.id] || 0;
                        return (
                          <div key={o.id} className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-4 hover:border-accent/30 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="token-badge-sm">#{o.tokenNumber}</div>
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {o.itemNames || 'Order items'}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {new Date(o.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:block text-right">
                                <p className="text-lg font-bold text-foreground">₹{o.totalAmount}</p>
                                <Badge className="bg-muted text-muted-foreground border-border text-xs mt-1">
                                  {o.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Simple Feedback Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/30">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Rate:</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      className="p-1 hover:scale-110 transition-all"
                                      onClick={() => rateOrder(o.id, star)}
                                    >
                                      <Star
                                        className={`h-4 w-4 ${star <= currentRating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-muted-foreground/30 hover:text-yellow-400'
                                          }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs border-accent/30 text-accent hover:bg-accent/10"
                                onClick={() => openFeedback(o)}
                              >
                                <MessageSquare className="h-3 w-3 mr-1.5" />
                                Detailed Feedback
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                      {orderHistory.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">No past orders found.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1 order-last lg:order-none" id="cart-section">
            <Card className="sticky top-20 sm:top-24 shadow-card border-border/50">
              <CardHeader className="pb-3 sm:pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg gradient-primary flex items-center justify-center shadow-soft">
                    <ShoppingCart className="h-4 w-4 text-white" />
                  </div>
                  Your Cart
                  {cartCount > 0 && (
                    <Badge className="ml-auto gradient-accent border-0 text-white">{cartCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <CartContent
                  cart={cart}
                  isProcessingOrder={isProcessingOrder}
                  updateQuantity={updateQuantity}
                  cartTotal={cartTotal}
                  placeOrder={placeOrder}
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  validateCoupon={validateCoupon}
                  appliedCoupon={appliedCoupon}
                  removeCoupon={removeCoupon}
                  discountAmount={discountAmount}
                  finalTotal={finalTotal}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Chatbot />

      {/* MOBILE STICKY CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border/50 lg:hidden shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-5">
          <Sheet>
            <SheetTrigger asChild>
              <div className="container flex items-center gap-4 cursor-pointer">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{cartCount} Items</p>
                  <p className="text-xl font-bold">₹{cartTotal}</p>
                </div>
                <Button size="lg" className="gradient-primary shadow-soft text-white px-8 font-bold">
                  View Cart
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-soft">
                    <ShoppingCart className="h-4 w-4 text-white" />
                  </div>
                  Your Cart
                </SheetTitle>
              </SheetHeader>
              <div className="h-full pb-10 overflow-y-auto">
                <CartContent
                  cart={cart}
                  isProcessingOrder={isProcessingOrder}
                  updateQuantity={updateQuantity}
                  cartTotal={cartTotal}
                  placeOrder={placeOrder}
                  couponCode={couponCode}
                  setCouponCode={setCouponCode}
                  validateCoupon={validateCoupon}
                  appliedCoupon={appliedCoupon}
                  removeCoupon={removeCoupon}
                  discountAmount={discountAmount}
                  finalTotal={finalTotal}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        orderToken={lastOrderToken}
        orderItems={lastOrderItems}
        orderId={lastOrderId}
      />
    </div >
  );
}

// Extracted Cart Content Component to resolve duplication and nesting issues
function CartContent({
  cart,
  isProcessingOrder,
  updateQuantity,
  cartTotal,
  placeOrder,
  couponCode,
  setCouponCode,
  validateCoupon,
  appliedCoupon,
  removeCoupon,
  discountAmount,
  finalTotal
}: any) {
  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
          <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground">Your cart is empty.</p>
        <p className="text-xs text-muted-foreground mt-1">Add items to start ordering!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
        {cart.map((item: any) => (
          <div key={item.menuItem.id} className="flex gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all duration-300 shadow-sm">
            <img
              src={item.menuItem.imageUrl}
              alt={item.menuItem.name}
              className="h-16 w-16 rounded-lg object-cover bg-muted"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm truncate">{item.menuItem.name}</h4>
                <p className="font-bold text-sm">₹{item.menuItem.price * item.quantity}</p>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 bg-background rounded-lg border border-border/50 p-0.5 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-muted text-accent"
                    onClick={() => updateQuantity(item.menuItem.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-muted text-primary"
                    onClick={() => updateQuantity(item.menuItem.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-4 border-t border-border/50">

        {/* Coupon Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Coupon Code"
            className="h-9"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={!!appliedCoupon}
          />
          {appliedCoupon ? (
            <Button variant="destructive" size="sm" onClick={removeCoupon}>
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={validateCoupon} disabled={!couponCode}>
              Apply
            </Button>
          )}
        </div>

        {appliedCoupon && (
          <div className="text-xs text-success flex items-center gap-1 font-medium bg-success/10 p-2 rounded-lg">
            <Ticket className="h-3 w-3" />
            Coupon "{appliedCoupon.code}" applied! You saved ₹{discountAmount.toFixed(0)}
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₹{cartTotal}</span>
        </div>

        {appliedCoupon && (
          <div className="flex justify-between text-sm text-success font-medium">
            <span>Discount</span>
            <span>- ₹{discountAmount.toFixed(0)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold text-foreground">
          <span>Total</span>
          <span>₹{finalTotal.toFixed(0)}</span>
        </div>
        <Button
          className="w-full gradient-primary shadow-soft hover:shadow-glow transition-all py-6 text-lg font-bold text-white relative overflow-hidden"
          onClick={placeOrder}
          disabled={isProcessingOrder}
        >
          {isProcessingOrder ? (
            <>
              <span className="absolute inset-0 bg-white/20 animate-pulse" />
              Processing...
            </>
          ) : (
            <>
              Place Order
              <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 px-2 py-0.5 rounded text-xs">
                ₹{finalTotal.toFixed(0)}
              </span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}