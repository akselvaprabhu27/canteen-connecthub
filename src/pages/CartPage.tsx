import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Minus, Trash2, Heart, ArrowLeft, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface MenuItem {
  _id: string;
  itemName: string;
  price: number;
}

interface CartItem extends MenuItem {
  qty: number;
}

const CartPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const uid = user?._id || user?.id;
  const canteenId = localStorage.getItem(`selectedCanteenId_${uid}`);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [canteenCart, setCanteenCart] = useState<any>(null);
  const [activeCanteenId, setActiveCanteenId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCartDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const authHeaders = { Authorization: `Bearer ${token}` };

        // Fetch user first to get lastSelectedCanteenId if localStorage is empty
        const meRes = await fetch("/api/auth/me", { headers: authHeaders });
        const userData = await meRes.json();
        
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const uid = user._id || user.id;
        
        let targetCanteenId = localStorage.getItem(`selectedCanteenId_${uid}`);
        
        if (!targetCanteenId && userData.lastSelectedCanteenId) {
          targetCanteenId = userData.lastSelectedCanteenId;
          localStorage.setItem(`selectedCanteenId_${uid}`, targetCanteenId);
        }

        if (!targetCanteenId) { setLoading(false); return; }
        setActiveCanteenId(targetCanteenId);

        // Fetch Carts from DB
        const cartRes = await fetch("/api/carts", { headers: authHeaders });
        const allCarts = await cartRes.json();
        
        const response = await fetch(`/api/menu/${targetCanteenId}`);
        const data = await response.json();
        
        if (response.ok) {
          const currentCanteenCart = allCarts[targetCanteenId] || { items: {} };
          setCanteenCart(currentCanteenCart);
          
          const items: CartItem[] = data
            .filter((item: MenuItem) => currentCanteenCart.items && currentCanteenCart.items[item._id] > 0)
            .map((item: MenuItem) => ({
              ...item,
              qty: currentCanteenCart.items[item._id]
            }));
            
          setCartItems(items);
        } else {
          toast.error("Failed to load cart");
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchCartDetails();
  }, [canteenId]);

  const updateQty = (id: string, delta: number) => {
    if (!activeCanteenId || !canteenCart) return;
    
    const next = (canteenCart.items[id] || 0) + delta;
    const updatedItems = { ...canteenCart.items };

    if (next <= 0) {
      delete updatedItems[id];
      setCartItems((prev) => prev.filter((i) => i._id !== id));
    } else {
      updatedItems[id] = next;
      setCartItems((prev) => 
        prev.map((i) => i._id === id ? { ...i, qty: next } : i)
      );
    }
    
    const updatedCart = { ...canteenCart, items: updatedItems };
    setCanteenCart(updatedCart);

    // Sync with DB
    if (Object.keys(updatedItems).length === 0) {
      fetch(`/api/carts/${activeCanteenId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
    } else {
      fetch("/api/carts/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({
          canteenId: activeCanteenId,
          orgId: canteenCart.orgId,
          name: canteenCart.name,
          items: updatedItems
        })
      });
    }
  };

  const removeItem = (id: string) => {
    if (!activeCanteenId || !canteenCart) return;
    
    const updatedItems = { ...canteenCart.items };
    delete updatedItems[id];
    
    const updatedCart = { ...canteenCart, items: updatedItems };
    setCanteenCart(updatedCart);
    setCartItems((prev) => prev.filter((i) => i._id !== id));

    // Sync with DB
    if (Object.keys(updatedItems).length === 0) {
      fetch(`/api/carts/${activeCanteenId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
    } else {
      fetch("/api/carts/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({
          canteenId: activeCanteenId,
          orgId: canteenCart.orgId,
          name: canteenCart.name,
          items: updatedItems
        })
      });
    }
  };

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const proceedToPayment = () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    // These are transient for payment flow, so keeping them for now or using state
    localStorage.setItem("orderTotal", total.toString());
    localStorage.setItem("cartDetails", JSON.stringify(cartItems));
    navigate("/payment");
  };

  const saveToFavorites = () => {
    if (cartItems.length === 0) return;
    if (!canteenCart) return;

    const favorite = {
      canteenId: activeCanteenId,
      canteenName: canteenCart.name,
      orgId: canteenCart.orgId,
      items: canteenCart.items,
      total,
      itemCount: cartItems.length,
      savedAt: new Date().toISOString()
    };

    fetch("/api/favorites/add", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${localStorage.getItem("token")}` 
      },
      body: JSON.stringify(favorite)
    });
    toast.success("Cart added to favorites!");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Your Cart</h1>
            <p className="mt-1 text-sm text-muted-foreground">Checkout items</p>
          </div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Menu
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">Loading cart...</div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Your cart is empty.</div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm animate-fade-in">
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">{item.itemName}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item._id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-muted"><Minus className="h-3 w-3" /></button>
                      <span className="w-5 text-center text-sm font-semibold text-foreground">{item.qty}</span>
                      <button onClick={() => updateQty(item._id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-3 w-3" /></button>
                    </div>
                    <span className="w-16 text-right text-sm font-semibold text-foreground">₹{item.price * item.qty}</span>
                    <button onClick={() => removeItem(item._id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <h3 className="font-bold text-foreground">Order Summary</h3>
                <button 
                  onClick={saveToFavorites}
                  className="flex items-center gap-2 rounded-lg border border-pink-500/20 bg-pink-500/5 px-3 py-1.5 text-xs font-bold text-pink-500 hover:bg-pink-500 hover:text-white transition-all shadow-sm"
                >
                  <Heart className="h-3.5 w-3.5 fill-current" /> Save as Favorite
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>GST (5%)</span><span>₹{tax}</span></div>
                <div className="border-t border-border pt-3 flex justify-between font-semibold text-foreground"><span>Total</span><span>₹{total}</span></div>
              </div>
              <button onClick={proceedToPayment} className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]">
                Proceed to Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;
