'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { eventTypeApi } from '@/lib/api';
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
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const response = await eventTypeApi.getAll();
      return response.data.eventTypes as EventType[];
    },
    enabled: isAuthenticated,
  });

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/${user?.username}/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s an overview of your scheduling
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-violet-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event Types</p>
                  <p className="text-2xl font-bold">{data?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">
                    {data?.reduce((acc, et) => acc + (et._count?.bookings || 0), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <ExternalLink className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Link</p>
                  <p className="text-sm font-medium truncate">
                    timely.app/{user?.username}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Types */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Event Types</h2>
          <Link href="/event-types/new">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              New Event Type
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4">
            {data.map((eventType) => (
              <Card key={eventType.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-2 h-12 rounded-full" 
                        style={{ backgroundColor: eventType.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{eventType.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {eventType.durationMinutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            {getLocationIcon(eventType.locationType)}
                            {eventType.locationType.replace('_', ' ')}
                          </span>
                          <Badge variant="secondary">
                            {eventType._count?.bookings || 0} bookings
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(eventType.slug)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy link
                      </Button>
                      <Link href={`/${user?.username}/${eventType.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/event-types/${eventType.id}`}>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="bg-violet-100 p-4 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-violet-600" />
              </div>
              <CardTitle className="text-xl mb-2">No event types yet</CardTitle>
              <CardDescription className="text-center mb-4">
                Create your first event type to start accepting bookings
              </CardDescription>
              <Link href="/event-types/new">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
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
