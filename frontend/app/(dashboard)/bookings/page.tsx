'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { bookingApi } from '@/lib/api';
import { Booking } from '@/lib/types';
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
  Sparkles,
} from 'lucide-react';

export default function BookingsPage() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, isHydrated, router]);

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
        return <Video className="h-4 w-4 text-green-600" />;
      case 'IN_PERSON':
        return <MapPin className="h-4 w-4 text-green-600" />;
      case 'PHONE':
        return <Phone className="h-4 w-4 text-green-600" />;
      default:
        return <Video className="h-4 w-4 text-green-600" />;
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
    <Card className="mb-4 hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{booking.eventType?.title || 'Meeting'}</h3>
              {getStatusBadge(booking.status)}
            </div>
            
            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-violet-100 rounded-md">
                  <Calendar className="h-4 w-4 text-violet-600" />
                </div>
                <span className="font-medium">{format(new Date(booking.startTime), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <span>
                  {format(new Date(booking.startTime), 'h:mm a')} -{' '}
                  {format(new Date(booking.endTime), 'h:mm a')}
                </span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-green-100 rounded-md">
                  {getLocationIcon(booking.eventType?.locationType)}
                </div>
                <span>
                  {booking.eventType?.locationType === 'VIDEO' && 'Video Call'}
                  {booking.eventType?.locationType === 'IN_PERSON' && booking.eventType?.locationDetails}
                  {booking.eventType?.locationType === 'PHONE' && 'Phone Call'}
                  {!booking.eventType?.locationType && 'Video Call'}
                </span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-orange-100 rounded-md">
                  <User className="h-4 w-4 text-orange-600" />
                </div>
                <span>{booking.inviteeName}</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-pink-100 rounded-md">
                  <Mail className="h-4 w-4 text-pink-600" />
                </div>
                <span>{booking.inviteeEmail}</span>
              </div>
            </div>
          </div>
          
          {booking.status === 'CONFIRMED' && booking.eventType?.defaultVideoLink && (
            <div className="flex flex-col gap-2">
              <Button
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
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
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-full mb-4">
        <CalendarX className="h-8 w-8 text-violet-500" />
      </div>
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );

  if (!isHydrated || loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-violet-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm text-gray-500">Loading bookings...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-violet-50/30 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Bookings
              </h1>
            </div>
            <p className="text-gray-500">
              Manage your scheduled meetings and appointments
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchBookings}
            className="border-gray-200 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{upcomingBookings.length}</p>
                  <p className="text-sm text-green-600">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-slate-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-700">{pastBookings.length}</p>
                  <p className="text-sm text-gray-500">Past</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <CalendarX className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{cancelledBookings.length}</p>
                  <p className="text-sm text-red-600">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl">Your Meetings</CardTitle>
            <CardDescription>
              View and manage all your scheduled meetings
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-6 bg-gray-100/80 p-1">
                <TabsTrigger 
                  value="upcoming" 
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm"
                >
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="past"
                  className="data-[state=active]:bg-white data-[state=active]:text-gray-700 data-[state=active]:shadow-sm"
                >
                  Past ({pastBookings.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="cancelled"
                  className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm"
                >
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
  );
}
