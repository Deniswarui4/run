'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Event, TicketType, CartItem } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, User, Clock, Ticket, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency';
import Image from 'next/image';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartDialogOpen, setCartDialogOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadEvent(params.id as string);
    }
  }, [params.id]);

  const loadEvent = async (id: string) => {
    try {
      setLoading(true);
      const data = await apiClient.getEvent(id);
      setEvent(data);
    } catch (error) {
      toast.error('Failed to load event');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (ticketType: TicketType) => {
    if (!user) {
      toast.error('Please login to purchase tickets');
      router.push('/login');
      return;
    }
    setSelectedTicketType(ticketType);
    setQuantity(1);
    setCartDialogOpen(true);
  };

  const addToCart = () => {
    if (!selectedTicketType) return;

    // Check if ticket type already in cart
    const existingIndex = cart.findIndex(item => item.ticket_type_id === selectedTicketType.id);

    if (existingIndex >= 0) {
      // Update quantity
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      setCart(newCart);
      toast.success(`Updated ${selectedTicketType.name} quantity in cart`);
    } else {
      // Add new item
      setCart([...cart, {
        ticket_type_id: selectedTicketType.id,
        quantity,
        ticket_type: selectedTicketType
      }]);
      toast.success(`Added ${selectedTicketType.name} to cart`);
    }

    setCartDialogOpen(false);
    setSelectedTicketType(null);
  };

  const removeFromCart = (ticket_type_id: string) => {
    setCart(cart.filter(item => item.ticket_type_id !== ticket_type_id));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.ticket_type.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (!event || cart.length === 0) return;

    try {
      setPurchasing(true);
      const response = await apiClient.purchaseTickets({
        event_id: event.id,
        items: cart.map(item => ({
          ticket_type_id: item.ticket_type_id,
          quantity: item.quantity,
        })),
      });

      // Clear cart and redirect to payment URL
      clearCart();
      window.location.href = response.authorization_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
      console.error(error);
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isTicketAvailable = (ticketType: TicketType) => {
    const now = new Date();
    const saleStart = new Date(ticketType.sale_start);
    const saleEnd = new Date(ticketType.sale_end);
    const available = ticketType.quantity - ticketType.sold;

    // Properly compare dates - both are ISO strings so Date constructor handles timezone
    return now >= saleStart && now <= saleEnd && available > 0;
  };

  const getAvailableTickets = (ticketType: TicketType) => {
    return ticketType.quantity - ticketType.sold;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Event not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            {event.image_url ? (
              <div className="relative h-96 w-full overflow-hidden rounded-lg mb-6">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${event.image_url}`}
                  alt={event.title}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="h-96 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-lg mb-6">
                <Calendar className="h-32 w-32 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-base">{event.category}</Badge>
                <Badge variant="outline" className="capitalize">{event.status}</Badge>
              </div>

              <h1 className="text-4xl font-bold">{event.title}</h1>

              <div className="flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  <div>
                    <p className="font-medium">{formatDate(event.start_date)}</p>
                    <p className="text-sm">{formatTime(event.start_date)} - {formatTime(event.end_date)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <div>
                    <p className="font-medium">{event.venue}</p>
                    <p className="text-sm">{event.city}, {event.country}</p>
                  </div>
                </div>

                {event.organizer && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    <div>
                      <p className="font-medium">Organized by</p>
                      <p className="text-sm">{event.organizer.first_name} {event.organizer.last_name}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
              </div>

              {event.address && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Location</h2>
                    <p className="text-muted-foreground">{event.address}</p>
                    <p className="text-muted-foreground">{event.city}, {event.country}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ticket Types Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tickets</CardTitle>
                    <CardDescription>Select your tickets</CardDescription>
                  </div>
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {getCartItemsCount()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!event.ticket_types || event.ticket_types.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No tickets available</p>
                ) : (
                  event.ticket_types.map((ticketType) => {
                    const available = getAvailableTickets(ticketType);
                    const isAvailable = isTicketAvailable(ticketType);

                    return (
                      <Card key={ticketType.id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{ticketType.name}</CardTitle>
                              <CardDescription className="text-sm mt-1">
                                {ticketType.description}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{formatAmount(ticketType.price)}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span className="flex items-center">
                              <Ticket className="h-4 w-4 mr-1" />
                              {available} available
                            </span>
                            <span>Max {ticketType.max_per_order} per order</span>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => handleAddToCart(ticketType)}
                            disabled={!isAvailable}
                          >
                            {isAvailable ? 'Add to Cart' : 'Sold Out'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })
                )}

                {cart.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button className="w-full" size="lg" onClick={handleCheckout} disabled={purchasing}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {purchasing ? 'Processing...' : `Checkout (${formatAmount(getCartTotal())})`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Add to Cart Dialog */}
      <Dialog open={cartDialogOpen} onOpenChange={setCartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
            <DialogDescription>
              {selectedTicketType?.name} - {selectedTicketType ? formatAmount(selectedTicketType.price) : ''} each
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={selectedTicketType?.max_per_order || 10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-muted-foreground">
                Maximum {selectedTicketType?.max_per_order} tickets per order
              </p>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Subtotal:</span>
              <span>{formatAmount((selectedTicketType?.price || 0) * quantity)}</span>
            </div>

            {cart.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Items in Cart ({cart.length})</p>
                  {cart.map((item) => (
                    <div key={item.ticket_type_id} className="flex justify-between items-center text-sm">
                      <span>{item.ticket_type.name} x{item.quantity}</span>
                      <span className="font-medium">{formatAmount(item.ticket_type.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCartDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addToCart}>
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
