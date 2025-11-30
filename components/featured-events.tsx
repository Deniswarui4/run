'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Event } from '@/lib/types';
import { useCurrency } from '@/lib/currency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Calendar, MapPin, Star, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

export function FeaturedEvents() {
  const { formatAmount } = useCurrency();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedEvents();
  }, []);

  const loadFeaturedEvents = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getFeaturedEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load featured events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMinPrice = (event: Event) => {
    if (!event.ticket_types || event.ticket_types.length === 0) return null;
    return Math.min(...event.ticket_types.map(t => t.price));
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null; // Don't show section if no featured events
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="h-6 w-6 text-yellow-500 fill-current" />
            <h2 className="text-3xl font-bold">Featured Events</h2>
            <Star className="h-6 w-6 text-yellow-500 fill-current" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Don&#39;t miss out on these handpicked amazing events happening near you
          </p>
        </div>

        {/* Carousel for larger screens, Grid for smaller */}
        <div className="hidden lg:block">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              skipSnaps: false,
              dragFree: true,
            }}
            className="w-full max-w-7xl mx-auto"
          >
            <CarouselContent>
              {events.map((event) => (
                <CarouselItem key={event.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <FeaturedEventCard 
                      event={event} 
                      formatAmount={formatAmount}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getMinPrice={getMinPrice}
                      isUpcoming={isUpcoming}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Grid for smaller screens */}
        <div className="lg:hidden grid md:grid-cols-2 gap-6">
          {events.slice(0, 4).map((event) => (
            <FeaturedEventCard 
              key={event.id}
              event={event} 
              formatAmount={formatAmount}
              formatDate={formatDate}
              formatTime={formatTime}
              getMinPrice={getMinPrice}
              isUpcoming={isUpcoming}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/events">
            <Button size="lg" variant="outline" className="group">
              View All Events
              <Users className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

interface FeaturedEventCardProps {
  event: Event;
  formatAmount: (amount: number) => string;
  formatDate: (dateString: string) => string;
  formatTime: (dateString: string) => string;
  getMinPrice: (event: Event) => number | null;
  isUpcoming: (dateString: string) => boolean;
}

function FeaturedEventCard({ 
  event, 
  formatAmount, 
  formatDate, 
  formatTime, 
  getMinPrice, 
  isUpcoming 
}: FeaturedEventCardProps) {
  const minPrice = getMinPrice(event);
  const upcoming = isUpcoming(event.start_date);

  return (
    <Link href={`/events/${event.id}`} className="block group">
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 bg-gradient-to-br from-card to-card/80">
        {/* Event Image */}
        <div className="relative h-48 overflow-hidden">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Calendar className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          
          {/* Featured Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-yellow-500 text-yellow-50 border-0 shadow-md">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/90 text-foreground border-0 shadow-md">
              {event.category}
            </Badge>
          </div>

          {/* Status Indicator */}
          {!upcoming && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="destructive" className="border-0 shadow-md">
                <Clock className="h-3 w-3 mr-1" />
                Past Event
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          {/* Event Title */}
          <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{formatDate(event.start_date)} at {formatTime(event.start_date)}</span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{event.venue}, {event.city}</span>
            </div>
          </div>

          {/* Price and CTA */}
          <div className="flex items-center justify-between">
            <div>
              {minPrice !== null ? (
                <div>
                  <span className="text-sm text-muted-foreground">From</span>
                  <p className="font-bold text-lg text-primary">
                    {formatAmount(minPrice)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Price TBA</p>
              )}
            </div>
            
            <Button 
              size="sm" 
              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              disabled={!upcoming}
            >
              {upcoming ? 'Book Now' : 'View Details'}
            </Button>
          </div>

          {/* Event Description Preview */}
          {event.description && (
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
              {event.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
