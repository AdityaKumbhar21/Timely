'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { bookingApi } from '@/lib/api';
import { Booking } from '@/lib/types';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, isPast, isFuture, isToday } from 'date-fns';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  User,
  Mail,
  Loader2,
  CalendarX,
  RefreshCw,
} from 'lucide-react';

export default function BookingsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchBookings();
  }, [isAuthenticated, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getMyBookings();
      setBookings(response.data.bookings || []);
    } catch {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'CONFIRMED' && (isFuture(new Date(b.startTime)) || isToday(new Date(b.startTime)))
  );
  const pastBookings = bookings.filter(
    (b) => isPast(new Date(b.startTime)) && !isToday(new Date(b.startTime))
  );
  const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED');

  const getLocationIcon = (type?: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'IN_PERSON':
        return <MapPin className="h-4 w-4" />;
      case 'PHONE':
        return <Phone className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Confirmed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{booking.eventType?.title || 'Meeting'}</h3>
              {getStatusBadge(booking.status)}
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(booking.startTime), 'h:mm a')} -{' '}
                  {format(new Date(booking.endTime), 'h:mm a')}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {getLocationIcon(booking.eventType?.locationType)}
                <span>
                  {booking.eventType?.locationType === 'VIDEO' && 'Video Call'}
                  {booking.eventType?.locationType === 'IN_PERSON' && booking.eventType?.locationDetails}
                  {booking.eventType?.locationType === 'PHONE' && 'Phone Call'}
                  {!booking.eventType?.locationType && 'Video Call'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{booking.inviteeName}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{booking.inviteeEmail}</span>
              </div>
            </div>
          </div>
          
          {booking.status === 'CONFIRMED' && booking.eventType?.defaultVideoLink && (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(booking.eventType?.defaultVideoLink, '_blank')}
              >
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <CalendarX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Bookings</h1>
              <p className="text-muted-foreground">
                Manage your scheduled meetings
              </p>
            </div>
            <Button variant="outline" onClick={fetchBookings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Meetings</CardTitle>
              <CardDescription>
                View and manage all your scheduled meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming">
                <TabsList className="mb-6">
                  <TabsTrigger value="upcoming">
                    Upcoming ({upcomingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="past">
                    Past ({pastBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Cancelled ({cancelledBookings.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                  {upcomingBookings.length > 0 ? (
                    upcomingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))
                  ) : (
                    <EmptyState message="No upcoming bookings" />
                  )}
                </TabsContent>

                <TabsContent value="past">
                  {pastBookings.length > 0 ? (
                    pastBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))
                  ) : (
                    <EmptyState message="No past bookings" />
                  )}
                </TabsContent>

                <TabsContent value="cancelled">
                  {cancelledBookings.length > 0 ? (
                    cancelledBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))
                  ) : (
                    <EmptyState message="No cancelled bookings" />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
