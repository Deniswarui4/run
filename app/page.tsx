import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { FeaturedEvents } from '@/components/featured-events';
import { Calendar, Ticket, Users, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">
                Discover Amazing Events
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Book tickets for concerts, festivals, conferences, and more. 
                Join thousands of attendees at the best events.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/events">
                  <Button size="lg">Browse Events</Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Events Section */}
        <FeaturedEvents />

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose Runtown?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Wide Selection</h3>
                <p className="text-muted-foreground">
                  Browse thousands of events across multiple categories
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Ticket className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
                <p className="text-muted-foreground">
                  Quick and secure ticket purchasing with instant confirmation
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">For Organizers</h3>
                <p className="text-muted-foreground">
                  Create and manage events with powerful organizer tools
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
                <p className="text-muted-foreground">
                  Safe payments and verified events for peace of mind
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Host Your Event?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join our platform as an organizer and reach thousands of potential attendees
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Become an Organizer
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Runtown. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
