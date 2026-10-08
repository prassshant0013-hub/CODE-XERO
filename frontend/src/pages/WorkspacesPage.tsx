import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Workspace } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const WorkspacesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deliverables' | 'chat' | 'assets' | 'legal'>('deliverables');
  const [chatMessage, setChatMessage] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const list = await api.workspaces.list();
      setWorkspaces(list);
      const queryId = searchParams.get('id');
      const current = queryId ? list.find((w) => w.id === queryId) || list[0] : list[0];
      setSelectedWs(current || null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedWs) return;
    await api.workspaces.sendMessage(selectedWs.id, chatMessage);
    const updated = await api.workspaces.getById(selectedWs.id);
    setSelectedWs(updated);
    setChatMessage('');
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!selectedWs) return;
    await api.workspaces.updateMilestone(selectedWs.id, milestoneId, 'completed');
    const updated = await api.workspaces.getById(selectedWs.id);
    setSelectedWs(updated);
    alert('Milestone approved. Escrow tranche released to creator.');
  };

  const handleRequestRevision = async () => {
    if (!selectedWs || !revisionNotes.trim()) return;
    const currentMilestone = selectedWs.milestones.find((m) => m.status === 'in_progress') || selectedWs.milestones[0];
    await api.workspaces.requestRevision(selectedWs.id, currentMilestone.id, revisionNotes);
    const updated = await api.workspaces.getById(selectedWs.id);
    setSelectedWs(updated);
    setShowRevisionModal(false);
    setRevisionNotes('');
    alert('Revision request logged and dispatched to the creator.');
  };

  const { user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Opening project workspaces..." />;
  }

  if (workspaces.length === 0 || !selectedWs) {
    return (
      <div className="max-w-7xl mx-auto w-full px-gutter py-space-xl">
        <div className="space-y-space-xs mb-space-xl">
          <div className="flex items-center gap-space-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              Project Workspaces
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Workspaces
          </h1>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-space-xl text-center border border-outline-variant/30 max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-surface-container-high text-secondary mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">workspaces</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">No active workspaces yet</h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {user?.role === 'creator'
              ? 'When a recruiter sends you a project proposal and you accept it, your private collaboration workspace will automatically be created here.'
              : 'When you hire a creator and they accept your proposal, a dedicated workspace with milestones and secure messaging will automatically be created here.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-space-sm">
            {user?.role === 'creator' ? (
              <Link
                to="/requests"
                className="px-space-lg py-2.5 rounded-full bg-primary text-on-primary font-label-lg hover:bg-primary-container hover:text-on-surface transition-all shadow-sm"
              >
                View Project Requests
              </Link>
            ) : (
              <Link
                to="/discover"
                className="px-space-lg py-2.5 rounded-full bg-primary text-on-primary font-label-lg hover:bg-primary-container hover:text-on-surface transition-all shadow-sm"
              >
                Explore Creators
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const completedCount = selectedWs.milestones.filter((m) => m.status === 'completed').length;
  const progressPercent = Math.round((completedCount / (selectedWs.milestones.length || 1)) * 100);

  return (
    <div className="flex flex-col w-full">
      {/* Context Header */}
      <section className="max-w-7xl mx-auto w-full px-gutter pt-space-lg pb-space-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md">
          <div className="space-y-space-xs max-w-2xl">
            <div className="flex items-center gap-space-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                Project Workspaces
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Recruiter & Creator Workspaces
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Manage production rooms, milestone reviews, approvals, and usage rights in one place.
            </p>
          </div>
          <div className="flex items-center gap-space-sm flex-shrink-0">
            {user?.role === 'creator' && (
              <Link
                to="/requests"
                className="px-space-md py-2.5 rounded-full bg-secondary/15 text-secondary hover:bg-secondary/25 transition-colors flex items-center gap-space-xs shadow-sm font-label-lg"
              >
                <span className="material-symbols-outlined text-[18px]">inbox</span>
                <span>Project Requests</span>
              </Link>
            )}
            <button className="px-space-md py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-lg text-label-lg hover:bg-surface-container-highest transition-colors flex items-center gap-space-xs shadow-sm cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Room Settings</span>
            </button>
            <button
              onClick={() => alert('To open a new production room, generate a brief or hire a creator.')}
              className="px-space-md py-2.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container hover:text-on-surface transition-all flex items-center gap-space-xs shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New workspace</span>
            </button>
          </div>
        </div>
      </section>

      {/* Two-Column Split */}
      <section className="max-w-7xl mx-auto w-full px-gutter pb-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Column: Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-space-md">
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-surface-container-high">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">
                    Active Production Rooms
                  </span>
                  <span className="bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                    {workspaces.length}
                  </span>
                </div>
              </div>

              <div className="space-y-space-xs">
                {workspaces.map((ws) => {
                  const isSelected = ws.id === selectedWs.id;
                  return (
                    <div
                      key={ws.id}
                      onClick={() => setSelectedWs(ws)}
                      className={`group relative p-space-md rounded-lg cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-surface-container-lowest shadow-sm border-secondary/40'
                          : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-space-xs mb-space-xs">
                        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold truncate">
                          {ws.category_tag}
                        </span>
                        {ws.unread_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-label-sm font-semibold text-on-surface bg-secondary-fixed/40 px-2 py-0.5 rounded-full">
                            {ws.unread_count} unread
                          </span>
                        )}
                      </div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface leading-snug group-hover:text-secondary transition-colors">
                        {ws.creator.name}
                      </h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 truncate">
                        {ws.title}
                      </p>
                      <div className="mt-space-sm pt-space-xs flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-on-surface font-label-sm text-label-sm bg-surface-container-high px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                          {ws.stage_tag}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                          ₹{ws.total_budget.toLocaleString('en-IN')} Total
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Escrow Guarantee Widget */}
            <div className="bg-surface-container rounded-xl p-space-md space-y-space-xs border border-outline-variant/30">
              <div className="flex items-center gap-space-xs text-secondary">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">
                  Smart Escrow Protection
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Client funds stay in CODE XERO escrow. Payments release only after you approve each milestone.
              </p>
            </div>
          </aside>

          {/* Right Column: Room Details */}
          <main className="lg:col-span-8 flex flex-col gap-space-md">
            {/* Project Header Banner Card */}
            <div className="bg-surface-container-low rounded-xl p-space-lg shadow-sm border border-outline-variant/30">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md">
                <div className="space-y-space-xs">
                  <div className="flex items-center gap-space-xs flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed text-label-sm font-label-sm uppercase tracking-wide">
                      Project #{selectedWs.brief_ref}
                    </span>
                    <span className="text-on-surface-variant font-label-sm text-label-sm">
                      Initiated {selectedWs.created_at}
                    </span>
                  </div>
                  <h2 className="font-display text-[32px] md:text-display text-on-surface tracking-tight leading-tight">
                    {selectedWs.title}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                    {selectedWs.description}
                  </p>
                </div>

                {/* Creator Mini Card */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl flex items-center gap-space-sm shadow-sm flex-shrink-0 border border-outline-variant/20">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-surface-container-high flex-shrink-0">
                    <img
                      className="w-full h-full object-cover"
                      alt={selectedWs.creator.name}
                      src={selectedWs.creator.avatar || selectedWs.creator.hero_image}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                        {selectedWs.creator.name}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">
                      Lead Content Creator
                    </span>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="mt-1 font-label-sm text-label-sm text-secondary hover:text-on-surface uppercase tracking-wider transition-colors flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">forum</span>
                      <span>Direct Message</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Escrow Milestone Progress Stepper */}
              <div className="mt-space-lg pt-space-md bg-surface-container-high/40 -mx-space-lg -mb-space-lg p-space-lg rounded-b-xl border-t border-outline-variant/20">
                <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-space-xs">
                  <span className="text-on-surface font-semibold">Escrow Milestone Progress</span>
                  <span>Overall: {progressPercent}% Fulfilled</span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-space-xs">
                  {selectedWs.milestones.map((m, idx) => (
                    <div key={m.id} className="flex flex-col gap-1.5">
                      <div
                        className={`h-1.5 w-full rounded-full ${
                          m.status === 'completed'
                            ? 'bg-primary'
                            : m.status === 'in_progress'
                            ? 'bg-secondary animate-pulse'
                            : 'bg-surface-container-highest'
                        }`}
                      />
                      <span className="font-label-sm text-[10px] text-on-surface truncate">
                        Step {idx + 1}: {m.title.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workspace Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-surface-container-high pb-2">
              {[
                { id: 'deliverables', label: 'Milestone Deliverables' },
                { id: 'chat', label: 'Room Chat' },
                { id: 'assets', label: 'Shared Files' },
                { id: 'legal', label: 'Usage Rights' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 font-label-md text-label-md rounded-full transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Deliverables */}
            {activeTab === 'deliverables' && (
              <div className="space-y-space-md">
                {selectedWs.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-space-md shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            milestone.status === 'completed'
                              ? 'bg-secondary'
                              : milestone.status === 'in_progress'
                              ? 'bg-secondary-container animate-pulse'
                              : 'bg-outline'
                          }`}
                        />
                        <span className="font-label-sm text-label-sm uppercase text-secondary font-semibold">
                          Milestone #{milestone.step_number}
                        </span>
                        <span className="font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                          ₹{Number(milestone.amount).toLocaleString('en-IN')} ({milestone.payout_percentage}%)
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-[19px] text-on-surface">
                        {milestone.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {milestone.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {milestone.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-secondary font-label-md bg-secondary-fixed/40 px-3 py-1 rounded-full">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          Approved & Escrow Released
                        </span>
                      ) : milestone.status === 'in_progress' ? (
                        <>
                          <button
                            onClick={() => setShowRevisionModal(true)}
                            className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm cursor-pointer"
                          >
                            Request Revision
                          </button>
                          <button
                            onClick={() => handleApproveMilestone(milestone.id)}
                            className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-sm hover:bg-primary-container hover:text-on-surface transition-all cursor-pointer shadow-sm"
                          >
                            Approve & Release Funds
                          </button>
                        </>
                      ) : (
                        <span className="text-on-surface-variant font-label-sm uppercase">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Chat */}
            {activeTab === 'chat' && (
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 space-y-space-md shadow-sm">
                <div className="space-y-space-sm max-h-96 overflow-y-auto pr-2">
                  {selectedWs.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-space-sm rounded-lg max-w-xl ${
                        msg.sender_role === 'system'
                          ? 'bg-surface-container mx-auto text-center'
                          : msg.sender_role === 'brand'
                          ? 'bg-surface-container-high ml-auto'
                          : 'bg-surface border border-outline-variant/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-label-sm text-on-surface font-semibold">{msg.sender_name}</span>
                        <span className="font-body-sm text-[10px] text-on-surface-variant">{msg.created_at}</span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface">{msg.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-surface-container">
                  <input
                    type="text"
                    placeholder="Write a message to the creator..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-surface-container-low text-on-surface px-4 py-2 rounded-full border border-outline-variant/30 focus:outline-none focus:border-secondary"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-5 py-2 bg-primary text-on-primary font-label-md rounded-full hover:bg-primary-container transition-all cursor-pointer shadow-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Assets */}
            {activeTab === 'assets' && (
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 space-y-space-sm shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Project Files</h3>
                {selectedWs.deliverables.map((del) => (
                  <div
                    key={del.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/20"
                  >
                    <div>
                      <span className="font-label-md text-on-surface block font-medium">{del.title}</span>
                      <span className="font-body-sm text-[12px] text-on-surface-variant">
                        {del.type} • {del.resolution} • {del.file_size}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container font-label-sm text-secondary font-semibold">
                      {del.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Legal */}
            {activeTab === 'legal' && (
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-outline-variant/30 space-y-space-sm shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Usage Rights</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  After the final escrow payment is released, commercial usage rights transfer to {selectedWs.brand_name}. Project files remain stored securely in the CODE XERO archive.
                </p>
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl p-space-lg shadow-2xl border border-outline-variant/30 space-y-space-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Request Milestone Revision</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Describe the specific adjustments to motion curves, textile drapery, or lighting parameters.
            </p>
            <textarea
              rows={4}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g., Please tone down the rim lighting intensity on the car windshield between 0:08 and 0:14..."
              className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-outline-variant focus:outline-none focus:border-secondary text-body-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 rounded-full bg-surface-container text-on-surface font-label-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRevision}
                className="px-5 py-2 rounded-full bg-primary text-on-primary font-label-md hover:bg-primary-container"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
