import React, { useState, useEffect, useCallback } from 'react';
import { useFestData } from '../../context/FestDataContext';
import { useAuth } from '../../context/AuthContext';
import { BannerSlide } from '../../types';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  X,
  Check
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const PublicHeroSlider: React.FC = () => {
  const { settings, updateSettings } = useFestData();
  const { isSuperAdmin, currentUser } = useAuth();

  const slides: BannerSlide[] = (settings.bannerSlides && settings.bannerSlides.length > 0)
    ? settings.bannerSlides.filter(s => s.isActive !== false)
    : [
        {
          id: 'def_1',
          imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
          title: 'DEEN CODE - DARUL HUDA PG ARTS FEST 2026',
          subtitle: 'Decoding the Deen, Recoding the Gen',
          isActive: true
        }
      ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Admin new slide form state
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideTitle, setNewSlideTitle] = useState('');
  const [newSlideSubtitle, setNewSlideSubtitle] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Auto-sliding timer
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  // Handle local file upload (converts to DataURL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewSlideUrl(reader.result);
        setUploadError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlideUrl) {
      setUploadError('Please upload an image or provide an image URL.');
      return;
    }

    const newSlide: BannerSlide = {
      id: 'slide_' + Date.now(),
      imageUrl: newSlideUrl,
      title: newSlideTitle.trim() || undefined,
      subtitle: newSlideSubtitle.trim() || undefined,
      isActive: true
    };

    const existingSlides = settings.bannerSlides || [];
    const updated = [...existingSlides, newSlide];

    updateSettings(
      { ...settings, bannerSlides: updated },
      currentUser.name,
      currentUser.role
    );

    setNewSlideUrl('');
    setNewSlideTitle('');
    setNewSlideSubtitle('');
    setIsUploadModalOpen(false);
    setCurrentIndex(updated.length - 1);
  };

  const handleDeleteSlide = (slideId: string) => {
    const existingSlides = settings.bannerSlides || [];
    const updated = existingSlides.filter(s => s.id !== slideId);
    updateSettings(
      { ...settings, bannerSlides: updated },
      currentUser.name,
      currentUser.role
    );
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div className="w-full relative">
      {/* Main Slider Container */}
      <div
        className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-xl shadow-slate-900/10 group aspect-16/9 sm:aspect-21/9 min-h-[260px] sm:min-h-[380px] flex items-center justify-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Slide Image */}
        {currentSlide && (
          <img
            key={currentSlide.id}
            src={currentSlide.imageUrl}
            alt={currentSlide.title || 'Fest Banner Slide'}
            className="w-full h-full object-cover sm:object-cover transition-all duration-700 animate-in fade-in"
          />
        )}

        {/* Subtle Dark Gradient Overlay for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Slide Info (if title provided) */}
        {currentSlide && (currentSlide.title || currentSlide.subtitle) && (
          <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 z-10 max-w-xl text-white">
            {currentSlide.title && (
              <h2 className="text-xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                {currentSlide.title}
              </h2>
            )}
            {currentSlide.subtitle && (
              <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium drop-shadow-sm">
                {currentSlide.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Top-Right Slide Counter (Matching User Screenshot: 1/1, 1/3) */}
        <div className="absolute top-4 right-4 z-20">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-mono font-bold border border-white/10 shadow-xs">
            {currentIndex + 1} / {slides.length}
          </span>
        </div>

        {/* Admin Floating Upload & Manage Button */}
        {isSuperAdmin && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-900 text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105"
          >
            <Upload className="w-3.5 h-3.5 text-red-600" />
            <span>Manage Banner Slides</span>
          </button>
        )}

        {/* Left Arrow Button */}
        {slides.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 hover:scale-105"
            title="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Right Arrow Button */}
        {slides.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer opacity-80 hover:opacity-100 hover:scale-105"
            title="Next Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Bottom Pagination Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-7 h-2.5 bg-white shadow-md'
                    : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Admin Upload & Manage Banner Slides */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Manage Public Banner Carousel"
        subtitle="Upload custom banners, fest posters, and announcements for the public homepage"
      >
        <div className="space-y-6">
          {uploadError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {uploadError}
            </div>
          )}

          {/* Add New Slide Form */}
          <form onSubmit={handleAddSlide} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Upload New Banner Image
            </h4>

            {/* File Upload Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Select Image File from Device
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
              />
            </div>

            {/* Or Image URL Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Or Enter Image Direct URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/banner-poster.jpg"
                value={newSlideUrl}
                onChange={e => setNewSlideUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Finale 2026"
                  value={newSlideTitle}
                  onChange={e => setNewSlideTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Subtitle (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Live stage performances"
                  value={newSlideSubtitle}
                  onChange={e => setNewSlideSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Preview */}
            {newSlideUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-200 aspect-21/9 bg-slate-900 max-h-36">
                <img src={newSlideUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add to Banner Carousel
            </button>
          </form>

          {/* Current Slides List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Active Banner Slides ({slides.length})
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="p-2.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || 'Slide'}
                      className="w-14 h-9 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">
                        Slide #{idx + 1}: {slide.title || 'Untitled Banner'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono line-clamp-1">
                        {slide.subtitle || 'Active public slide'}
                      </p>
                    </div>
                  </div>

                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
