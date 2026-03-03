import { prisma } from '@/lib/prisma';
import { getCurrentOrganizationId } from '@/lib/tenant';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PublicEventsPage() {
    const organizationId = await getCurrentOrganizationId();

    // Fetch organization theme to white-label the page
    const org = await prisma.organization.findUnique({
        where: { id: organizationId }
    });

    const events = await prisma.event.findMany({
        where: { organizationId, date: { gte: new Date() } },
        orderBy: { date: 'asc' }
    });

    const themeColor = org?.themeColor || '#10b981';

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white">

            {/* White Label Header */}
            <div className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {org?.logoUrl ? (
                            <img src={org.logoUrl} alt="Club Logo" className="h-10 w-auto object-contain" />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg"
                                style={{ backgroundColor: themeColor, color: '#0B0F19' }}
                            >
                                {org?.name.charAt(0) || 'S'}
                            </div>
                        )}
                        <span className="font-bold text-lg hidden sm:block">{org?.name}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16 space-y-12">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Upcoming Events</h1>
                    <p className="text-lg text-gray-400">Join us for open shoots, competitions, and corporate hospitality days at {org?.name}.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
                    {events.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-white/10">
                            No upcoming events are currently scheduled. Please check back later.
                        </div>
                    ) : (
                        events.map(evt => (
                            <div key={evt.id} className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-full">
                                <div className="p-8 flex-grow space-y-4">
                                    <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-gray-300">
                                        Open Event
                                    </div>
                                    <h2 className="text-2xl font-bold">{evt.title}</h2>
                                    <p className="text-gray-400 line-clamp-3">{evt.description}</p>

                                    <div className="space-y-2 pt-4">
                                        <div className="flex items-center text-sm text-gray-300">
                                            <Calendar size={16} className="mr-3 text-gray-500" />
                                            {evt.date.toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-300">
                                            <Users size={16} className="mr-3 text-gray-500" />
                                            {evt.maxAttendees ? `${evt.maxAttendees} spots total` : 'Unlimited capacity'}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-black/40 border-t border-white/5">
                                    <Link
                                        href={`/events/${evt.id}/register`}
                                        className="w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg hover:brightness-110"
                                        style={{ backgroundColor: themeColor, color: '#0B0F19' }}
                                    >
                                        <span>Register Now</span>
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
