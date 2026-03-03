import Link from 'next/link';
import { Target, Users, CreditCard, Calendar, Settings, QrCode } from 'lucide-react';

export default function AdminDashboardPage() {

    const adminFeatures = [
        {
            title: 'Member Directory',
            description: 'Manage registered shooters, view digital licenses, and approve full membership applicants.',
            href: '/admin/members',
            icon: Users,
            color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:border-blue-500',
            bgGlow: 'group-hover:bg-blue-500/10'
        },
        {
            title: 'Facility & Pricing',
            description: 'Configure maximum capacities safely, define shooting pegs, and set dynamic pricing.',
            href: '/admin/facilities',
            icon: Target,
            color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:border-emerald-500',
            bgGlow: 'group-hover:bg-emerald-500/10'
        },
        {
            title: 'Financial Revenue',
            description: 'Track B2B recurring subscription income safely, analyze MRR, and review overdue accounts.',
            href: '/admin/financials',
            icon: CreditCard,
            color: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:border-amber-500',
            bgGlow: 'group-hover:bg-amber-500/10'
        },
        {
            title: 'Event Engine',
            description: 'Schedule public shoot days, corporate hospitality events, and gather registered external leads.',
            href: '/admin/events',
            icon: Calendar,
            color: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:border-purple-500',
            bgGlow: 'group-hover:bg-purple-500/10'
        },
        {
            title: 'QR Staff Scanner',
            description: 'Open the smartphone-ready webcam portal to physically verify attending shooter passes and identities.',
            href: '/admin/scanner',
            icon: QrCode,
            color: 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:border-rose-500',
            bgGlow: 'group-hover:bg-rose-500/10'
        },
        {
            title: 'White Label Settings',
            description: 'Safely control your Tenant organization branding. Upload your club logo and custom platform theme color.',
            href: '/admin/settings',
            icon: Settings,
            color: 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:border-gray-500',
            bgGlow: 'group-hover:bg-gray-500/10'
        }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                    Administrator Hub
                </h1>
                <p className="text-gray-400 mt-2 text-lg">
                    Select a module below to begin managing your shooting estate.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {adminFeatures.map((feature) => (
                    <Link key={feature.title} href={feature.href}>
                        <div className={`relative overflow-hidden group border rounded-3xl p-6 h-full transition-all duration-300 ${feature.color} bg-black/40 backdrop-blur-md`}>
                            {/* Background Glow Effect */}
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors duration-500 ${feature.bgGlow}`}></div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black/40 border border-white/5 backdrop-blur-lg">
                                    <feature.icon size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">{feature.title}</h2>
                                <p className="text-gray-400 text-sm leading-relaxed flex-grow">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
