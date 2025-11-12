'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Event, OrganizerBalance } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, Plus, TrendingUp, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency';

export default function OrganizerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const [events, setEvents] = useState<Event[]>([]);
  const [balance, setBalance] = useState<OrganizerBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
        router.push('/');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, balanceData] = await Promise.all([
        apiClient.getMyEvents(),
        apiClient.getOrganizerBalance(),
      ]);
      setEvents(eventsData);
      setBalance(balanceData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'pending':
        return 'default';
      case 'approved':
        return 'outline';
      case 'published':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const filterEventsByStatus = (status: string) => {
    return events.filter(e => e.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Organizer Dashboard</h1>
          <Link href="/organizer/events/create">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balance ? formatAmount(balance.total_earnings) : formatAmount(0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balance ? formatAmount(balance.available_balance) : formatAmount(0)}
              </div>
              <Link href="/organizer/withdrawals">
                <Button variant="link" className="px-0 mt-2">
                  Request Withdrawal
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {filterEventsByStatus('published').length} published
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>My Events</CardTitle>
            <CardDescription>Manage your events and track their status</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({events.length})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({filterEventsByStatus('draft').length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({filterEventsByStatus('pending').length})</TabsTrigger>
                <TabsTrigger value="published">Published ({filterEventsByStatus('published').length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">You haven&apos;t created any events yet</p>
                    <Link href="/organizer/events/create">
                      <Button>Create Your First Event</Button>
                    </Link>
                  </div>
                ) : (
                  events.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-xl">{event.title}</CardTitle>
                            <CardDescription className="mt-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(event.start_date)}
                              </div>
                            </CardDescription>
                          </div>
                          <Badge variant={getStatusColor(event.status)} className="capitalize">
                            {event.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Link href={`/organizer/events/${event.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </Link>
                          {event.status === 'published' && (
                            <Link href={`/events/${event.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                View Public Page
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {['draft', 'pending', 'published'].map((status) => (
                <TabsContent key={status} value={status} className="space-y-4">
                  {filterEventsByStatus(status).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No {status} events</p>
                    </div>
                  ) : (
                    filterEventsByStatus(status).map((event) => (
                      <Card key={event.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-xl">{event.title}</CardTitle>
                              <CardDescription className="mt-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(event.start_date)}
                                </div>
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Link href={`/organizer/events/${event.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                Manage
                              </Button>
                            </Link>
                            {event.status === 'published' && (
                              <Link href={`/events/${event.id}`} className="flex-1">
                                <Button variant="outline" className="w-full">
                                  View Public Page
                                </Button>
                              </Link>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
