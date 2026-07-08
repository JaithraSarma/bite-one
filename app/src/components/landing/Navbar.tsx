import { Link, useNavigate } from 'react-router-dom';
import { Zap, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-violet-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-violet-300 transition-shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Event<span className="text-violet-600">Flow</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#pricing" className="hover:text-violet-600 transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-violet-600 transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-700 hover:text-violet-600 hover:bg-violet-50"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200"
              >
                Sign Up / Log In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
