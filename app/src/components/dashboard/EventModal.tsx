import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Event, EventStatus } from '@/integrations/supabase/types';

interface EventModalProps {
  event?: Event | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTIONS: EventStatus[] = ['Planning', 'Confirmed', 'Completed'];

export default function EventModal({ event, onClose, onSaved }: EventModalProps) {
  const isEdit = !!event;
  const [form, setForm] = useState({
    name: '',
    event_date: '',
    location: '',
    description: '',
    status: 'Planning' as EventStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setForm({
        name: event.name,
        event_date: event.event_date,
        location: event.location ?? '',
        description: event.description ?? '',
        status: event.status as EventStatus,
      });
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      event_date: form.event_date,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      status: form.status,
    };

    let dbError;
    if (isEdit && event) {
      ({ error: dbError } = await supabase
        .from('events')
        .update(payload)
        .eq('id', event.id));
    } else {
      ({ error: dbError } = await supabase.from('events').insert([payload]));
    }

    if (dbError) {
      setError(dbError.message);
    } else {
      onSaved();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-violet-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <Label htmlFor="name" className="text-gray-700 font-semibold mb-1.5 block">
              Event Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Annual Company Retreat"
              required
              className="rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
            />
          </div>

          <div>
            <Label htmlFor="event_date" className="text-gray-700 font-semibold mb-1.5 block">
              Event Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event_date"
              name="event_date"
              type="date"
              value={form.event_date}
              onChange={handleChange}
              required
              className="rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
            />
          </div>

          <div>
            <Label htmlFor="location" className="text-gray-700 font-semibold mb-1.5 block">
              Location
            </Label>
            <Input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="New York, NY"
              className="rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-700 font-semibold mb-1.5 block">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell us about your event..."
              rows={3}
              className="rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400 resize-none"
            />
          </div>

          <div>
            <Label className="text-gray-700 font-semibold mb-1.5 block">Status</Label>
            <Select
              value={form.status}
              onValueChange={(val) => setForm((prev) => ({ ...prev, status: val as EventStatus }))}
            >
              <SelectTrigger className="rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-200"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
