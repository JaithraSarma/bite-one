import { Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const tiers = [
  {
    name: 'Basic',
    price: 9,
    description: 'Perfect for individuals and small gatherings.',
    color: 'from-slate-500 to-slate-700',
    badge: null,
    features: [
      'Up to 5 events',
      'Basic event tracking',
      'Email support',
      'Event status management',
      'Contact form access',
    ],
  },
  {
    name: 'Pro',
    price: 29,
    description: 'For active organizers who need more power.',
    color: 'from-violet-600 to-indigo-600',
    badge: 'Most Popular',
    features: [
      'Unlimited events',
      'Advanced event tracking',
      'Priority email support',
      'Event status management',
      'Contact form access',
      'Event analytics',
      'Custom event descriptions',
    ],
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'For large organizations and professional teams.',
    color: 'from-amber-500 to-orange-600',
    badge: null,
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
      'Advanced reporting',
      'Onboarding support',
      'Team collaboration tools',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-violet-200">
            <Zap className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Choose your plan
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => {
            const isPopular = tier.badge === 'Most Popular';
            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  isPopular
                    ? 'border-violet-500 shadow-xl shadow-violet-100'
                    : 'border-gray-100 shadow-md'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${tier.color} rounded-t-2xl p-6 text-white`}>
                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-white/80 text-sm mb-4">{tier.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold">${tier.price}</span>
                    <span className="text-white/70 mb-1.5">/mo</span>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-6 bg-white rounded-b-2xl">
                  <ul className="space-y-3 flex-1 mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-violet-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => navigate('/auth')}
                    className={`w-full rounded-xl font-semibold py-5 ${
                      isPopular
                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
