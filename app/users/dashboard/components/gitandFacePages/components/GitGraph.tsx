'use client';

import { GitMonth } from '../types';

const getColor = (count: number) => {
  if (count === 0) return '#e5e7eb';
  if (count < 3) return '#9be9a8';
  if (count < 6) return '#40c463';
  if (count < 9) return '#30a14e';
  return '#216e39';
};

interface GitGraphProps {
  months: GitMonth[];
  theme: string;
}

export function GitGraph({ months, theme }: GitGraphProps) {
  return (
    <div 
      className="flex overflow-x-auto scrollbar-hide mt-8 pb-2 min-w-0" 
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {months.map((month, mi) => (
        <div key={mi} className="flex flex-shrink-0">
          <div>
            <p className={`text-xs font-semibold mb-2 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {month.month}
            </p>

            <div className="flex gap-1">
              {month.weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className="w-4 h-4 rounded-full"
                      style={{ background: getColor(day.count) }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mx-3 border-r" />
        </div>
      ))}
    </div>
  );
}
