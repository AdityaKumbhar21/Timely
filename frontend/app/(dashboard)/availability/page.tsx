'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { eventTypeApi } from '@/lib/api';
import { EventType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { 
  Clock, 
  Loader2, 
  ArrowLeft, 
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Save,
  CalendarRange,
} from 'lucide-react';
import Link from 'next/link';
import { format, addDays, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

type WeekAvailability = {
  [key: number]: DayAvailability;
};

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
});

const defaultAvailability: WeekAvailability = {
  1: { enabled: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
  2: { enabled: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
  3: { enabled: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
  4: { enabled: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
  5: { enabled: true, slots: [{ startTime: '09:00', endTime: '17:00' }] },
  6: { enabled: false, slots: [] },
  7: { enabled: false, slots: [] },
};

export default function AvailabilityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventTypeId = searchParams.get('eventTypeId');
  const isNewEvent = searchParams.get('new') === 'true';
  const queryClient = useQueryClient();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [availability, setAvailability] = useState<WeekAvailability>(defaultAvailability);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableFrom, setAvailableFrom] = useState<Date | undefined>(undefined);
  const [availableTo, setAvailableTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, router]);

  // Fetch event types to allow selection
  const { data: eventTypes, isLoading: loadingEventTypes } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const response = await eventTypeApi.getAll();
      return response.data.eventTypes as EventType[];
    },
    enabled: isAuthenticated,
  });

  // Fetch availability rules for selected event type
  const { data: rules, isLoading: loadingRules } = useQuery({
    queryKey: ['availabilityRules', eventTypeId],
    queryFn: async () => {
      const response = await eventTypeApi.getAvailabilityRules(eventTypeId!);
      return response.data.availabilityRules;
    },
    enabled: isAuthenticated && !!eventTypeId,
  });

  // Update availability when rules are fetched
  useEffect(() => {
    if (rules && rules.length > 0) {
      const newAvailability: WeekAvailability = { ...defaultAvailability };
      
      // Reset all days
      for (let i = 1; i <= 7; i++) {
        newAvailability[i] = { enabled: false, slots: [] };
      }
      
      // Group rules by day
      rules.forEach((rule: { dayOfWeek: number; startTime: string; endTime: string }) => {
        if (!newAvailability[rule.dayOfWeek]) {
          newAvailability[rule.dayOfWeek] = { enabled: true, slots: [] };
        }
        newAvailability[rule.dayOfWeek].enabled = true;
        newAvailability[rule.dayOfWeek].slots.push({
          startTime: rule.startTime,
          endTime: rule.endTime,
        });
      });
      
      setAvailability(newAvailability);
    } else if (eventTypeId && rules?.length === 0) {
      // New event type with no rules - set default availability
      setAvailability(defaultAvailability);
    }
  }, [rules, eventTypeId]);

  const selectedEventType = eventTypes?.find(et => et.id === eventTypeId);

  // Load date range from selected event type
  useEffect(() => {
    if (selectedEventType) {
      if (selectedEventType.availableFrom) {
        setAvailableFrom(new Date(selectedEventType.availableFrom));
      } else {
        // Default to today
        setAvailableFrom(new Date());
      }
      if (selectedEventType.availableTo) {
        setAvailableTo(new Date(selectedEventType.availableTo));
      } else {
        // Default to 3 months from now
        setAvailableTo(addMonths(new Date(), 3));
      }
    }
  }, [selectedEventType]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!eventTypeId) throw new Error('No event type selected');
      
      const rulesArray: { dayOfWeek: number; startTime: string; endTime: string }[] = [];
      
      Object.entries(availability).forEach(([day, dayData]) => {
        if (dayData.enabled && dayData.slots.length > 0) {
          dayData.slots.forEach(slot => {
            rulesArray.push({
              dayOfWeek: parseInt(day),
              startTime: slot.startTime,
              endTime: slot.endTime,
            });
          });
        }
      });
      
      // Save both availability rules and date range
      await eventTypeApi.setAvailabilityRules(eventTypeId, rulesArray);
      
      // Update event type with date range
      return eventTypeApi.update(eventTypeId, {
        availableFrom: availableFrom?.toISOString(),
        availableTo: availableTo?.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availabilityRules', eventTypeId] });
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
      toast.success('Availability saved successfully!');
      setHasChanges(false);
      
      if (isNewEvent) {
        router.push('/event-types');
      }
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to save availability');
    },
  });

  const toggleDay = (day: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? [{ startTime: '09:00', endTime: '17:00' }] : [],
      },
    }));
    setHasChanges(true);
  };

  const updateSlot = (day: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, idx) =>
          idx === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
    setHasChanges(true);
  };

  const addSlot = (day: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { startTime: '09:00', endTime: '17:00' }],
      },
    }));
    setHasChanges(true);
  };

  const removeSlot = (day: number, slotIndex: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, idx) => idx !== slotIndex),
      },
    }));
    setHasChanges(true);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/event-types" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Event Types
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-violet-500/20">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNewEvent ? 'Set Your Availability' : 'Availability Settings'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isNewEvent 
                  ? 'Define when people can book meetings with you'
                  : 'Manage your weekly availability schedule'}
              </p>
            </div>
          </div>
        </div>

        {/* Event Type Selection */}
        {!eventTypeId && eventTypes && eventTypes.length > 0 && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Select Event Type</CardTitle>
              <CardDescription>
                Choose which event type you want to configure availability for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => router.push(`/availability?eventTypeId=${value}`)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select an event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((et) => (
                    <SelectItem key={et.id} value={et.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: et.color }}
                        />
                        {et.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {eventTypeId && (
          <>
            {/* Selected Event Type Info */}
            {selectedEventType && (
              <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-violet-50 to-indigo-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-inner" 
                      style={{ backgroundColor: selectedEventType.color }}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{selectedEventType.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEventType.durationMinutes} minutes • {selectedEventType.locationType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date Range Selection */}
            <Card className="mb-6 border-0 shadow-xl">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarRange className="h-5 w-5 text-violet-600" />
                  Availability Window
                </CardTitle>
                <CardDescription>
                  Set the date range during which people can book meetings with you
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium">Available From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12",
                            !availableFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {availableFrom ? format(availableFrom, "PPP") : <span>Pick a start date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={availableFrom}
                          onSelect={(date) => {
                            setAvailableFrom(date);
                            setHasChanges(true);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium">Available Until</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12",
                            !availableTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {availableTo ? format(availableTo, "PPP") : <span>Pick an end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={availableTo}
                          onSelect={(date) => {
                            setAvailableTo(date);
                            setHasChanges(true);
                          }}
                          disabled={(date) => 
                            date < (availableFrom || new Date(new Date().setHours(0, 0, 0, 0)))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {availableFrom && availableTo && (
                  <div className="mt-4 p-3 bg-violet-50 rounded-lg border border-violet-200">
                    <p className="text-sm text-violet-700">
                      <span className="font-medium">Booking window:</span> People can book meetings between{' '}
                      <span className="font-semibold">{format(availableFrom, "MMM d, yyyy")}</span> and{' '}
                      <span className="font-semibold">{format(availableTo, "MMM d, yyyy")}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability Schedule */}
            <Card className="border-0 shadow-xl">
              <CardHeader className="border-b bg-gray-50/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-violet-600" />
                  Weekly Schedule
                </CardTitle>
                <CardDescription>
                  Set the hours you&apos;re available for each day of the week
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingRules ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <div 
                        key={day} 
                        className={`rounded-xl border p-4 transition-all ${
                          availability[day]?.enabled 
                            ? 'border-violet-200 bg-violet-50/50' 
                            : 'border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={availability[day]?.enabled || false}
                              onCheckedChange={() => toggleDay(day)}
                            />
                            <Label className="font-medium text-gray-900 min-w-[100px]">
                              {dayNames[day - 1]}
                            </Label>
                          </div>
                          
                          {availability[day]?.enabled && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSlot(day)}
                              className="text-violet-600 border-violet-200 hover:bg-violet-50"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Time
                            </Button>
                          )}
                        </div>
                        
                        {availability[day]?.enabled && availability[day].slots.length > 0 && (
                          <div className="mt-4 space-y-3 ml-14">
                            {availability[day].slots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="flex items-center gap-3">
                                <Select
                                  value={slot.startTime}
                                  onValueChange={(value) => updateSlot(day, slotIndex, 'startTime', value)}
                                >
                                  <SelectTrigger className="w-32 bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeOptions.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <span className="text-muted-foreground">to</span>
                                
                                <Select
                                  value={slot.endTime}
                                  onValueChange={(value) => updateSlot(day, slotIndex, 'endTime', value)}
                                >
                                  <SelectTrigger className="w-32 bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeOptions.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                {availability[day].slots.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSlot(day, slotIndex)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {!availability[day]?.enabled && (
                          <p className="text-sm text-muted-foreground ml-14 mt-2">
                            Unavailable
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Save Button */}
                <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t">
                  {hasChanges && (
                    <span className="text-sm text-amber-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      Unsaved changes
                    </span>
                  )}
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isNewEvent ? 'Save & Continue' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!eventTypeId && eventTypes && eventTypes.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-violet-100 p-4 rounded-full mb-4">
                <CalendarIcon className="h-8 w-8 text-violet-600" />
              </div>
              <CardTitle className="text-xl mb-2">No Event Types Yet</CardTitle>
              <CardDescription className="text-center mb-4 max-w-md">
                Create an event type first, then you can set up availability for it
              </CardDescription>
              <Link href="/event-types/new">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg">
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
