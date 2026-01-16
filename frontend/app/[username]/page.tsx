'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { publicApi } from '@/lib/api';
import { EventType } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Video, 
  MapPin, 
  Phone, 
  Loader2,
  Calendar as CalendarIcon,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface UserProfile {
  user: {
    username: string;
    name: string;
    bio?: string;
  };
  eventTypes: EventType[];
}

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);

  const { data, isLoading, error } = useQuery<{ data: UserProfile }>({
    queryKey: ['userProfile', username],
    queryFn: () => publicApi.getUserEventTypes(username),
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLocationIcon = (type: string) => {
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

  const getLocationLabel = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'Video Call';
      case 'IN_PERSON':
        return 'In Person';
      case 'PHONE':
        return 'Phone Call';
      default:
        return 'Video Call';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardContent className="pt-8 text-center">
              <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The user @{username} doesn&apos;t exist or has no public event types.
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  Go Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const profile = data.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* User Header */}
        <div className="text-center mb-8">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarFallback className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-2xl">
              {getInitials(profile.user.name || username)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold mb-1">{profile.user.name}</h1>
          <p className="text-muted-foreground">@{username}</p>
          {profile.user.bio && (
            <p className="text-gray-600 mt-4 max-w-md mx-auto">{profile.user.bio}</p>
          )}
        </div>

        {/* Event Types */}
        <div className="space-y-4">
          {profile.eventTypes.length > 0 ? (
            profile.eventTypes.map((eventType) => (
              <Link key={eventType.id} href={`/${username}/${eventType.slug}`}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-l-4 group" style={{ borderLeftColor: eventType.color || '#7c3aed' }}>
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold group-hover:text-violet-600 transition-colors">
                          {eventType.title}
                        </h3>
                        {eventType.description && (
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {eventType.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{eventType.durationMinutes} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getLocationIcon(eventType.locationType)}
                            <span>{getLocationLabel(eventType.locationType)}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="shadow-xl border-0">
              <CardContent className="py-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No event types available for booking at this time.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <Link href="/" className="text-violet-600 hover:underline font-medium">
              Timely
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
