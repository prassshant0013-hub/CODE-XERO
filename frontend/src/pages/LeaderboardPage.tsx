import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Creator, LeaderboardStats } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MARKETPLACE_CATEGORIES } from '../lib/categories';

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const specialties = [...MARKETPLACE_CATEGORIES];

  useEffect(() => {
    loadLeaderboard();
  }, [selectedSpecialty]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await api.leaderboard.get();
      setStats(data?.stats || null);
      let list = Array.isArray(data?.creators) ? data.creators : [];
      if (selectedSpecialty !== 'All') {
        const needle = selectedSpecialty.toLowerCase();
        list = list.filter((c) => {
          const text = `${c?.specialization || ''} ${c?.hero_category || ''} ${c?.bio || ''}`.toLowerCase();
          return text.includes(needle);
        });
      }
      setCreators(list);
    } finally {
      setIsLoading(false);
    }
  };

  const top1 = creators[0];
  const top2 = creators[1];
  const top3 = creators[2];
  const tableRegistry = creators.slice(3);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute -top-32 left-1/4 w-[600px] h-[360px] bg-secondary-container/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 right-10 w-[420px] h-[420px] bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-gutter py-space-lg lg:py-space-xl">
        {/* Section Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg pb-space-lg border-b border-surface-container-high mb-space-md">
          <div className="max-w-2xl space-y-space-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                Verified Rankings
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Creator Leaderboard
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Top AI content creators ranked by on-time delivery, completed projects, and client trust.
            </p>
          </div>

          {/* Metric Highlights Box */}
          {stats && (
            <div className="flex items-center gap-space-lg p-space-md bg-surface-container rounded-lg shadow-sm border border-outline-variant/30 flex-shrink-0">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Median SLA
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-normal">
                  {stats.median_sla}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-outline-variant"></div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Total Projects
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-normal">
                  {stats.total_briefs.toLocaleString()}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-outline-variant"></div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Escrow Integrity
                </span>
                <span className="font-headline-sm text-headline-sm text-secondary font-normal">
                  {stats.escrow_integrity}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Category Filter Pills */}
        <nav aria-label="Category Filters" className="flex flex-wrap items-center gap-2 py-space-sm mb-space-lg">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-space-md py-1.5 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${
                selectedSpecialty === spec
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              {spec}
            </button>
          ))}
        </nav>

        {isLoading ? (
          <LoadingSpinner message="Loading creator rankings..." />
        ) : (
          <>
            {/* Top 3 Spotlight Grid */}
            <section aria-label="Top 3 Creators" className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-space-xl items-stretch">
              {/* RANK 1: Aarav Studio (6 cols) */}
              {top1 && (
                <article className="lg:col-span-6 bg-surface-container-low rounded-xl overflow-hidden shadow-md flex flex-col justify-between group transition-all duration-300 hover:shadow-xl border border-outline-variant/30">
                  <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-surface-container">
                    <img
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={top1.name}
                      src={top1.hero_image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent"></div>
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface/95 backdrop-blur-md rounded-full shadow-sm text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[16px] text-secondary">workspace_premium</span>
                        Rank 01 • Gold Laurels
                      </span>
                      <span className="px-3 py-1 bg-secondary text-on-secondary rounded-full font-label-sm text-label-sm uppercase tracking-wider font-bold shadow-sm">
                        Creator of the Month
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-on-primary">
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary-container opacity-90">
                        {top1.specialization}
                      </span>
                      <h2 className="font-headline-md text-headline-md font-normal leading-tight text-on-primary">
                        {top1.name}
                      </h2>
                    </div>
                  </div>

                  <div className="p-space-lg flex flex-col justify-between flex-grow gap-space-md bg-surface-container-low">
                    <div className="grid grid-cols-3 gap-2 py-space-xs">
                      <div className="p-3 bg-surface-container rounded-lg">
                        <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">SLA Index</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">{top1.sla_index}%</span>
                      </div>
                      <div className="p-3 bg-surface-container rounded-lg">
                        <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Projects</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">{top1.commissions_count}</span>
                      </div>
                      <div className="p-3 bg-surface-container rounded-lg">
                        <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">On-Time</span>
                        <span className="font-headline-sm text-headline-sm text-secondary">{top1.on_time_rate}%</span>
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3">
                      {top1.bio}
                    </p>
                    <div className="flex items-center justify-between pt-space-xs gap-space-sm border-t border-surface-container-highest/60">
                      <Link
                        className="inline-flex items-center gap-1.5 text-on-surface hover:text-secondary font-label-lg text-label-lg transition-colors"
                        to={`/creators/${top1.id}`}
                      >
                        <span>View Portfolio</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                      </Link>
                      <button
                        onClick={() => navigate(`/briefs?creator=${top1.id}`)}
                        className="px-space-md py-2.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container hover:text-on-surface transition-all shadow-sm cursor-pointer"
                        type="button"
                      >
                        Invite to Project
                      </button>
                    </div>
                  </div>
                </article>
              )}

              {/* RANK 2 & 3: Meera Visuals & Kabir Motion (6 cols stacked) */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-gutter">
                {top2 && (
                  <article className="bg-surface-container-low rounded-xl overflow-hidden shadow-md flex flex-col sm:flex-row group transition-all duration-300 hover:shadow-xl flex-1 border border-outline-variant/30">
                    <div className="relative sm:w-2/5 h-48 sm:h-auto overflow-hidden bg-surface-container">
                      <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={top2.name}
                        src={top2.hero_image}
                      />
                      <div className="absolute top-3 left-3 flex items-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface/95 backdrop-blur-md rounded-full shadow-sm text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[15px] text-outline">military_tech</span>
                          Rank 02 • Silver
                        </span>
                      </div>
                    </div>
                    <div className="sm:w-3/5 p-space-md sm:p-space-lg flex flex-col justify-between gap-space-sm">
                      <div>
                        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                          {top2.specialization.split('•')[0]}
                        </span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                          {top2.name}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 line-clamp-2">
                          {top2.bio}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                        <span className="font-label-sm text-secondary font-semibold">₹{top2.rate_per_day.toLocaleString('en-IN')}/day</span>
                        <Link to={`/creators/${top2.id}`} className="font-label-md text-on-surface hover:text-secondary">
                          View Portfolio →
                        </Link>
                      </div>
                    </div>
                  </article>
                )}

                {top3 && (
                  <article className="bg-surface-container-low rounded-xl overflow-hidden shadow-md flex flex-col sm:flex-row group transition-all duration-300 hover:shadow-xl flex-1 border border-outline-variant/30">
                    <div className="relative sm:w-2/5 h-48 sm:h-auto overflow-hidden bg-surface-container">
                      <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        alt={top3.name}
                        src={top3.hero_image}
                      />
                      <div className="absolute top-3 left-3 flex items-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface/95 backdrop-blur-md rounded-full shadow-sm text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[15px] text-amber-700">military_tech</span>
                          Rank 03 • Bronze
                        </span>
                      </div>
                    </div>
                    <div className="sm:w-3/5 p-space-md sm:p-space-lg flex flex-col justify-between gap-space-sm">
                      <div>
                        <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary">
                          {top3.specialization.split('•')[0]}
                        </span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                          {top3.name}
                        </h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 line-clamp-2">
                          {top3.bio}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                        <span className="font-label-sm text-secondary font-semibold">₹{top3.rate_per_day.toLocaleString('en-IN')}/day</span>
                        <Link to={`/creators/${top3.id}`} className="font-label-md text-on-surface hover:text-secondary">
                          View Portfolio →
                        </Link>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            </section>

            {/* Verified Master Registry Table */}
            {tableRegistry.length > 0 && (
              <section className="bg-surface-container-low rounded-xl p-space-lg shadow-sm border border-outline-variant/30 mb-space-xl">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-surface-container-high">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">
                    Creator Rankings
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Positions 04–{3 + tableRegistry.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-body-sm">
                    <thead>
                      <tr className="border-b border-surface-container text-on-surface-variant font-label-sm uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Creator</th>
                        <th className="py-3 px-4">AI Tools Used</th>
                        <th className="py-3 px-4">On-Time Rate</th>
                        <th className="py-3 px-4">Projects</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {tableRegistry.map((c, i) => (
                        <tr key={c.id} className="hover:bg-surface-container transition-colors">
                          <td className="py-4 px-4 font-semibold text-secondary">
                            #{String(i + 4).padStart(2, '0')}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={c.avatar || c.hero_image}
                                alt={c.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <span className="font-label-md text-on-surface font-semibold block">{c.name}</span>
                                <span className="text-[11px] text-on-surface-variant">{c.specialization}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-on-surface">{c.tools_and_pipeline.slice(0, 2).join(', ')}</td>
                          <td className="py-4 px-4 text-on-surface font-semibold">{c.sla_index}%</td>
                          <td className="py-4 px-4 text-on-surface">{c.commissions_count} projects</td>
                          <td className="py-4 px-4 text-right">
                            <Link
                              to={`/creators/${c.id}`}
                              className="px-3 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary rounded-full font-label-sm text-[11px] transition-colors inline-block"
                            >
                              Portfolio
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
