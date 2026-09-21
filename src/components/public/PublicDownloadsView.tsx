import React, { useState } from 'react';
import { useFestData } from '../../context/FestDataContext';
import {
  Download,
  FileText,
  CheckCircle2,
  Calendar,
  Trophy,
  ShieldCheck,
  FileSpreadsheet,
  BookOpen,
  Sparkles
} from 'lucide-react';

export const PublicDownloadsView: React.FC = () => {
  const { settings, programs, teams, results } = useFestData();
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const handleDownload = (id: string, fileName: string) => {
    setDownloadedId(id);
    // Simulate generation and download
    const element = document.createElement('a');
    const file = new Blob([
      `KALA & KREEDA 2026 - OFFICIAL DOCUMENT\n====================================\nDocument: ${fileName}\nInstitution: ${settings.institutionName}\nGenerated: ${new Date().toLocaleString()}\n`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setTimeout(() => setDownloadedId(null), 2500);
  };

  const downloadItems = [
    {
      id: 'rulebook',
      title: 'Official Fest Rulebook & Competition Manual',
      description: 'Comprehensive guidelines, code of conduct, scoring metrics, and stage regulations for all 45+ events.',
      category: 'Guidelines',
      format: 'PDF • 2.4 MB',
      icon: BookOpen,
      color: 'from-red-500 to-rose-600'
    },
    {
      id: 'schedule_pdf',
      title: 'Complete Stage & Ground Program Schedule',
      description: 'Chronological timeline of event slots, reporting times, stage venues, and category schedules.',
      category: 'Timetable',
      format: 'PDF • 1.8 MB',
      icon: Calendar,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      id: 'standings_sheet',
      title: 'Overall Championship Standings & Points Table',
      description: 'Official verified house points breakdown across Arts, Sports, and Grand Championship tallies.',
      category: 'Results',
      format: 'PDF / XLS • 1.2 MB',
      icon: Trophy,
      color: 'from-amber-500 to-yellow-600'
    },
    {
      id: 'program_catalog',
      title: 'Programs Master Catalog & Category Guide',
      description: 'Full itemized list of all Arts & Sports programs including individual and group item specifications.',
      category: 'Catalog',
      format: 'PDF • 950 KB',
      icon: FileSpreadsheet,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'house_handbook',
      title: 'Team Captains & House Leaders Handbook',
      description: 'Instructions for house leaders regarding registration limits, chest numbers, and appeals.',
      category: 'Team Leaders',
      format: 'PDF • 1.5 MB',
      icon: ShieldCheck,
      color: 'from-blue-500 to-cyan-600'
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-linear-to-r from-red-600 via-rose-600 to-purple-600 text-white p-6 sm:p-8 shadow-xl shadow-red-600/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-3">
            <Download className="w-3.5 h-3.5" />
            Official Resource Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Downloads & Official Publications
          </h1>
          <p className="text-sm text-rose-100 mt-2 font-medium">
            Download certified competition rulebooks, printable stage timetables, championship score sheets, and official publications.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Downloads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {downloadItems.map(item => {
          const Icon = item.icon;
          const isDownloaded = downloadedId === item.id;

          return (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-red-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase font-mono">
                      {item.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-medium">
                      {item.format}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Certified Copy
                </span>

                <button
                  onClick={() => handleDownload(item.id, item.title)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
                    isDownloaded
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 hover:scale-105 active:scale-95'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {isDownloaded ? 'Downloaded!' : 'Download PDF'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
