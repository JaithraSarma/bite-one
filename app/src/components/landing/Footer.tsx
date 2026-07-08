import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">
              Event<span className="text-violet-400">Flow</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} EventFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
