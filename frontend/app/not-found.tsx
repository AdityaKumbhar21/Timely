'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-violet-50 to-white px-4">
      <Card className="max-w-md w-full shadow-xl border-0">
        <CardContent className="pt-8 text-center">
          <div className="bg-violet-100 p-4 rounded-full inline-block mb-4">
            <FileX className="h-12 w-12 text-violet-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              Go Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
