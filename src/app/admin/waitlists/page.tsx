import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock } from "lucide-react";

export default async function WaitlistsAdminOverview() {
    // Server-side fetching for speed and SEO structure
    // Fetch events that specifically have a non-empty waitlist queue
    const eventsWithQueues = await prisma.event.findMany({
        where: {
            waitlistEntries: {
                some: { status: "PENDING" }
            }
        } as any,
        include: {
            waitlistEntries: {
                where: { status: "PENDING" },
                orderBy: { createdAt: "asc" },
                include: { user: { select: { id: true, name: true, membershipTier: true } } }
            },
            _count: { select: { bookings: true } }
        } as any
    }) as any[];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-500 flex items-center gap-3">
                    <Clock size={40} className="text-orange-500" /> Waitlist Control Matrix
                </h1>
                <p className="text-gray-400 mt-2 text-lg">
                    Monitor events with overflow capacity. When spot availability triggers, the system automatically auto-promotes sequentially.
                </p>
            </div>

            {eventsWithQueues.length === 0 ? (
                <div className="p-8 border border-white/10 bg-black/40 rounded-3xl backdrop-blur text-center text-gray-500">
                    No active waitlists holding pending users currently.
                </div>
            ) : (
                <div className="space-y-6">
                    {eventsWithQueues.map(event => (
                        <div key={event.id} className="bg-black/40 backdrop-blur-md rounded-3xl border border-gray-500/30 overflow-hidden text-white">
                            <div className="p-6 bg-white/5 border-b border-gray-500/30 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold">{event.title}</h2>
                                    <p className="text-gray-400 text-sm mt-1">{new Date(event.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-amber-400">Queue Length: {event.waitlistEntries.length}</div>
                                    <div className="text-xs text-gray-400 mt-1">Capacity: {event._count.bookings}/{event.maxAttendees || "UNLIMITED"}</div>
                                </div>
                            </div>
                            
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-white/5 border-b border-gray-500/20 text-gray-400">
                                        <th className="p-4 font-semibold w-12 text-center">#</th>
                                        <th className="p-4 font-semibold">User</th>
                                        <th className="p-4 font-semibold">Membership Tier</th>
                                        <th className="p-4 font-semibold text-right">Time Entered Queue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {event.waitlistEntries.map((entry, idx) => (
                                        <tr key={entry.id} className="hover:bg-white/5 transition">
                                            <td className="p-4 text-center font-bold text-gray-500">{idx + 1}</td>
                                            <td className="p-4 font-semibold text-gray-200">{entry.user.name || "Unknown Member"}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-white/10 rounded font-mono text-xs uppercase tracking-wide">
                                                    {entry.user.membershipTier}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-gray-400">
                                                {new Date(entry.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
