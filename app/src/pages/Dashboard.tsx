import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap, LogOut, CalendarX, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/integrations/supabase/types';
import EventCard from '@/components/dashboard/EventCard';
import EventModal from '@/components/dashboard/EventModal';
import DeleteConfirmDialog from '@/components/dashboard/DeleteConfirmDialog';
import type { User } from '@supabase/supabase-js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/auth', { replace: true });
      } else {
        setUser(data.session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth', { replace: true });
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error && data) {
      setEvents(data as Event[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user, fetchEvents]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const openCreate = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleModalSaved = () => {
    setModalOpen(false);
    setEditingEvent(null);
    fetchEvents();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    await supabase.from('events').delete().eq('id', deletingEvent.id);
    setDeleteLoading(false);
    setDeletingEvent(null);
    fetchEvents();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Event<span className="text-violet-600">Flow</span>
              </span>
              <div className="hidden sm:flex items-center gap-1.5 ml-2 text-gray-400">
                <span>/</span>
                <div className="flex items-center gap-1.5 text-gray-600 font-medium text-sm">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[180px]">
                  {user.email}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page title + create button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Events</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {events.length === 0
                ? 'No events yet — create your first one!'
                : `${events.length} event${events.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 rounded-xl px-5 py-5 font-semibold self-start sm:self-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Events grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-md h-52 animate-pulse"
              >
                <div className="h-1.5 bg-gray-200 rounded-t-2xl" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center">
              <CalendarX className="w-10 h-10 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">No events yet</h2>
            <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
              You haven't created any events. Click "Create Event" to get started planning your first event.
            </p>
            <Button
              onClick={openCreate}
              className="mt-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-200 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={openEdit}
                onDelete={setDeletingEvent}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {modalOpen && (
        <EventModal
          event={editingEvent}
          onClose={() => { setModalOpen(false); setEditingEvent(null); }}
          onSaved={handleModalSaved}
        />
      )}

      {deletingEvent && (
        <DeleteConfirmDialog
          event={deletingEvent}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingEvent(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
