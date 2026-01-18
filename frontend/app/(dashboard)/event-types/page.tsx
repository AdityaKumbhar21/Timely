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
  Edit,
  CalendarClock,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useState } from 'react';

export default function EventTypesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const copyLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-violet-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Types</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your booking event types
            </p>
          </div>
          <Link href="/event-types/new">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5">
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
              <Card 
                key={eventType.id} 
                className="group hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border-0 shadow-lg bg-white hover:-translate-y-1"
                onClick={() => router.push(`/event-types/${eventType.id}`)}
              >
                <div 
                  className="h-2 transition-all group-hover:h-3" 
                  style={{ backgroundColor: eventType.color }}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="truncate">{eventType.title}</span>
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {eventType.description || 'No description'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/event-types/${eventType.id}`); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/availability?eventTypeId=${eventType.id}`); }}>
                          <CalendarClock className="h-4 w-4 mr-2" />
                          Set Availability
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => copyLink(eventType.slug, e)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`/${user?.username}/${eventType.slug}`, '_blank'); }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(eventType.id); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full">
                      <Clock className="h-3.5 w-3.5" />
                      {eventType.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-full">
                      {getLocationIcon(eventType.locationType)}
                      {eventType.locationType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                        {eventType._count?.bookings || 0} bookings
                      </Badge>
                      {eventType.availabilityRules && eventType.availabilityRules.length > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          <CalendarClock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                      onClick={(e) => copyLink(eventType.slug, e)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
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

        {/* Delete Dialog */}
        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event Type</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this event type? This action cannot be undone and will delete all associated bookings.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
    </div>
  );
}
