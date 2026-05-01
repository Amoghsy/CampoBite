import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/api/api';
import { getFcmToken, listenNotifications } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Utensils,
    LogOut,
    ChefHat,
    CheckCircle,
    Clock,
    Package,
    RefreshCw,
    ShoppingBag,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/* ============================= TYPES ============================= */

type OrderStatus = 'ORDERED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface StaffOrder {
    id: number;
    tokenNumber: number;
    status: OrderStatus;
    totalAmount: number;
    itemNames?: string;
    customerName: string;
    createdAt: string;
    otpExpiry?: string | null;
    paymentStatus?: string;
}

interface MenuItemAvailability {
    id: number;
    name: string;
    category: string;
    available: boolean;
    imageUrl: string;
    unlimited?: boolean;
    remainingQuantity?: number;
    dailyLimit?: number;
}

/* ============================= STATUS CONFIG ============================= */

const STATUS_COLORS: Record<string, string> = {
    ORDERED: 'bg-blue-100 text-blue-700 border-blue-200',
    PREPARING: 'bg-amber-100 text-amber-700 border-amber-200',
    READY: 'bg-green-100 text-green-700 border-green-200',
    COMPLETED: 'bg-gray-100 text-gray-600 border-gray-200',
    CANCELLED: 'bg-red-100 text-red-600 border-red-200',
};

const ACTIVE_STATUSES: OrderStatus[] = ['ORDERED', 'PREPARING', 'READY'];

/* ============================= COMPONENT ============================= */

export default function StaffDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [orders, setOrders] = useState<StaffOrder[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItemAvailability[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'availability'>('orders');
    const [filterStatus, setFilterStatus] = useState<'active' | 'all'>('active');

    // OTP dialog
    const [showOtpDialog, setShowOtpDialog] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [verificationOtp, setVerificationOtp] = useState('');
    const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

    /* ===== AUTH GUARD ===== */
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (!token || !['staff', 'admin'].includes(role?.toLowerCase() ?? '')) {
            navigate('/auth');
        }
    }, [navigate]);

    /* ===== FIREBASE FCM ===== */
    useEffect(() => {
        const initFCM = async () => {
            const token = await getFcmToken();
            if (token) {
                await api.post('/api/user/fcm-token', { token });
            }
        };
        initFCM();
        listenNotifications();
    }, []);

    /* ===== DATA LOADING ===== */
    const loadOrders = useCallback(() => {
        api.get('/api/staff/orders')
            .then(res => {
                const sorted = (res.data || []).sort(
                    (a: StaffOrder, b: StaffOrder) => b.id - a.id
                );
                setOrders(sorted);
            })
            .catch(() => toast({ title: 'Failed to load orders', variant: 'destructive' }));
    }, [toast]);

    const loadMenu = useCallback(() => {
        api.get('/api/staff/menu')
            .then(res => {
                console.log('[Staff] menu loaded:', res.data?.length, 'items');
                setMenuItems(res.data || []);
            })
            .catch((err) => {
                const status = err.response?.status;
                console.error('[Staff] menu error:', status, err.response?.data);
                toast({
                    title: `Menu load failed (${status ?? 'offline'})`,
                    description: status === 401 ? 'Session expired — please log in again' :
                        status === 403 ? 'Access denied' :
                            'Backend may be restarting. Try refreshing.',
                    variant: 'destructive'
                });
            });
    }, [toast]);

    useEffect(() => {
        loadOrders();
        loadMenu();
        // Poll every 5 seconds
        const interval = setInterval(loadOrders, 5000);
        return () => clearInterval(interval);
    }, [loadOrders, loadMenu]);

    /* ===== UPDATE ORDER STATUS ===== */
    const updateStatus = async (orderId: number, status: OrderStatus) => {
        const order = orders.find(o => o.id === orderId);

        // If completing a READY order → show OTP dialog
        if (status === 'COMPLETED' && order?.status === 'READY') {
            setSelectedOrderId(orderId);
            setVerificationOtp('');
            setShowOtpDialog(true);
            return;
        }

        try {
            await api.put(`/api/staff/orders/${orderId}/status`, { status });
            toast({
                title: 'Order updated',
                description: `Order #${order?.tokenNumber} marked as ${status}`,
            });
            loadOrders();
        } catch {
            toast({ title: 'Update failed', variant: 'destructive' });
        }
    };

    /* ===== OTP VERIFY ===== */
    const verifyOtp = async () => {
        if (!selectedOrderId || !verificationOtp) return;
        setIsSubmittingOtp(true);
        try {
            await api.post(`/api/staff/orders/${selectedOrderId}/complete`, {
                otp: verificationOtp,
            });
            toast({ title: 'Order Completed ✅', description: 'OTP verified successfully!' });
            setShowOtpDialog(false);
            setVerificationOtp('');
            loadOrders();
        } catch (err: any) {
            toast({
                title: 'OTP Verification Failed',
                description: err.response?.data || 'Invalid OTP',
                variant: 'destructive',
            });
        } finally {
            setIsSubmittingOtp(false);
        }
    };

    /* ===== RESEND OTP ===== */
    const resendOtp = async (orderId: number) => {
        try {
            await api.post(`/api/staff/orders/${orderId}/resend-otp`);
            toast({ title: 'OTP Resent', description: 'New OTP sent to customer.' });
        } catch {
            toast({ title: 'Failed to resend OTP', variant: 'destructive' });
        }
    };

    /* ===== TOGGLE AVAILABILITY ===== */
    const toggleAvailability = async (item: MenuItemAvailability) => {
        try {
            await api.put(`/api/staff/menu/${item.id}/availability`, {
                available: !item.available,
            });
            setMenuItems(prev =>
                prev.map(i => (i.id === item.id ? { ...i, available: !i.available } : i))
            );
            toast({
                title: item.available ? 'Marked Unavailable' : 'Marked Available',
                description: `${item.name} updated.`,
            });
        } catch {
            toast({ title: 'Failed to update', variant: 'destructive' });
        }
    };

    /* ===== LOGOUT ===== */
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/auth';
    };

    /* ===== DERIVED DATA ===== */
    const displayedOrders =
        filterStatus === 'active'
            ? orders.filter(o => ACTIVE_STATUSES.includes(o.status))
            : orders;

    const activeCount = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;

    /* ===== NEXT ACTION BUTTON ===== */
    const getNextAction = (status: OrderStatus): { label: string; next: OrderStatus } | null => {
        if (status === 'ORDERED') return { label: '👨‍🍳 Mark Preparing', next: 'PREPARING' };
        if (status === 'PREPARING') return { label: '✅ Mark Ready', next: 'READY' };
        if (status === 'READY') return { label: '🎉 Complete Order', next: 'COMPLETED' };
        return null;
    };

    /* ============================= RENDER ============================= */
    return (
        <div className="min-h-screen bg-background">

            {/* ===== HEADER ===== */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
                            <ChefHat className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold">
                                Campo<span className="text-accent">Bite</span>
                            </span>
                            <Badge variant="secondary" className="ml-2">Staff</Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Active order badge */}
                        {activeCount > 0 && (
                            <Badge className="bg-amber-500 text-white animate-pulse">
                                {activeCount} Active
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={loadOrders}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={logout}>
                            <LogOut className="h-4 w-4 mr-1" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container py-6 space-y-6">

                {/* ===== PAGE TITLE ===== */}
                <div>
                    <h1 className="text-2xl font-bold">Staff Dashboard</h1>
                    <p className="text-muted-foreground">Manage incoming orders and item availability</p>
                </div>

                {/* ===== QUICK STATS ===== */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {([
                        { label: 'New Orders', count: orders.filter(o => o.status === 'ORDERED').length, color: 'text-blue-600', icon: ShoppingBag },
                        { label: 'Preparing', count: orders.filter(o => o.status === 'PREPARING').length, color: 'text-amber-600', icon: ChefHat },
                        { label: 'Ready', count: orders.filter(o => o.status === 'READY').length, color: 'text-green-600', icon: CheckCircle },
                        { label: 'Completed', count: orders.filter(o => o.status === 'COMPLETED').length, color: 'text-gray-500', icon: Clock },
                    ] as const).map(({ label, count, color, icon: Icon }) => (
                        <Card key={label}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Icon className={`h-6 w-6 ${color}`} />
                                <div>
                                    <p className="text-xs text-muted-foreground">{label}</p>
                                    <p className={`text-2xl font-bold ${color}`}>{count}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ===== TABS ===== */}
                <div className="flex gap-2 border-b">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'orders'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        📋 Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('availability')}
                        className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'availability'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        🍽️ Availability
                    </button>
                </div>

                {/* ===== ORDERS TAB ===== */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {/* Filter */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant={filterStatus === 'active' ? 'default' : 'outline'}
                                onClick={() => setFilterStatus('active')}
                                className={filterStatus === 'active' ? 'gradient-primary border-0' : ''}
                            >
                                Active Only
                            </Button>
                            <Button
                                size="sm"
                                variant={filterStatus === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilterStatus('all')}
                                className={filterStatus === 'all' ? 'gradient-primary border-0' : ''}
                            >
                                All Orders
                            </Button>
                        </div>

                        {/* Order Cards */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayedOrders.map(order => {
                                const nextAction = getNextAction(order.status);
                                return (
                                    <Card
                                        key={order.id}
                                        className={`relative overflow-hidden ${order.status === 'ORDERED' ? 'border-blue-300 bg-blue-50/30' :
                                            order.status === 'PREPARING' ? 'border-amber-300 bg-amber-50/30' :
                                                order.status === 'READY' ? 'border-green-400 bg-green-50/40 shadow-md' : ''
                                            }`}
                                    >
                                        {/* Top color strip */}
                                        {order.status === 'READY' && (
                                            <div className="absolute top-0 left-0 w-full h-1 bg-green-400" />
                                        )}

                                        <CardContent className="p-4 space-y-3 pt-5">
                                            {/* Token + Status */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                                                        #{order.tokenNumber}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-sm">{order.customerName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(order.createdAt).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className={`text-xs border ${STATUS_COLORS[order.status]}`}>
                                                    {order.status}
                                                </Badge>
                                            </div>

                                            {/* Items */}
                                            {order.itemNames && (
                                                <p className="text-sm text-muted-foreground bg-muted/40 rounded p-2 line-clamp-2">
                                                    {order.itemNames}
                                                </p>
                                            )}

                                            {/* Amount + Payment Status */}
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold">₹{order.totalAmount}</p>
                                                {order.paymentStatus && (
                                                    <Badge className={`text-[10px] px-1.5 py-0 border ${order.paymentStatus === 'CAPTURED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                            order.paymentStatus === 'REFUNDED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                    'bg-amber-100 text-amber-700 border-amber-200'
                                                        }`}>
                                                        {order.paymentStatus === 'CAPTURED' ? '💳 Paid' :
                                                            order.paymentStatus === 'REFUNDED' ? '↩ Refunded' :
                                                                order.paymentStatus === 'FAILED' ? '✗ Failed' :
                                                                    '⏳ Pending'}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                {nextAction && (
                                                    <Button
                                                        size="sm"
                                                        className="w-full gradient-primary border-0 text-white"
                                                        onClick={() => updateStatus(order.id, nextAction.next)}
                                                    >
                                                        {nextAction.label}
                                                    </Button>
                                                )}

                                                {/* Resend OTP for READY orders */}
                                                {order.status === 'READY' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => resendOtp(order.id)}
                                                    >
                                                        🔁 Resend OTP
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {displayedOrders.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-40" />
                                <p>No orders to show</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== AVAILABILITY TAB ===== */}
                {activeTab === 'availability' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Item Availability
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Quickly mark items as available or unavailable for today.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {menuItems.map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-3 gap-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="h-10 w-10 rounded-lg object-cover"
                                            />
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {item.category}
                                                    </Badge>
                                                    {!item.unlimited && item.dailyLimit && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.remainingQuantity}/{item.dailyLimit} left
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium ${item.available ? 'text-green-600' : 'text-red-500'}`}>
                                                {item.available ? 'Available' : 'Unavailable'}
                                            </span>
                                            <Switch
                                                checked={item.available}
                                                onCheckedChange={() => toggleAvailability(item)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {menuItems.length === 0 && (
                                <p className="text-center py-8 text-muted-foreground">No menu items found.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ===== OTP DIALOG ===== */}
            <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Verify Customer OTP</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Ask the customer for their 4-digit OTP to complete the order.
                        </p>
                        <Input
                            placeholder="Enter 4-digit OTP"
                            value={verificationOtp}
                            onChange={e => setVerificationOtp(e.target.value)}
                            maxLength={4}
                            className="text-center text-2xl font-bold tracking-[0.5em]"
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowOtpDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 gradient-primary border-0"
                                onClick={verifyOtp}
                                disabled={verificationOtp.length < 4 || isSubmittingOtp}
                            >
                                {isSubmittingOtp ? 'Verifying...' : 'Complete Order'}
                            </Button>
                        </div>
                        {selectedOrderId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-muted-foreground"
                                onClick={() => {
                                    resendOtp(selectedOrderId);
                                }}
                            >
                                Resend OTP to customer
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
