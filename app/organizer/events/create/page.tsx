'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Category } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // State for form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    venue: '',
    address: '',
    city: '',
    country: '',
    start_date: '',
    end_date: '',
  });

  // New states for date/time components
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState({ hour: '12', minute: '00' });
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState({ hour: '15', minute: '00' });

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    loadCategories();
  }, []);

  // Combine date and time into proper ISO format with local timezone
  useEffect(() => {
    if (startDate) {
      // Create a date object in local timezone
      const dateTime = new Date(`${startDate}T${startTime.hour}:${startTime.minute}:00`);
      // Convert to ISO string (includes timezone offset)
      setFormData(prev => ({ ...prev, start_date: dateTime.toISOString() }));
    }
  }, [startDate, startTime]);

  useEffect(() => {
    if (endDate) {
      // Create a date object in local timezone
      const dateTime = new Date(`${endDate}T${endTime.hour}:${endTime.minute}:00`);
      // Convert to ISO string (includes timezone offset)
      setFormData(prev => ({ ...prev, end_date: dateTime.toISOString() }));
    }
  }, [endDate, endTime]);

  const loadCategories = async () => {
    try {
      const data = await apiClient.getCategories();
      setCategories(data.filter(c => c.is_active));
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
      setError('You must be an organizer to create events');
      return;
    }

    // Validate dates
    if (!formData.start_date || !formData.end_date) {
      setError('Please select both start and end dates and times.');
      return;
    }

    const startDateObj = new Date(formData.start_date);
    const endDateObj = new Date(formData.end_date);
    const now = new Date();

    // Check for invalid dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      setError('Invalid date format. Please use the date picker to select dates.');
      return;
    }

    if (startDateObj >= endDateObj) {
      setError('End date must be after start date');
      return;
    }

    // Allow events that start today or in the future (date-only comparison)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventStart = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());

    if (eventStart < todayStart) {
      setError(`Event cannot start in the past. Start date is ${startDateObj.toLocaleDateString()}, today is ${now.toLocaleDateString()}`);
      return;
    }

    setLoading(true);

    try {
      const event = await apiClient.createEvent(formData);
      toast.success('Event created successfully!');
      router.push(`/organizer/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground mb-8">
            Fill in the details to create your event. You can add tickets and images later.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Provide basic information about your event</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Music Festival 2025"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your event in detail..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    {loadingCategories ? (
                      <div className="h-10 w-full rounded-md border border-input bg-muted animate-pulse" />
                    ) : categories.length > 0 ? (
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.color || '#3B82F6' }}
                                />
                                {cat.icon && <span>{cat.icon}</span>}
                                <span>{cat.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id="category"
                        placeholder="e.g., Music, Conference, Sports"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {categories.length === 0 && !loadingCategories && 'No categories available. Enter manually.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue *</Label>
                    <Input
                      id="venue"
                      placeholder="e.g., Madison Square Garden"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Lagos"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      placeholder="e.g., Nigeria"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Start Date & Time */}
                <div className="space-y-2">
                  <Label>Start Date & Time *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="sm:col-span-3"
                    />
                  </div>
                </div>

                {/* End Date & Time */}
                <div className="space-y-2">
                  <Label>End Date & Time *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="sm:col-span-3"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/organizer')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
