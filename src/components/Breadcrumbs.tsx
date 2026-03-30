'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

export default function Breadcrumbs() {
    const pathname = usePathname();
    const { status } = useSession();

    // If we are on the home page, don't show breadcrumbs
    if (pathname === '/') return null;

    // Generate path segments
    const pathSegments = pathname.split('/').filter((segment) => segment !== '');

    const isLightMode = pathname === '/join';

    return (
        <nav className={`w-full backdrop-blur-md px-6 py-3 sticky top-0 z-50 flex items-center justify-between border-b ${
            isLightMode ? 'bg-white/80 border-gray-200' : 'bg-white/5 border-white/10'
        }`}>
            <div className={`flex items-center space-x-2 text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <Link
                    href="/"
                    className={`transition-colors flex items-center ${isLightMode ? 'hover:text-emerald-600 text-gray-600' : 'hover:text-emerald-400 text-gray-400'}`}
                >
                    <Home className="w-4 h-4" />
                </Link>

                {pathSegments.map((segment, index) => {
                    // Construct the href for this specific level
                    const href = `/${pathSegments.slice(0, index + 1).join('/')}`;

                    // Format the segment name (e.g., "admin-dashboard" -> "Admin Dashboard")
                    const isLast = index === pathSegments.length - 1;
                    const formattedSegment = segment
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, (char) => char.toUpperCase());

                    return (
                        <div key={href} className="flex items-center space-x-2">
                            <ChevronRight className={`w-4 h-4 ${isLightMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            {isLast ? (
                                <span className={`${isLightMode ? 'text-emerald-600' : 'text-emerald-400'} font-medium`}>
                                    {formattedSegment}
                                </span>
                            ) : (
                                <Link
                                    href={href}
                                    className={`transition-colors ${isLightMode ? 'hover:text-emerald-600 text-gray-600' : 'hover:text-emerald-400 text-gray-400'}`}
                                >
                                    {formattedSegment}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>

            {status === 'authenticated' && (
                <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className={`flex items-center space-x-2 text-sm transition-colors px-3 py-1.5 rounded-lg border ${
                        isLightMode 
                            ? 'text-gray-600 hover:text-red-600 bg-white hover:bg-red-50 border-gray-200 hover:border-red-200' 
                            : 'text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border-white/10 hover:border-red-500/30'
                    }`}
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            )}
        </nav>
    );
}
