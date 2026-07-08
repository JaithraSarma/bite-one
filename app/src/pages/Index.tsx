import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Pricing from '@/components/landing/Pricing';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/landing/Footer';
import Auth from './Auth';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user && !showLanding) {
    return <Auth onBackToHome={() => setShowLanding(true)} />;
  }

  return (
    <div className="min-h-screen font-sans">
      <Navbar user={user} />
      <Hero user={user} />
      <Pricing />
      <Contact user={user} />
      <Footer />
    </div>
  );
}
