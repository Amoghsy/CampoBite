import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Utensils,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Search,
  LogOut,
  Clock,
  IndianRupee
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/api/api';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'snacks' | 'beverages';
  preparationTime: number;
  available: boolean;
  popular?: boolean;
  imageUrl: string;
  stockQuantity?: number;
}


interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: MenuItem['category'];
  preparationTime: string;
  available: boolean;
  popular: boolean;
  image: string;
}

interface MenuItemFormProps {
  formData: MenuFormData;
  setFormData: Dispatch<SetStateAction<MenuFormData>>;
}

const MenuItemForm = ({ formData, setFormData }: MenuItemFormProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Item Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Masala Dosa"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value as MenuItem['category'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="breakfast">Breakfast</SelectItem>
            <SelectItem value="lunch">Lunch</SelectItem>
            <SelectItem value="snacks">Snacks</SelectItem>
            <SelectItem value="beverages">Beverages</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Describe the menu item..."
        rows={2}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="price">Price (₹) *</Label>
        <div className="relative">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="price"
            type="number"
            className="pl-10"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="prepTime">Prep Time (min) *</Label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="prepTime"
            type="number"
            className="pl-10"
            value={formData.preparationTime}
            onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="image">Image URL</Label>
      <Input
        id="image"
        value={formData.image}
        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
        placeholder="https://..."
      />
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Switch
          id="available"
          checked={formData.available}
          onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
        />
        <Label htmlFor="available">Available</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="popular"
          checked={formData.popular}
          onCheckedChange={(checked) => setFormData({ ...formData, popular: checked })}
        />
        <Label htmlFor="popular">Mark as Popular</Label>
      </div>
    </div>
  </div>
);

export default function MenuManagement() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    description: '',
    price: '',
    category: 'breakfast' as MenuItem['category'],
    preparationTime: '',
    available: true,
    popular: false,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
  });
  const { toast } = useToast();

  const categories = ['all', 'breakfast', 'lunch', 'snacks', 'beverages'];

  // Auth Guard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role?.toLowerCase() !== 'admin') {
      navigate('/auth');
    }
  }, [navigate]);

  // Load Menu Items
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/api/admin/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error("Failed to fetch menu items", error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive"
      });
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'breakfast',
      preparationTime: '',
      available: true,
      popular: false,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    });
    setEditingItem(null);
  };

  const handleAddItem = async () => {
    if (!formData.name || !formData.price || !formData.preparationTime) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const newItem = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      preparationTime: parseInt(formData.preparationTime),
      available: formData.available,
      popular: formData.popular,
      imageUrl: formData.image, // Changed from image to imageUrl to match MenuItem interface
    };

    try {
      const response = await api.post('/api/admin/menu', newItem);
      setMenuItems([...menuItems, response.data]);
      toast({
        title: 'Item Added',
        description: `${formData.name} has been added to the menu.`,
      });
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add menu item",
        variant: "destructive"
      });
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    const updatedItem = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      preparationTime: parseInt(formData.preparationTime),
      available: formData.available,
      popular: formData.popular,
      imageUrl: formData.image,
    };

    try {
      const response = await api.put(`/api/admin/menu/${editingItem.id}`, updatedItem);

      const updatedItems = menuItems.map(item =>
        item.id === editingItem.id ? response.data : item
      );

      setMenuItems(updatedItems);
      toast({
        title: 'Item Updated',
        description: `${formData.name} has been updated.`,
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update menu item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    try {
      await api.delete(`/api/admin/menu/${item.id}`);
      setMenuItems(menuItems.filter(i => i.id !== item.id));
      toast({
        title: 'Item Deleted',
        description: `${item.name} has been removed from the menu.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive"
      });
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const updatedItem = { ...item, available: !item.available };
      // Assuming there's a specific endpoint or just using update
      // If the backend mocks typical behavior, putting the whole object usually works
      await api.put(`/api/admin/menu/${item.id}`, updatedItem);

      const updatedItems = menuItems.map(i =>
        i.id === item.id ? { ...i, available: !i.available } : i
      );
      setMenuItems(updatedItems);
      toast({
        title: item.available ? 'Item Marked Unavailable' : 'Item Available',
        description: `${item.name} is now ${item.available ? 'unavailable' : 'available'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      preparationTime: item.preparationTime.toString(),
      available: item.available,
      popular: item.popular || false,
      image: item.imageUrl,
    });
    setIsEditDialogOpen(true);
  };



  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                Campo<span className="text-accent">Bite</span>
              </span>
              <Badge variant="secondary">Menu</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">

            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Add, edit, and manage your canteen menu items</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
                <DialogDescription>
                  Fill in the details to add a new item to your menu.
                </DialogDescription>
              </DialogHeader>
              <MenuItemForm formData={formData} setFormData={setFormData} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="gradient-primary border-0" onClick={handleAddItem}>
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Menu Item</DialogTitle>
                <DialogDescription>
                  Update the details for {editingItem?.name}
                </DialogDescription>
              </DialogHeader>
              <MenuItemForm formData={formData} setFormData={setFormData} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="gradient-primary border-0" onClick={handleEditItem}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-foreground">{menuItems.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-success">{menuItems.filter(i => i.available).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Unavailable</p>
              <p className="text-2xl font-bold text-destructive">{menuItems.filter(i => !i.available).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Popular Items</p>
              <p className="text-2xl font-bold text-accent">{menuItems.filter(i => i.popular).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className={categoryFilter === cat ? 'gradient-primary border-0' : ''}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Menu Items ({filteredItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden sm:table-cell">Prep Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                            {item.description}
                          </p>
                          {item.popular && (
                            <Badge variant="secondary" className="mt-1 text-xs">Popular</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">₹{item.price}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.preparationTime} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.available}
                          onCheckedChange={() => toggleAvailability(item)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Utensils className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No menu items found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
