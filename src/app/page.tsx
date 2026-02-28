import Link from 'next/link';
import { ArrowRight, ShieldCheck, CalendarCheck, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-emerald-600/30">
              <ShieldCheck className="text-white w-6 h-6 -rotate-3" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">
              UK Shooting Club<span className="text-emerald-600">.</span>
            </span>
          </div>
          <div className="flex gap-6 items-center font-semibold text-sm">
            <Link href="/admin/financials" className="text-gray-600 hover:text-emerald-600 transition-colors">Admin Dashboard</Link>
            <Link href="/admin/facilities" className="text-gray-600 hover:text-emerald-600 transition-colors">Manage Facilities</Link>
            <Link href="/bookings" className="px-5 py-2.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Member Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 text-center pt-24 pb-32">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold mb-8 border border-emerald-100 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Financial & Facility Management Operational
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 max-w-5xl leading-[1.1] mb-8">
          The ultimate platform for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">modern shooting clubs</span>.
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mb-12 font-medium">
          A compliant, secure, and beautiful SaaS. Manage memberships, track financials, and automate range bookings from one powerful dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/bookings" className="group flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/40 hover:-translate-y-1">
            Book a Range
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/admin/financials" className="flex items-center justify-center px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
            Admin Tools
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto text-left">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Financial Tracking</h3>
            <p className="text-gray-500 font-medium">Automated subscription billing, arrears handling, and Stripe integration.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Digital Bookings</h3>
            <p className="text-gray-500 font-medium">Self-service range bookings with active capacity and automated conflict resolution.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">UK Compliance</h3>
            <p className="text-gray-500 font-medium">Tracking firearm storage, police authorizations, and membership attendance.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
