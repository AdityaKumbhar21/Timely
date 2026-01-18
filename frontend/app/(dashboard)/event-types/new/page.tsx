'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store';
import { eventTypeApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Video, MapPin, Phone, Settings } from 'lucide-react';
import Link from 'next/link';

const eventTypeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive('Duration must be positive'),
  locationType: z.enum(['IN_PERSON', 'VIRTUAL', 'PHONE', 'CUSTOM']),
  locationDetails: z.string().optional(),
  bufferBeforeMinutes: z.coerce.number().int().min(0).default(0),
  bufferAfterMinutes: z.coerce.number().int().min(0).default(0),
  dailyLimit: z.coerce.number().int().positive().optional().nullable().or(z.literal('')).transform(val => val === '' ? null : val),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
  defaultVideoLink: z.string().url().optional().or(z.literal('')),
});

type EventTypeForm = z.infer<typeof eventTypeSchema>;

const colorOptions = [
  '#3498db', '#9b59b6', '#e74c3c', '#2ecc71', '#f39c12',
  '#1abc9c', '#e91e63', '#673ab7', '#3f51b5', '#00bcd4',
];

const durationOptions = [15, 30, 45, 60, 90, 120];

export default function NewEventTypePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [selectedColor, setSelectedColor] = useState('#3498db');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventTypeForm>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: {
      durationMinutes: 30,
      locationType: 'VIRTUAL',
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      color: '#3498db',
    },
  });

  const locationType = watch('locationType');

  const createMutation = useMutation({
    mutationFn: (data: EventTypeForm) => {
      const payload = {
        ...data,
        dailyLimit: data.dailyLimit || undefined,
        defaultVideoLink: data.defaultVideoLink || undefined,
        locationDetails: data.locationDetails || undefined,
      };
      return eventTypeApi.create(payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
      toast.success('Event type created! Now set your availability.');
      // Redirect to availability page with the new event type ID
      const eventTypeId = response.data.eventType.id;
      router.push(`/availability?eventTypeId=${eventTypeId}&new=true`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create event type');
    },
  });

  const onSubmit = (data: EventTypeForm) => {
    createMutation.mutate(data);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/event-types" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Event Types
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Event Type</CardTitle>
            <CardDescription>
              Set up a new event type for people to book with you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., 30 Minute Meeting"
                  {...register('title')}
                  className="h-12"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this event..."
                  {...register('description')}
                  rows={3}
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration *</Label>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((duration) => (
                    <Button
                      key={duration}
                      type="button"
                      variant={watch('durationMinutes') === duration ? 'default' : 'outline'}
                      className={watch('durationMinutes') === duration ? 'bg-violet-600 hover:bg-violet-700' : ''}
                      onClick={() => setValue('durationMinutes', duration)}
                    >
                      {duration} min
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  placeholder="Custom duration in minutes"
                  {...register('durationMinutes')}
                  className="mt-2"
                />
                {errors.durationMinutes && (
                  <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>
                )}
              </div>

              {/* Location Type */}
              <div className="space-y-2">
                <Label>Location Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'VIRTUAL', label: 'Virtual', icon: Video },
                    { value: 'IN_PERSON', label: 'In Person', icon: MapPin },
                    { value: 'PHONE', label: 'Phone', icon: Phone },
                    { value: 'CUSTOM', label: 'Custom', icon: Settings },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={locationType === option.value ? 'default' : 'outline'}
                      className={`flex flex-col h-20 ${locationType === option.value ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                      onClick={() => setValue('locationType', option.value as EventTypeForm['locationType'])}
                    >
                      <option.icon className="h-5 w-5 mb-1" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Location Details */}
              {locationType === 'IN_PERSON' && (
                <div className="space-y-2">
                  <Label htmlFor="locationDetails">Address</Label>
                  <Input
                    id="locationDetails"
                    placeholder="Enter the meeting location"
                    {...register('locationDetails')}
                  />
                </div>
              )}

              {locationType === 'VIRTUAL' && (
                <div className="space-y-2">
                  <Label htmlFor="defaultVideoLink">Default Video Link</Label>
                  <Input
                    id="defaultVideoLink"
                    placeholder="https://zoom.us/j/..."
                    {...register('defaultVideoLink')}
                  />
                </div>
              )}

              {locationType === 'PHONE' && (
                <div className="space-y-2">
                  <Label htmlFor="locationDetails">Phone Number</Label>
                  <Input
                    id="locationDetails"
                    placeholder="+1 (555) 123-4567"
                    {...register('locationDetails')}
                  />
                </div>
              )}

              {locationType === 'CUSTOM' && (
                <div className="space-y-2">
                  <Label htmlFor="locationDetails">Location Instructions</Label>
                  <Textarea
                    id="locationDetails"
                    placeholder="Provide instructions for how to meet..."
                    {...register('locationDetails')}
                  />
                </div>
              )}

              {/* Buffers */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bufferBeforeMinutes">Buffer Before (minutes)</Label>
                  <Input
                    id="bufferBeforeMinutes"
                    type="number"
                    min="0"
                    {...register('bufferBeforeMinutes')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bufferAfterMinutes">Buffer After (minutes)</Label>
                  <Input
                    id="bufferAfterMinutes"
                    type="number"
                    min="0"
                    {...register('bufferAfterMinutes')}
                  />
                </div>
              </div>

              {/* Daily Limit */}
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">Daily Limit (optional)</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  min="1"
                  placeholder="No limit"
                  {...register('dailyLimit')}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of bookings per day
                </p>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Event Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-10 h-10 rounded-lg transition-transform ${
                        selectedColor === color ? 'ring-2 ring-offset-2 ring-violet-600 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setSelectedColor(color);
                        setValue('color', color);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Event Type'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
