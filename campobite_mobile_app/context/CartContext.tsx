import React, { createContext, useContext, useState } from "react";

export interface MenuItem {
    id: number;
    name: string;
    description: string;
    price: number;
    category: string;
    available: boolean;
    preparationTime: number;
    stockQuantity: number;
    imageUrl: string | null;
}

export interface CartItem {
    menuItem: MenuItem;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (menuItem: MenuItem) => void;
    removeItem: (menuItemId: number) => void;
    updateQuantity: (menuItemId: number, delta: number) => void;
    clearCart: () => void;
    totalAmount: number;
    totalItems: number;
}

const CartContext = createContext<CartContextType>({
    items: [],
    addItem: () => { },
    removeItem: () => { },
    updateQuantity: () => { },
    clearCart: () => { },
    totalAmount: 0,
    totalItems: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addItem = (menuItem: MenuItem) => {
        setItems((prev) => {
            const existing = prev.find((ci) => ci.menuItem.id === menuItem.id);
            if (existing) {
                return prev.map((ci) =>
                    ci.menuItem.id === menuItem.id
                        ? { ...ci, quantity: ci.quantity + 1 }
                        : ci
                );
            }
            return [...prev, { menuItem, quantity: 1 }];
        });
    };

    const removeItem = (menuItemId: number) => {
        setItems((prev) => prev.filter((ci) => ci.menuItem.id !== menuItemId));
    };

    const updateQuantity = (menuItemId: number, delta: number) => {
        setItems((prev) =>
            prev
                .map((ci) =>
                    ci.menuItem.id === menuItemId
                        ? { ...ci, quantity: Math.max(0, ci.quantity + delta) }
                        : ci
                )
                .filter((ci) => ci.quantity > 0)
        );
    };

    const clearCart = () => setItems([]);

    const totalAmount = items.reduce(
        (sum, ci) => sum + ci.menuItem.price * ci.quantity,
        0
    );

    const totalItems = items.reduce((sum, ci) => sum + ci.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalAmount,
                totalItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
