import { useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface ContactProps {
  user: User | null;
}

export default function Contact({ user }: ContactProps) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Record<string, string> = {
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    };

    if (user) {
      payload.user_id = user.id;
    }

    const { error: dbError } = await supabase.from('contact_inquiries').insert([payload]);

    if (dbError) {
      setError('Something went wrong. Please try again.');
    } else {
      setSuccess(true);
      setForm({ name: '', email: '', message: '' });
    }
    setLoading(false);
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side */}
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-violet-200">
              <Mail className="w-3.5 h-3.5" />
              Get in touch
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
              We'd love to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                hear from you
              </span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Have questions about EventFlow? Want to learn more about our plans? Our team is here to help you get started.
            </p>
            <div className="space-y-4">
              {[
                { label: 'Response time', value: 'Within 24 hours' },
                { label: 'Support hours', value: 'Mon–Fri, 9am–6pm EST' },
                { label: 'Email', value: 'hello@eventflow.app' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-gray-500 text-sm">{label}:</span>
                  <span className="text-gray-800 text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side — form */}
          <div className="bg-white rounded-2xl shadow-xl border border-violet-100 p-8">
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Message sent!</h3>
                <p className="text-gray-500">Thanks for reaching out. We'll get back to you soon.</p>
                <Button
                  variant="outline"
                  onClick={() => setSuccess(false)}
                  className="mt-2 border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-semibold mb-1.5 block">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    required
                    className="rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-semibold mb-1.5 block">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    required
                    className="rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400"
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-gray-700 font-semibold mb-1.5 block">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    required
                    rows={5}
                    className="rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-400 resize-none"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-5 font-semibold shadow-lg shadow-violet-200 group"
                >
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
