import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { CalendarDays, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-indigo-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-md group-hover:shadow-indigo-300 transition-shadow">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">EventFlow</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/#pricing" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Pricing
            </a>
            <a href="/#contact" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
              Contact
            </a>
            {user ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="gradient-primary text-white shadow-md hover:shadow-indigo-300 hover:opacity-90 transition-all"
              >
                Sign Up / Log In
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-indigo-100 px-4 py-4 flex flex-col gap-3">
          <a
            href="/#pricing"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 py-2"
            onClick={() => setMenuOpen(false)}
          >
            Pricing
          </a>
          <a
            href="/#contact"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 py-2"
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </a>
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}
                className="justify-start text-indigo-600 hover:bg-indigo-50"
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="justify-start border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => { navigate('/auth'); setMenuOpen(false); }}
              className="gradient-primary text-white"
            >
              Sign Up / Log In
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
