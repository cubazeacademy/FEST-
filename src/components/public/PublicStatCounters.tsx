import React from 'react';
import { useFestData } from '../../context/FestDataContext';
import { Calendar, Users, Award, MapPin } from 'lucide-react';

export const PublicStatCounters: React.FC = () => {
  const { programs, students, teams } = useFestData();

  // Calculate unique venues
  const uniqueVenues = React.useMemo(() => {
    const venues = new Set(
      programs
        .map(p => p.stageLocation)
        .filter(Boolean)
    );
    return venues.size > 0 ? venues.size : 4;
  }, [programs]);

  const stats = [
    {
      id: 'programs',
      count: programs.length > 0 ? programs.length : 45,
      label: 'Programs',
      subtitle: 'Exciting programs and competitions',
      icon: Calendar,
      gradient: 'from-rose-500 via-red-500 to-amber-500',
      numberColor: 'text-amber-500'
    },
    {
      id: 'participants',
      count: students.length > 0 ? students.length : 1113,
      label: 'Participants',
      subtitle: 'Talented individuals',
      icon: Users,
      gradient: 'from-amber-400 to-yellow-500',
      numberColor: 'text-amber-500'
    },
    {
      id: 'teams',
      count: teams.length > 0 ? teams.length : 7,
      label: 'Teams',
      subtitle: 'Collaborative groups',
      icon: Award,
      gradient: 'from-orange-400 to-amber-500',
      numberColor: 'text-amber-500'
    },
    {
      id: 'venues',
      count: uniqueVenues,
      label: 'Venues',
      subtitle: 'Event locations',
      icon: MapPin,
      gradient: 'from-red-500 to-rose-600',
      numberColor: 'text-amber-500'
    }
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {stats.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center group"
            >
              {/* Circular Gradient Icon Badge */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr ${item.gradient} p-0.5 flex items-center justify-center text-white shadow-lg shadow-amber-500/15 group-hover:scale-110 transition-transform mb-4`}
              >
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
              </div>

              {/* Bold Yellow/Gold Count */}
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight text-amber-500 mb-1.5 group-hover:scale-105 transition-transform`}>
                {item.count}
              </span>

              {/* Label */}
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
                {item.label}
              </h3>

              {/* Subtitle */}
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {item.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
