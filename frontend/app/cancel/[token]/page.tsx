'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { bookingApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  Loader2,
  Calendar,
  ArrowLeft
} from 'lucide-react';

export default function CancelBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const cancelBooking = async () => {
      try {
        const response = await bookingApi.cancel(token);
        setMessage(response.data.message || 'Booking cancelled successfully');
        setStatus('success');
      } catch (error: any) {
        setMessage(error.response?.data?.message || 'Failed to cancel booking');
        setStatus('error');
      }
    };

    cancelBooking();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-12 px-4 flex items-center justify-center">
      <Card className="max-w-md w-full shadow-xl border-0">
        <CardContent className="pt-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-violet-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Cancelling Booking</h1>
              <p className="text-muted-foreground">Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Booking Cancelled</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-100 p-4 rounded-full inline-block mb-4">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Cancellation Failed</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
