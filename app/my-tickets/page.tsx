'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Ticket } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency';

export default function MyTicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadTickets();
      }
    }
  }, [user, authLoading, router]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyTickets();
      setTickets(data);
    } catch (error) {
      toast.error('Failed to load tickets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (ticketId: string) => {
    try {
      const blob = await apiClient.downloadTicketPDF(ticketId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Ticket downloaded successfully');
    } catch (error) {
      toast.error('Failed to download ticket');
      console.error(error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'used':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const upcomingTickets = tickets.filter(
    t => t.status === 'confirmed' && t.event && new Date(t.event.start_date) > new Date()
  );

  const pastTickets = tickets.filter(
    t => t.event && new Date(t.event.start_date) <= new Date()
  );

  const renderTicketCard = (ticket: Ticket) => (
    <Card key={ticket.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{ticket.event?.title}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                {ticket.event && formatDate(ticket.event.start_date)}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {ticket.event?.venue}, {ticket.event?.city}
              </div>
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(ticket.status)} className="capitalize">
            {ticket.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Ticket Type</p>
              <p className="font-medium">{ticket.ticket_type?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">{formatAmount(ticket.price)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Ticket Number</p>
            <p className="font-mono text-sm">{ticket.ticket_number}</p>
          </div>

          {ticket.status === 'confirmed' && (
            <div className="flex gap-2">
              {ticket.qr_code_url && (
                <Button variant="outline" className="flex-1" asChild>
                  <a 
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${ticket.qr_code_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    View QR Code
                  </a>
                </Button>
              )}
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleDownloadTicket(ticket.id)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Tickets</h1>
          <div className="flex items-center space-x-2">
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingTickets.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Events ({pastTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">You don&apos;t have any upcoming tickets</p>
                  <Button onClick={() => router.push('/events')}>
                    Browse Events
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingTickets.map(renderTicketCard)
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No past tickets</p>
                </CardContent>
              </Card>
            ) : (
              pastTickets.map(renderTicketCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
