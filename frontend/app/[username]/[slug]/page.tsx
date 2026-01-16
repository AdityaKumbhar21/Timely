'use client';

import { useState, use } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { publicApi, availabilityApi, bookingApi } from '@/lib/api';
import { PublicEventType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Clock, 
  Video, 
  MapPin, 
  Phone, 
  Settings,
  Globe,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Calendar as CalendarIcon
} from 'lucide-react';

interface TimeSlots {
  [date: string]: string[];
}

export default function BookingPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = use(params);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<'calendar' | 'form' | 'confirmed'>('calendar');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [customAnswers, setCustomAnswers] = useState<{ [key: string]: string }>({});

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { data: eventTypeData, isLoading: isLoadingEvent, error } = useQuery({
    queryKey: ['publicEventType', username, slug],
    queryFn: async () => {
      const response = await publicApi.getEventType(username, slug);
      return response.data.eventType as PublicEventType;
    },
  });

  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['availability', eventTypeData?.id, selectedDate],
    queryFn: async () => {
      if (!eventTypeData?.id || !selectedDate) return {};
      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(addDays(selectedDate, 30)), 'yyyy-MM-dd');
      const response = await availabilityApi.getSlots(eventTypeData.id, startDate, endDate, timezone);
      return response.data.slots as TimeSlots;
    },
    enabled: !!eventTypeData?.id && !!selectedDate,
  });

  // Also fetch for initial month
  const { data: initialSlots } = useQuery({
    queryKey: ['availability', eventTypeData?.id, 'initial'],
    queryFn: async () => {
      if (!eventTypeData?.id) return {};
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(addDays(today, 60), 'yyyy-MM-dd');
      const response = await availabilityApi.getSlots(eventTypeData.id, startDate, endDate, timezone);
      return response.data.slots as TimeSlots;
    },
    enabled: !!eventTypeData?.id,
  });

  const allSlots = { ...initialSlots, ...slotsData };

  const bookingMutation = useMutation({
    mutationFn: () => {
      if (!eventTypeData || !selectedDate || !selectedTime) {
        throw new Error('Missing booking data');
      }
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startTime = new Date(`${dateStr}T${selectedTime}`).toISOString();
      
      const answers = eventTypeData.customQuestions?.map(q => ({
        questionId: q.id,
        answerText: customAnswers[q.id] || '',
      })).filter(a => a.answerText);

      return bookingApi.create({
        eventTypeId: eventTypeData.id,
        startTime,
        guestName,
        guestEmail,
        guestNotes: guestNotes || undefined,
        status: 'CONFIRMED',
        customAnswers: answers.length > 0 ? answers : undefined,
        timezone,
      });
    },
    onSuccess: () => {
      setStep('confirmed');
      toast.success('Booking confirmed!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to create booking');
    },
  });

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

  const getLocationText = (type: string, details?: string) => {
    switch (type) {
      case 'VIRTUAL':
        return 'Video call';
      case 'IN_PERSON':
        return details || 'In person';
      case 'PHONE':
        return details || 'Phone call';
      default:
        return details || 'Custom location';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const availableDates = Object.keys(allSlots).map(d => new Date(d));

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const timeSlotsForDate = allSlots[selectedDateStr] || [];

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !eventTypeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
              <CalendarIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">
              This booking page doesn&apos;t exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white px-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="pt-8 text-center">
            <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted-foreground mb-6">
              You&apos;re scheduled with {eventTypeData.user.name}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-violet-600" />
                <div>
                  <p className="font-medium">{eventTypeData.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-violet-600" />
                <div>
                  <p className="font-medium">{selectedTime}</p>
                  <p className="text-sm text-muted-foreground">
                    {eventTypeData.durationMinutes} minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getLocationIcon(eventTypeData.locationType)}
                <p className="font-medium">
                  {getLocationText(eventTypeData.locationType, eventTypeData.locationDetails || undefined)}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to {guestEmail}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 overflow-hidden">
          <div className="grid md:grid-cols-[300px,1fr]">
            {/* Sidebar */}
            <div className="bg-gray-50 p-6 border-r">
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                    {getInitials(eventTypeData.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{eventTypeData.user.name}</p>
                  <p className="text-sm text-muted-foreground">@{eventTypeData.user.username}</p>
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-2" style={{ color: eventTypeData.color }}>
                {eventTypeData.title}
              </h1>
              
              {eventTypeData.description && (
                <p className="text-muted-foreground mb-4">
                  {eventTypeData.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{eventTypeData.durationMinutes} minutes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {getLocationIcon(eventTypeData.locationType)}
                  <span>{getLocationText(eventTypeData.locationType, eventTypeData.locationDetails || undefined)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{timezone}</span>
                </div>
              </div>

              {eventTypeData.user.bio && (
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">{eventTypeData.user.bio}</p>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="p-6">
              {step === 'calendar' && (
                <>
                  <h2 className="text-lg font-semibold mb-4">Select a Date & Time</h2>
                  <div className="grid md:grid-cols-[1fr,200px] gap-6">
                    <div>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setSelectedTime(null);
                        }}
                        disabled={(date) => {
                          const dateStr = format(date, 'yyyy-MM-dd');
                          return date < new Date() || !allSlots[dateStr] || allSlots[dateStr].length === 0;
                        }}
                        modifiers={{
                          available: availableDates,
                        }}
                        modifiersStyles={{
                          available: { fontWeight: 'bold' },
                        }}
                        className="rounded-lg border p-3"
                      />
                    </div>

                    {selectedDate && (
                      <div>
                        <h3 className="font-medium mb-3">
                          {format(selectedDate, 'EEE, MMM d')}
                        </h3>
                        {isLoadingSlots ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                          </div>
                        ) : timeSlotsForDate.length > 0 ? (
                          <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                              {timeSlotsForDate.map((time) => (
                                <Button
                                  key={time}
                                  variant={selectedTime === time ? 'default' : 'outline'}
                                  className={`w-full ${selectedTime === time ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                                  onClick={() => setSelectedTime(time)}
                                >
                                  {time}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No available times
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedTime && (
                    <div className="mt-6 flex justify-end">
                      <Button
                        onClick={() => setStep('form')}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                </>
              )}

              {step === 'form' && (
                <>
                  <button
                    onClick={() => setStep('calendar')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <div className="bg-violet-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-4">
                      <CalendarIcon className="h-5 w-5 text-violet-600" />
                      <div>
                        <p className="font-medium">
                          {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedTime} - {eventTypeData.durationMinutes} min
                        </p>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold mb-4">Enter Your Details</h2>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      bookingMutation.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={guestNotes}
                        onChange={(e) => setGuestNotes(e.target.value)}
                        placeholder="Share anything that will help prepare for our meeting..."
                        rows={3}
                      />
                    </div>

                    {eventTypeData.customQuestions?.map((question) => (
                      <div key={question.id} className="space-y-2">
                        <Label htmlFor={question.id}>
                          {question.questionText}
                          {question.isRequired && ' *'}
                        </Label>
                        {question.questionType === 'TEXT' && (
                          <Input
                            id={question.id}
                            value={customAnswers[question.id] || ''}
                            onChange={(e) => setCustomAnswers(prev => ({
                              ...prev,
                              [question.id]: e.target.value
                            }))}
                            required={question.isRequired}
                            className="h-12"
                          />
                        )}
                      </div>
                    ))}

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                      disabled={bookingMutation.isPending || !guestName || !guestEmail}
                    >
                      {bookingMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Confirming...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
