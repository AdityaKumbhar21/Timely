'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { eventTypeApi, bookingApi } from '@/lib/api';
import { EventType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Copy, 
  ExternalLink,
  Video,
  MapPin,
  Phone,
  Settings,
  Loader2,
  Users,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const response = await eventTypeApi.getAll();
      return response.data.eventTypes as EventType[];
    },
    enabled: isAuthenticated,
  });

  const copyLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/${user?.username}/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const copyProfileLink = () => {
    const link = `${window.location.origin}/${user?.username}`;
    navigator.clipboard.writeText(link);
    toast.success('Profile link copied!');
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'VIRTUAL':
        return <Video className="h-4 w-4" />;
      case 'IN_PERSON':
        return <MapPin className="h-4 w-4" />;
      case 'PHONE':
        return <Phone className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const totalBookings = data?.reduce((acc, et) => acc + (et._count?.bookings || 0), 0) || 0;
  const activeEventTypes = data?.filter(et => et.availabilityRules && et.availabilityRules.length > 0).length || 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-violet-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Here&apos;s an overview of your scheduling activity
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-violet-100">Event Types</p>
                  <p className="text-3xl font-bold mt-1">{data?.length || 0}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">Total Bookings</p>
                  <p className="text-3xl font-bold mt-1">{totalBookings}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-100">Active Events</p>
                  <p className="text-3xl font-bold mt-1">{activeEventTypes}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-xl">
                  <CalendarClock className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group" onClick={copyProfileLink}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Link</p>
                  <p className="text-sm font-medium mt-1 text-violet-600 group-hover:text-violet-700 transition-colors">
                    /{user?.username}
                  </p>
                </div>
                <div className="bg-violet-100 group-hover:bg-violet-200 p-3 rounded-xl transition-colors">
                  <Copy className="h-6 w-6 text-violet-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to copy</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/event-types/new">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-violet-100 group-hover:bg-violet-200 p-3 rounded-xl transition-colors">
                    <Plus className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Event Type</h3>
                    <p className="text-sm text-muted-foreground">Set up a new booking option</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/availability">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 group-hover:bg-emerald-200 p-3 rounded-xl transition-colors">
                    <CalendarClock className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Availability</h3>
                    <p className="text-sm text-muted-foreground">Set your weekly schedule</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Event Types */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Event Types</h2>
          <Link href="/event-types">
            <Button variant="ghost" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4">
            {data.slice(0, 5).map((eventType) => (
              <Card 
                key={eventType.id} 
                className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5"
                onClick={() => router.push(`/event-types/${eventType.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-1.5 h-14 rounded-full transition-all group-hover:w-2" 
                        style={{ backgroundColor: eventType.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-violet-600 transition-colors">{eventType.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="h-3.5 w-3.5" />
                            {eventType.durationMinutes} min
                          </span>
                          <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-0.5 rounded-full">
                            {getLocationIcon(eventType.locationType)}
                            {eventType.locationType.replace('_', ' ')}
                          </span>
                          <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                            {eventType._count?.bookings || 0} bookings
                          </Badge>
                          {eventType.availabilityRules && eventType.availabilityRules.length > 0 && (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-violet-200 text-violet-600 hover:bg-violet-50"
                        onClick={(e) => copyLink(eventType.slug, e)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy link
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        className="border-gray-200"
                        onClick={(e) => { e.stopPropagation(); window.open(`/${user?.username}/${eventType.slug}`, '_blank'); }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-gradient-to-r from-violet-100 to-indigo-100 p-5 rounded-full mb-6">
                <Calendar className="h-10 w-10 text-violet-600" />
              </div>
              <CardTitle className="text-2xl mb-2">No event types yet</CardTitle>
              <CardDescription className="text-center mb-6 max-w-md">
                Create your first event type to start accepting bookings from your clients and colleagues
              </CardDescription>
              <Link href="/event-types/new">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event Type
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
