import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  X,
  Flame,
  Award,
  Music,
  Users
} from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  category: 'STAGE' | 'SPORTS' | 'AWARDS' | 'CAMPUS';
  imageUrl: string;
  caption: string;
  timeAgo: string;
}

export const PublicGalleryView: React.FC = () => {
  const { settings } = useFestData();
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'STAGE' | 'SPORTS' | 'AWARDS' | 'CAMPUS'>('ALL');
  const [activeImage, setActiveImage] = useState<GalleryItem | null>(null);

  const galleryItems: GalleryItem[] = [
    {
      id: 'g1',
      title: 'Classical Dance Group Synchrony',
      category: 'STAGE',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
      caption: 'Main auditorium stage 1 performance featuring Senior Arts finalists.',
      timeAgo: '1 hour ago'
    },
    {
      id: 'g2',
      title: 'Track & Field 100m Sprint Finals',
      category: 'SPORTS',
      imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
      caption: 'Thrilling photo-finish at the athletics ground for Senior boys.',
      timeAgo: '2 hours ago'
    },
    {
      id: 'g3',
      title: 'Overall Championship Trophy Reveal',
      category: 'AWARDS',
      imageUrl: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=1200&q=80',
      caption: 'The prestigious golden cup unveiled by the jury board.',
      timeAgo: '3 hours ago'
    },
    {
      id: 'g4',
      title: 'Vocal Solo & Orchestral Harmony',
      category: 'STAGE',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      caption: 'Captivating musical performance in Western Solo category.',
      timeAgo: '4 hours ago'
    },
    {
      id: 'g5',
      title: 'House March Past & Cheer Flags',
      category: 'CAMPUS',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      caption: 'Vibrant house parade led by Ruby, Sapphire, Emerald, and Topaz.',
      timeAgo: '5 hours ago'
    },
    {
      id: 'g6',
      title: 'Football Championship Semi-Finals',
      category: 'SPORTS',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      caption: 'Intense extra-time battle on the main sports turf arena.',
      timeAgo: '6 hours ago'
    },
    {
      id: 'g7',
      title: 'Mime & Theatrical Expressions',
      category: 'STAGE',
      imageUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
      caption: 'Drama and stage theater performances on Day 2.',
      timeAgo: 'Yesterday'
    },
    {
      id: 'g8',
      title: 'Podium Medal Ceremony & Laurels',
      category: 'AWARDS',
      imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
      caption: 'Top gold and silver medalists receiving certificates.',
      timeAgo: 'Yesterday'
    }
  ];

  const filteredItems = galleryItems.filter(item => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-linear-to-r from-red-600 via-rose-600 to-amber-600 text-white p-6 sm:p-8 shadow-xl shadow-red-600/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
            <Camera className="w-3.5 h-3.5" />
            Live Event Photography
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Fest Moments & Photo Gallery
          </h1>
          <p className="text-sm text-rose-100 mt-2 font-medium">
            High-definition snapshots from stage performances, sports ground tournaments, podium ceremonies, and campus celebrations.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-1">
        {[
          { key: 'ALL', label: 'All Photos' },
          { key: 'STAGE', label: 'Stage Arts' },
          { key: 'SPORTS', label: 'Sports Meet' },
          { key: 'AWARDS', label: 'Podium & Awards' },
          { key: 'CAMPUS', label: 'Fest Atmosphere' }
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key as any)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              selectedCategory === cat.key
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <div
            key={item.id}
            onClick={() => setActiveImage(item)}
            className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 aspect-4/3 cursor-pointer shadow-xs hover:shadow-xl transition-all"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300">
                {item.category} • {item.timeAgo}
              </span>
              <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-rose-200 transition-colors">
                {item.title}
              </h4>
            </div>
            <div className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/60 hover:bg-black text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImage.imageUrl}
              alt={activeImage.title}
              className="w-full max-h-[60vh] object-cover"
            />
            <div className="p-5 text-white bg-slate-900">
              <span className="text-xs font-mono font-bold uppercase text-rose-400">
                {activeImage.category} • {activeImage.timeAgo}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {activeImage.title}
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                {activeImage.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
