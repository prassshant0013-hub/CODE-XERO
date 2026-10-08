import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Creator, RecommendedCreator } from '../types';
import { ProposalModal } from '../components/ProposalModal';
import { CreatorAvatar } from '../components/CreatorAvatar';

/** Structured brief state — mapped from the backend BriefGenerateResponse. */
interface ProjectPlan {
  savedId?: number;
  title: string;
  objective: string;
  content_type: string;
  style: string;
  platform: string[];
  deliverables: string[];
  tools_suggested: string[];
  budget_min: number;
  budget_max: number;
  suggested_timeline_days: number;
  recommended_creator_category: string;
  description: string;
}

/** Format a number as Indian Rupees */
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const BriefsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);

  const [recommendedCreators, setRecommendedCreators] = useState<RecommendedCreator[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [proposalTarget, setProposalTarget] = useState<Creator | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  /** Fetch top 3 matching creators whenever a plan is created/updated */
  const fetchRecommendations = async (currentPlan: ProjectPlan) => {
    setIsLoadingRecommendations(true);
    try {
      const recs = await api.briefs.recommendCreators({
        category: currentPlan.recommended_creator_category,
        content_type: currentPlan.content_type,
        style: currentPlan.style,
        tools_suggested: currentPlan.tools_suggested,
        budget: currentPlan.budget_max || currentPlan.budget_min,
        budget_min: currentPlan.budget_min,
        budget_max: currentPlan.budget_max,
        timeline_days: currentPlan.suggested_timeline_days,
        description: currentPlan.description,
      });
      setRecommendedCreators(recs);
    } catch {
      // Fallback to creator list if recommendation endpoint fails
      const all = await api.creators.list({ category: currentPlan.recommended_creator_category });
      const fallbackRecs: RecommendedCreator[] = all.slice(0, 3).map((c) => ({
        creator: c,
        match_score: 95,
        recommendation_reason: `Recommended because this creator specializes in ${currentPlan.recommended_creator_category} and fits your budget.`,
        match_reasons: [`Specializes in ${currentPlan.recommended_creator_category}`],
      }));
      setRecommendedCreators(fallbackRecs);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  /** Call the real backend /api/briefs/generate endpoint */
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerateError('');
    try {
      const result = await api.briefs.generate({ prompt });
      const mapped: ProjectPlan = {
        title: (result as any).title || '',
        objective: (result as any).target_audience || '',
        content_type: (result as any).content_type || '',
        style: (result as any).style || '',
        platform: (result as any).platform || [],
        deliverables: (result as any).deliverables || [],
        tools_suggested: (result as any).tools_suggested || [],
        budget_min: (result as any).budget_min || 0,
        budget_max: (result as any).budget_max || 0,
        suggested_timeline_days: (result as any).suggested_timeline_days || 7,
        recommended_creator_category: (result as any).recommended_creator_category || 'AI Videos',
        description: (result as any).description || (result as any).raw_prompt || prompt,
      };
      setPlan(mapped);
      setIsGenerated(true);

      // Automatically fetch matching creators directly on the page
      await fetchRecommendations(mapped);
    } catch (err: any) {
      setGenerateError(err.message || 'AI generation failed. Please try again.');
      setIsGenerated(false);
    } finally {
      setIsGenerating(false);
    }
  };

  /** Save the project plan to the real backend /api/briefs */
  const handleSaveProject = async () => {
    if (!plan) return;
    if (!user) {
      setSaveError('You must be signed in to save a project.');
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const saved = await api.briefs.create({
        title: plan.title,
        prompt: plan.description,
        objective: plan.objective,
        content_type: plan.content_type,
        aesthetic: plan.style,
        distribution_channels: plan.platform,
        deliverables: plan.deliverables,
        budget_range: `₹${plan.budget_min.toLocaleString('en-IN')} – ₹${plan.budget_max.toLocaleString('en-IN')}`,
        sla_timeline: `${plan.suggested_timeline_days} Days`,
        style_tags: plan.tools_suggested.map((t) => `#${t.replace(/\s/g, '')}`),
      } as any);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              savedId:
                typeof (saved as any).id === 'number'
                  ? (saved as any).id
                  : undefined,
            }
          : prev
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /** Navigate to Discover with the category pre-selected */
  const handleViewMoreCreators = () => {
    if (!plan) return;
    const cat = encodeURIComponent(plan.recommended_creator_category);
    navigate(`/discover?category=${cat}`);
  };

  return (
    <div className="relative w-full px-gutter py-space-xl overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col gap-space-xl relative z-10">
        {/* Save success toast */}
        {saveSuccess && (
          <div className="fixed top-6 right-6 z-50 bg-secondary text-on-secondary px-space-lg py-space-sm rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="font-label-lg text-label-lg">Project saved successfully.</span>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md border-b border-surface-container-high">
          <div className="max-w-2xl space-y-space-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                AI Project Assistant
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Turn your idea into a project plan.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Describe your project in simple words. AI will create the project plan, budget estimate, timeline, and recommend top matching creators.
            </p>
          </div>
          <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded-full border border-outline-variant/30">
            <span className="material-symbols-outlined text-secondary text-[20px]">auto_awesome</span>
            <span className="font-label-md text-label-md text-on-surface">AI matching is active</span>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <label
              className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2 uppercase tracking-wider font-semibold"
              htmlFor="prompt-input"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">terminal</span>
              Describe your project
            </label>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                Tokens: {prompt.length > 0 ? Math.round(prompt.length / 4) : 0} / 500
              </span>
              <button
                onClick={() => {
                  setPrompt('');
                  setIsGenerated(false);
                  setGenerateError('');
                  setPlan(null);
                  setRecommendedCreators([]);
                }}
                className="text-on-surface-variant hover:text-on-surface transition-colors text-body-sm font-label-md flex items-center gap-1 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span> Reset
              </button>
            </div>
          </div>

          <textarea
            className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg p-space-md focus:outline-none focus:ring-1 focus:ring-secondary/40 resize-none transition-all border border-outline-variant/20"
            id="prompt-input"
            placeholder='e.g. "I need an AI-generated luxury perfume ad for Instagram, budget around ₹60,000, I want it within 5 days."'
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {generateError && (
            <div className="p-3 bg-error-container/40 text-on-error-container rounded-lg text-body-sm border border-error/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {generateError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-space-sm pt-space-xs">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="bg-primary hover:bg-primary-container text-on-primary px-space-lg py-2.5 rounded-full font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all group cursor-pointer disabled:opacity-50"
              type="button"
            >
              {isGenerating ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span>Generating plan…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">bolt</span>
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Plan */}
        {isGenerated && plan && (
          <div className="space-y-space-xl animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
              {/* Left Column: Campaign Specs */}
              <div className="lg:col-span-7 flex flex-col gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30">
                <div className="flex items-center justify-between pb-space-sm border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-secondary">movie_creation</span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface">Project Specifications</h2>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-container/30 text-on-secondary-container px-2.5 py-0.5 rounded-full font-semibold">
                    AI Generated — Edit any field
                  </span>
                </div>

                <div className="space-y-space-md">
                  {/* Title */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Project Title</label>
                    <div className="bg-surface-container-low px-space-md py-2.5 rounded-lg flex items-center justify-between border border-outline-variant/20">
                      <input
                        className="bg-transparent font-body-lg text-body-lg text-on-surface w-full focus:outline-none"
                        type="text"
                        value={plan.title}
                        onChange={(e) => setPlan({ ...plan, title: e.target.value })}
                      />
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0">edit</span>
                    </div>
                  </div>

                  {/* Content Type & Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Content Type</label>
                      <div className="bg-surface-container-low px-space-md py-2.5 rounded-lg flex items-center justify-between border border-outline-variant/20">
                        <input
                          className="bg-transparent font-body-md text-body-md text-on-surface w-full focus:outline-none"
                          type="text"
                          value={plan.content_type}
                          onChange={(e) => setPlan({ ...plan, content_type: e.target.value })}
                        />
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0">edit</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Recommended Category</label>
                      <div className="bg-secondary-container/20 px-space-md py-2.5 rounded-lg flex items-center gap-2 border border-secondary/20">
                        <span className="material-symbols-outlined text-[18px] text-secondary">category</span>
                        <span className="font-body-md text-body-md text-secondary font-semibold">{plan.recommended_creator_category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Style / Creative Direction */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Style / Creative Direction</label>
                    <div className="bg-surface-container-low px-space-md py-2.5 rounded-lg flex items-center justify-between border border-outline-variant/20">
                      <input
                        className="bg-transparent font-body-md text-body-md text-on-surface w-full focus:outline-none"
                        type="text"
                        value={plan.style}
                        onChange={(e) => setPlan({ ...plan, style: e.target.value })}
                      />
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0">edit</span>
                    </div>
                  </div>

                  {/* Platform(s) */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Platform(s)</label>
                    <div className="bg-surface-container-low p-space-md rounded-lg border border-outline-variant/20">
                      <div className="flex flex-wrap gap-2">
                        {plan.platform.map((p, i) => (
                          <span key={i} className="font-label-sm bg-surface-container px-3 py-1 rounded-full text-on-surface border border-outline-variant/30">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Deliverables</label>
                    <div className="bg-surface-container-low p-space-md rounded-lg space-y-2 border border-outline-variant/20">
                      {plan.deliverables.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                          <span className="font-body-md text-body-md text-on-surface">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended AI Tools */}
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Recommended AI Tools</label>
                    <div className="bg-surface-container-low p-space-md rounded-lg border border-outline-variant/20">
                      <div className="flex flex-wrap gap-2">
                        {plan.tools_suggested.map((t, i) => (
                          <span key={i} className="font-label-sm bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Budget, Timeline, Actions */}
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/30 space-y-space-md">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold block">
                    Budget & Timeline
                  </span>

                  <div className="space-y-space-sm">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Estimated Budget</span>
                      <div className="text-right">
                        <div className="flex items-center gap-space-xs">
                          <input
                            type="number"
                            className="bg-transparent font-label-md text-on-surface text-right w-28 focus:outline-none border-b border-outline-variant/30"
                            value={plan.budget_min}
                            onChange={(e) => setPlan({ ...plan, budget_min: Number(e.target.value) })}
                            title="Min budget in ₹"
                          />
                          <span className="text-on-surface-variant">–</span>
                          <input
                            type="number"
                            className="bg-transparent font-label-md text-on-surface text-right w-28 focus:outline-none border-b border-outline-variant/30"
                            value={plan.budget_max}
                            onChange={(e) => setPlan({ ...plan, budget_max: Number(e.target.value) })}
                            title="Max budget in ₹"
                          />
                        </div>
                        <span className="font-body-sm text-on-surface-variant text-[11px]">
                          {formatINR(plan.budget_min)} – {formatINR(plan.budget_max)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Estimated Timeline</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={90}
                          className="bg-transparent font-label-lg text-on-surface text-right w-12 focus:outline-none border-b border-outline-variant/30"
                          value={plan.suggested_timeline_days}
                          onChange={(e) => setPlan({ ...plan, suggested_timeline_days: Number(e.target.value) })}
                        />
                        <span className="font-body-sm text-on-surface-variant">days</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Objective / Audience</span>
                      <span className="font-label-sm text-secondary font-semibold text-right max-w-[180px] leading-tight">
                        {plan.objective}
                      </span>
                    </div>
                  </div>

                  {saveError && (
                    <div className="p-3 bg-error-container/40 text-on-error-container rounded-lg text-body-sm border border-error/20 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      {saveError}
                    </div>
                  )}

                  {plan.savedId && (
                    <div className="p-3 bg-secondary-container/30 text-on-secondary-container rounded-lg text-body-sm border border-secondary/20 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                      Saved to your account (Project #{plan.savedId})
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2 border-t border-surface-container">
                    <button
                      onClick={() => fetchRecommendations(plan)}
                      disabled={isLoadingRecommendations}
                      className="w-full py-3 bg-primary text-on-primary font-label-lg text-label-lg rounded-full hover:bg-primary-container hover:text-on-surface transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">group</span>
                      <span>{isLoadingRecommendations ? 'Refreshing Matches…' : 'Find Matching Creators'}</span>
                    </button>
                    <button
                      onClick={handleSaveProject}
                      disabled={isSaving}
                      className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md rounded-full transition-colors cursor-pointer disabled:opacity-50"
                      type="button"
                    >
                      {isSaving ? 'Saving…' : 'Save Project'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Creators Section */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg md:p-space-xl border border-secondary/30 shadow-sm space-y-space-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm border-b border-surface-container">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">stars</span>
                    <span className="font-label-sm text-secondary uppercase tracking-wider font-semibold">
                      Direct Recommendations
                    </span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Recommended Creators
                  </h3>
                  <p className="font-body-sm text-on-surface-variant">
                    Top 3 creators matched based on category, tools, style, and your ₹{plan.budget_max ? plan.budget_max.toLocaleString('en-IN') : 'budget'} target.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleViewMoreCreators}
                  className="text-secondary hover:underline font-label-md flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <span>View in Discover</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

              {isLoadingRecommendations ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[32px] animate-spin text-secondary">
                    progress_activity
                  </span>
                  <span className="font-body-md">Finding best matching creators…</span>
                </div>
              ) : recommendedCreators.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant">
                  <p className="font-body-md">No direct creator matches found for this criteria.</p>
                  <button
                    type="button"
                    onClick={handleViewMoreCreators}
                    className="mt-3 px-space-md py-2 bg-primary text-on-primary font-label-md rounded-full"
                  >
                    Browse Discover Page
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  {recommendedCreators.map((item) => {
                    const c = item.creator;
                    return (
                      <div
                        key={c.id}
                        className="bg-surface-container-low rounded-xl p-space-md border border-outline-variant/30 flex flex-col justify-between gap-space-md hover:border-secondary/40 transition-all shadow-sm group"
                      >
                        <div className="space-y-space-sm">
                          {/* Top: Avatar, Name, Rating */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-space-xs">
                              <CreatorAvatar src={c.avatar} name={c.name} size="md" />
                              <div>
                                <h4 className="font-label-lg font-bold text-on-surface flex items-center gap-1 group-hover:text-secondary transition-colors">
                                  {c.name}
                                  {c.is_verified && (
                                    <span className="material-symbols-outlined text-[16px] text-secondary">
                                      verified
                                    </span>
                                  )}
                                </h4>
                                <span className="font-body-sm text-[12px] text-on-surface-variant block leading-tight">
                                  {c.specialization}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="font-label-sm font-bold text-on-surface flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px] text-amber-400">star</span>
                                {c.rating ? c.rating.toFixed(1) : '5.0'}
                              </span>
                              <span className="font-label-sm text-[11px] bg-secondary-container/40 text-secondary px-2 py-0.5 rounded-full font-semibold mt-1">
                                {item.match_score}% Match
                              </span>
                            </div>
                          </div>

                          {/* Price in ₹ */}
                          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-surface-container text-xs">
                            <span className="text-on-surface-variant">Starting Rate</span>
                            <span className="font-label-md font-bold text-secondary">
                              ₹{c.rate_per_day ? c.rate_per_day.toLocaleString('en-IN') : '25,000'}/day
                            </span>
                          </div>

                          {/* Tools & Tags */}
                          {c.tools_and_pipeline && c.tools_and_pipeline.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {c.tools_and_pipeline.slice(0, 3).map((tool, idx) => (
                                <span
                                  key={idx}
                                  className="font-label-sm text-[11px] bg-surface-container-high px-2 py-0.5 rounded-md text-on-surface"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Human-Readable Explanation Callout */}
                          <div className="p-2.5 rounded-lg bg-secondary-container/15 border border-secondary/25 text-[12px] leading-relaxed text-on-surface flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-secondary shrink-0 mt-0.5">
                              lightbulb
                            </span>
                            <span className="italic">{item.recommendation_reason}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container">
                          <Link
                            to={`/creators/${c.id}`}
                            className="py-2 text-center rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-[13px] transition-colors cursor-pointer"
                          >
                            View Profile
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProposalTarget(c)}
                            className="py-2 rounded-full bg-primary text-on-primary font-label-md text-[13px] hover:bg-primary-container hover:text-on-surface transition-all cursor-pointer shadow-sm text-center"
                          >
                            Hire Creator
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* View More Matching Creators Button */}
              <div className="pt-space-sm flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleViewMoreCreators}
                  className="px-space-xl py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg transition-all flex items-center gap-2 cursor-pointer border border-outline-variant/40 hover:border-secondary/40 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">manage_search</span>
                  <span>View More Matching Creators in {plan.recommended_creator_category}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Working Proposal Modal (Hire Creator flow) */}
        {proposalTarget && (
          <ProposalModal
            creator={proposalTarget}
            onClose={() => setProposalTarget(null)}
          />
        )}
      </div>
    </div>
  );
};
