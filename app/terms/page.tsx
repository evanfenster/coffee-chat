import Link from 'next/link';
import { TermsOfService } from '@/components/terms-of-service';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <nav className="mb-8">
          <Link 
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to Home
          </Link>
        </nav>
        <div className="max-w-4xl mx-auto">
          <TermsOfService />
        </div>
      </div>
    </div>
  );
} 