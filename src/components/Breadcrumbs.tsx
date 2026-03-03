'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
    const pathname = usePathname();

    // If we are on the home page, don't show breadcrumbs
    if (pathname === '/') return null;

    // Generate path segments
    const pathSegments = pathname.split('/').filter((segment) => segment !== '');

    return (
        <nav className="w-full bg-white/5 border-b border-white/10 backdrop-blur-md px-6 py-3 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center space-x-2 text-sm text-gray-400">
                <Link
                    href="/"
                    className="hover:text-emerald-400 transition-colors flex items-center"
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
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                            {isLast ? (
                                <span className="text-emerald-400 font-medium">
                                    {formattedSegment}
                                </span>
                            ) : (
                                <Link
                                    href={href}
                                    className="hover:text-emerald-400 transition-colors"
                                >
                                    {formattedSegment}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </nav>
    );
}
