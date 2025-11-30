'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Event, TicketType, EventStats } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, Plus, Eye, Edit, Send, Globe, DollarSign, TrendingUp, Ticket, Users, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency';

export default function ManageEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { formatAmount, symbol } = useCurrency();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [ticketForm, setTicketForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    max_per_order: '10',
    sale_start: '',
    sale_end: '',
  });

  // New states for ticket sale date/time
  const [saleStartDate, setSaleStartDate] = useState('');
  const [saleStartTime, setSaleStartTime] = useState({ hour: '09', minute: '00' });
  const [saleEndDate, setSaleEndDate] = useState('');
  const [saleEndTime, setSaleEndTime] = useState({ hour: '23', minute: '00' });

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    if (params.id && user) {
      loadEvent(params.id as string);
    }
  }, [params.id, user]);

  // Combine sale start date and time with local timezone
  useEffect(() => {
    if (saleStartDate) {
      const dateTime = new Date(`${saleStartDate}T${saleStartTime.hour}:${saleStartTime.minute}:00`);
      setTicketForm(prev => ({ ...prev, sale_start: dateTime.toISOString() }));
    }
  }, [saleStartDate, saleStartTime]);

  // Combine sale end date and time with local timezone
  useEffect(() => {
    if (saleEndDate) {
      const dateTime = new Date(`${saleEndDate}T${saleEndTime.hour}:${saleEndTime.minute}:00`);
      setTicketForm(prev => ({ ...prev, sale_end: dateTime.toISOString() }));
    }
  }, [saleEndDate, saleEndTime]);

  const loadEvent = async (id: string) => {
    try {
      setLoading(true);
      const [eventData, statsData] = await Promise.all([
        apiClient.getOrganizerEvent(id), // Use the correct endpoint for organizers
        apiClient.getEventStats(id).catch(() => null),
      ]);
      setEvent(eventData);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load event');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event) return;

    try {
      setImageUploading(true);
      const response = await apiClient.uploadEventImage(event.id, file);
      setEvent({ ...event, image_url: response.image_url });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setImageUploading(false);
    }
  };

  const handleOpenTicketDialog = () => {
    if (event) {
      // Auto-fill sale dates with event dates if not set
      if (!saleStartDate && event.start_date) {
        const startDate = new Date(event.start_date);
        setSaleStartDate(startDate.toISOString().split('T')[0]);
        setSaleStartTime({
          hour: startDate.getHours().toString().padStart(2, '0'),
          minute: startDate.getMinutes().toString().padStart(2, '0')
        });
      }

      if (!saleEndDate && event.end_date) {
        const endDate = new Date(event.end_date);
        setSaleEndDate(endDate.toISOString().split('T')[0]);
        setSaleEndTime({
          hour: endDate.getHours().toString().padStart(2, '0'),
          minute: endDate.getMinutes().toString().padStart(2, '0')
        });
      }
    }
    setTicketDialogOpen(true);
  };

  const handleCreateTicketType = async () => {
    if (!event) return;

    // Validate sale dates are set
    if (!ticketForm.sale_start || !ticketForm.sale_end) {
      toast.error('Please select sale start and end dates');
      return;
    }

    try {
      const ticketData = {
        name: ticketForm.name,
        description: ticketForm.description,
        price: parseFloat(ticketForm.price),
        quantity: parseInt(ticketForm.quantity),
        max_per_order: parseInt(ticketForm.max_per_order),
        sale_start: new Date(ticketForm.sale_start).toISOString(),
        sale_end: new Date(ticketForm.sale_end).toISOString(),
      };

      await apiClient.createTicketType(event.id, ticketData);
      toast.success('Ticket type created successfully!');
      setTicketDialogOpen(false);
      loadEvent(event.id); // Reload to get updated ticket types

      // Reset form
      setTicketForm({
        name: '',
        description: '',
        price: '',
        quantity: '',
        max_per_order: '10',
        sale_start: '',
        sale_end: '',
      });
      setSaleStartDate('');
      setSaleEndDate('');
    } catch (error) {
      toast.error('Failed to create ticket type');
      console.error(error);
    }
  };

  const handleSubmitForReview = async () => {
    if (!event) return;

    try {
      setSubmitting(true);
      await apiClient.submitEventForReview(event.id);
      toast.success('Event submitted for review!');
      loadEvent(event.id);
    } catch (error) {
      toast.error('Failed to submit event');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!event) return;

    try {
      setPublishing(true);
      await apiClient.publishEvent(event.id);
      toast.success('Event published successfully!');
      loadEvent(event.id);
    } catch (error) {
      toast.error('Failed to publish event');
      console.error(error);
    } finally {
      setPublishing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'pending': return 'default';
      case 'approved': return 'outline';
      case 'published': return 'default';
      case 'rejected': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
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
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(event.status)} className="capitalize">
                {event.status}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{formatDate(event.start_date)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {event.status === 'published' && (
              <Button variant="outline" asChild>
                <a href={`/events/${event.id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Page
                </a>
              </Button>
            )}

            {event.status === 'draft' && (
              <Button onClick={handleSubmitForReview} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </Button>
            )}

            {event.status === 'approved' && (
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? 'Publishing...' : 'Publish Event'}
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Event Image */}
            <Card>
              <CardHeader>
                <CardTitle>Event Image</CardTitle>
                <CardDescription>Upload a cover image for your event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {event.image_url ? (
                    <div className="relative h-64 w-full overflow-hidden rounded-lg">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${event.image_url}`}
                        alt={event.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-64 bg-muted flex items-center justify-center rounded-lg">
                      <p className="text-muted-foreground">No image uploaded</p>
                    </div>
                  )}

                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                      className="hidden"
                      id="image-upload"
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button variant="outline" disabled={imageUploading} asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {imageUploading ? 'Uploading...' : 'Upload Image'}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div>
                        <p>{event.venue}</p>
                        <p className="text-sm text-muted-foreground">{event.address}</p>
                        <p className="text-sm text-muted-foreground">{event.city}, {event.country}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Date & Time</h3>
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                      <div>
                        <p>{formatDate(event.start_date)}</p>
                        <p className="text-sm text-muted-foreground">to {formatDate(event.end_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Ticket Types</CardTitle>
                    <CardDescription>Manage your event tickets</CardDescription>
                  </div>
                  <Button onClick={handleOpenTicketDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ticket Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!event.ticket_types || event.ticket_types.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No ticket types created yet</p>
                    <Button onClick={handleOpenTicketDialog}>
                      Create Your First Ticket Type
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {event.ticket_types.map((ticket) => (
                      <Card key={ticket.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{ticket.name}</CardTitle>
                              <CardDescription>{ticket.description}</CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{formatAmount(ticket.price)}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Available</p>
                              <p className="font-medium">{ticket.quantity - ticket.sold} / {ticket.quantity}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Sold</p>
                              <p className="font-medium">{ticket.sold}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Max per order</p>
                              <p className="font-medium">{ticket.max_per_order}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {stats ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total_tickets_sold}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatAmount(stats.total_revenue)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatAmount(stats.net_revenue)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.checked_in_tickets}</div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Statistics will be available once tickets are sold</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Ticket Type Dialog */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Ticket Type</DialogTitle>
            <DialogDescription>Add a new ticket type for your event</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-name">Name *</Label>
                <Input
                  id="ticket-name"
                  placeholder="e.g., General Admission"
                  value={ticketForm.name}
                  onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket-price">Price ({symbol}) *</Label>
                <Input
                  id="ticket-price"
                  type="number"
                  placeholder="5000"
                  value={ticketForm.price}
                  onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-description">Description</Label>
              <Textarea
                id="ticket-description"
                placeholder="Describe this ticket type..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-quantity">Quantity *</Label>
                <Input
                  id="ticket-quantity"
                  type="number"
                  placeholder="100"
                  value={ticketForm.quantity}
                  onChange={(e) => setTicketForm({ ...ticketForm, quantity: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket-max">Max per order</Label>
                <Input
                  id="ticket-max"
                  type="number"
                  placeholder="10"
                  value={ticketForm.max_per_order}
                  onChange={(e) => setTicketForm({ ...ticketForm, max_per_order: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sale starts *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    type="date"
                    value={saleStartDate}
                    onChange={(e) => setSaleStartDate(e.target.value)}
                    required
                    className="sm:col-span-3"
                  />

                </div>
              </div>

              <div className="space-y-2">
                <Label>Sale ends *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    type="date"
                    value={saleEndDate}
                    onChange={(e) => setSaleEndDate(e.target.value)}
                    required
                    className="sm:col-span-3"
                  />

                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicketType}>
              Create Ticket Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
