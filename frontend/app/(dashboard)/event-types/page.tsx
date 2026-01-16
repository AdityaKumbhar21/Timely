'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { eventTypeApi } from '@/lib/api';
import { EventType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function EventTypesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventTypeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
      toast.success('Event type deleted');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete event type');
    },
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Types</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your booking event types
            </p>
          </div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((eventType) => (
              <Card key={eventType.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div 
                  className="h-2" 
                  style={{ backgroundColor: eventType.color }}
                />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{eventType.title}</span>
                    <Badge variant="secondary" className="ml-2">
                      {eventType._count?.bookings || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {eventType.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {eventType.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      {getLocationIcon(eventType.locationType)}
                      {eventType.locationType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyLink(eventType.slug)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Link href={`/${user?.username}/${eventType.slug}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/event-types/${eventType.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Dialog open={deleteId === eventType.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setDeleteId(eventType.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Event Type</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete &quot;{eventType.title}&quot;? This action cannot be undone and will delete all associated bookings.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteId(null)}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => deleteMutation.mutate(eventType.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Delete'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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
