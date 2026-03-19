'use client';

import Skeleton from '../../../../components/ui/Skeleton';
import { useTheme } from '../../../../contexts/ThemeContext';

export function ProfileSkeleton() {
    return (
        <div className="bg-white rounded-4xl shadow-sm border border-gray-200 p-6 flex flex-col h-90 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1"></div>
                <Skeleton variant="circular" width={32} height={32} />
            </div>
            <div className="flex-1"></div>
            <div className="relative z-10 flex flex-col items-center gap-2">
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
            </div>
            <Skeleton className="absolute inset-0 z-0" height="100%" />
        </div>
    );
}

export function WorkingTimeSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 h-80 flex flex-col gap-4">
            <Skeleton variant="text" width="50%" height={24} />
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <Skeleton variant="circular" width={120} height={120} />
                <Skeleton variant="text" width="40%" height={32} />
            </div>
            <div className="flex justify-between gap-4">
                <Skeleton variant="rectangular" height={40} className="flex-1 rounded-xl" />
                <Skeleton variant="rectangular" height={40} className="flex-1 rounded-xl" />
            </div>
        </div>
    );
}

export function GitAndFaceAttendanceSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <Skeleton variant="text" width="30%" height={28} />
                <div className="flex gap-2">
                    <Skeleton variant="rectangular" width={100} height={36} className="rounded-lg" />
                    <Skeleton variant="rectangular" width={100} height={36} className="rounded-lg" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton variant="rectangular" height={200} className="rounded-2xl" />
                <Skeleton variant="rectangular" height={200} className="rounded-2xl" />
            </div>
        </div>
    );
}

export function TrackTeamSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 h-80">
            <Skeleton variant="text" width="40%" height={24} className="mb-6" />
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton variant="circular" width={40} height={40} />
                        <div className="flex-1 space-y-2">
                            <Skeleton variant="text" width="70%" />
                            <Skeleton variant="text" width="40%" height={12} />
                        </div>
                        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CalenderAttendanceSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 h-80">
            <div className="flex items-center justify-between mb-6">
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton variant="rectangular" width={80} height={32} className="rounded-lg" />
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={32} className="rounded-md" />
                ))}
            </div>
        </div>
    );
}

export function TeamProjectSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 h-80">
            <Skeleton variant="text" width="40%" height={24} className="mb-6" />
            <div className="flex gap-4 overflow-hidden">
                {[1, 2].map((i) => (
                    <div key={i} className="min-w-[300px] border rounded-xl p-4 space-y-4">
                        <Skeleton variant="text" width="60%" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="flex items-center gap-3">
                                    <Skeleton variant="circular" width={40} height={40} />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton variant="text" width="80%" />
                                        <Skeleton variant="rectangular" height={8} className="rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CalendarPageSkeleton() {
    const { theme } = useTheme();

    return (
        <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
            <div className="max-w-4xl mx-auto">
                <Skeleton variant="text" width={300} height={40} className="mb-6" />

                <div className={`p-6 rounded-2xl shadow-2xl ${theme === 'dark' ? 'bg-white/10 backdrop-blur-xl' : 'bg-white border'}`}>
                    {/* Header: Month Navigation */}
                    <div className="flex justify-between items-center mb-10">
                        <Skeleton variant="rectangular" width={40} height={32} className="rounded-lg" />
                        <Skeleton variant="text" width={150} height={28} />
                        <Skeleton variant="rectangular" width={40} height={32} className="rounded-lg" />
                    </div>

                    {/* Day Names Header */}
                    <div className="grid grid-cols-7 gap-3 mb-6">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                            <Skeleton key={d} variant="text" width="60%" className="mx-auto" />
                        ))}
                    </div>

                    {/* Grid of days */}
                    <div className="grid grid-cols-7 gap-3">
                        {Array.from({ length: 35 }).map((_, i) => (
                            <Skeleton key={i} variant="rectangular" height={56} className="rounded-xl w-full" />
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="mt-8 flex flex-wrap gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Skeleton variant="rectangular" width={12} height={12} className="rounded-sm" />
                                <Skeleton variant="text" width={80} height={16} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardSkeleton() {
    const { theme } = useTheme();

    return (
        <div className={`p-6 min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
            {/* Header Skeleton */}
            <div className="mb-8 flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton variant="text" width={120} height={24} />
                    <Skeleton variant="text" width={240} height={40} />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton variant="rectangular" width={100} height={40} className="rounded-lg" />
                    <Skeleton variant="circular" width={40} height={40} />
                    <div className="flex items-center gap-3 border-2 border-gray-200 rounded-full p-2 w-64">
                        <Skeleton variant="circular" width={40} height={40} />
                        <div className="flex-1 space-y-1">
                            <Skeleton variant="text" width="80%" height={14} />
                            <Skeleton variant="text" width="40%" height={10} />
                        </div>
                        <Skeleton variant="circular" width={20} height={20} className="mr-2" />
                    </div>
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <ProfileSkeleton />
                    <WorkingTimeSkeleton />
                </div>
                <div className="lg:col-span-3 space-y-6">
                    <GitAndFaceAttendanceSkeleton />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TrackTeamSkeleton />
                        <CalenderAttendanceSkeleton />
                    </div>
                </div>
            </div>
        </div>
    );
}
