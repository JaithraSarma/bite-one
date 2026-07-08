import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Event, EventStatus } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  event?: Event | null;
}

export interface EventFormData {
  name: string;
  event_date: string;
  location: string;
  description: string;
  status: EventStatus;
}

const defaultForm: EventFormData = {
  name: '',
  event_date: '',
  location: '',
  description: '',
  status: 'Planning',
};

export default function EventModal({ open, onClose, onSubmit, event }: EventModalProps) {
  const [form, setForm] = useState<EventFormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name,
        event_date: event.event_date,
        location: event.location ?? '',
        description: event.description ?? '',
        status: event.status as EventStatus,
      });
    } else {
      setForm(defaultForm);
    }
    setError('');
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.event_date) {
      setError('Name and date are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold gradient-text">
            {event ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Event Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Annual Company Gala"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border-indigo-100 focus:border-indigo-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="event_date" className="text-sm font-semibold text-gray-700">Date *</Label>
            <Input
              id="event_date"
              type="date"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="rounded-xl border-indigo-100 focus:border-indigo-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm font-semibold text-gray-700">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Grand Ballroom, New York"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="rounded-xl border-indigo-100 focus:border-indigo-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your event..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="rounded-xl border-indigo-100 focus:border-indigo-400 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as EventStatus })}
            >
              <SelectTrigger className="rounded-xl border-indigo-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-gray-200"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl gradient-primary text-white shadow-md hover:opacity-90"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {event ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
