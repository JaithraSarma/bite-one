import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@supabase/supabase-js';

interface HeroProps {
  user: User | null;
}

export default function Hero({ user }: HeroProps) {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 pt-16">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-violet-200">
          <Star className="w-3.5 h-3.5 fill-violet-500 text-violet-500" />
          Event planning made effortless
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
          Plan events that{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
            people remember
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          EventFlow gives you everything you need to organize, track, and manage your events — from intimate gatherings to large-scale conferences.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Button
            size="lg"
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-200 px-8 py-6 text-base font-semibold rounded-xl group"
          >
            {user ? 'Go to Dashboard' : 'Get Started Free'}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <a href="#pricing">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-violet-200 text-violet-700 hover:bg-violet-50 px-8 py-6 text-base font-semibold rounded-xl"
            >
              View Pricing
            </Button>
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { icon: CalendarCheck, value: '10k+', label: 'Events Planned' },
            { icon: Users, value: '5k+', label: 'Happy Organizers' },
            { icon: Star, value: '4.9★', label: 'Average Rating' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-1">
                <Icon className="w-5 h-5 text-violet-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{value}</span>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
