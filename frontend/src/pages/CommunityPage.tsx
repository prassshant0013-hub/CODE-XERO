import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { CommunityPost, Creator, PostCommentItem } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatCompactNumber } from '../lib/formatters';

const deduplicatePosts = (postList: CommunityPost[]): CommunityPost[] => {
  const seen = new Set<string>();
  return postList.filter((post) => {
    if (!post?.id || seen.has(String(post.id))) return false;
    seen.add(String(post.id));
    return true;
  });
};

const AVAILABLE_TOOLS = [
  'Midjourney v6',
  'Runway Gen-3',
  'Flux 1.1 Pro',
  'Sora Enterprise',
  'ComfyUI',
  'Kling AI',
  'Stable Video',
  'ElevenLabs',
];

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postType, setPostType] = useState<CommunityPost['post_type']>('Showcase');
  const [selectedTools, setSelectedTools] = useState<string[]>(['Midjourney v6', 'Runway Gen-3']);
  const [imageUrl, setImageUrl] = useState('');
  const [showToolPicker, setShowToolPicker] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showCommentBox, setShowCommentBox] = useState<Record<string, boolean>>({});
  const [postCommentsMap, setPostCommentsMap] = useState<Record<string, PostCommentItem[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCommunityData();
  }, [activeFilter]);

  const loadCommunityData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [p, c] = await Promise.all([
        api.community.getPosts(activeFilter),
        api.creators.list(),
      ]);
      setPosts(deduplicatePosts(p));
      setCreators(c);

      // Pre-populate existing comments from posts into state map
      const initialComments: Record<string, PostCommentItem[]> = {};
      p.forEach((post) => {
        if (post.comments && post.comments.length > 0) {
          initialComments[post.id] = post.comments;
        }
      });
      setPostCommentsMap((prev) => ({ ...prev, ...initialComments }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load community feed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreatePost = async () => {
    if (isSubmitting) return;
    if (!postContent.trim()) return;
    if (!user) {
      setErrorMessage('Please sign in to publish a post to the community.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const newP = await api.community.createPost({
        title: postTitle.trim() || (postContent.length > 50 ? postContent.slice(0, 47) + '...' : postContent),
        body: postContent.trim(),
        post_type: postType,
        pipeline_badges: selectedTools.length > 0 ? selectedTools : ['Midjourney v6', 'Runway Gen-3'],
        media_url: imageUrl.trim() || undefined,
      });
      setPosts((prev) => deduplicatePosts([newP, ...prev]));
      setPostContent('');
      setPostTitle('');
      setImageUrl('');
      setShowToolPicker(false);
      setShowImageInput(false);
      showToast('Post published successfully to the community feed!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish post. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      setErrorMessage('Please sign in to like community posts.');
      return;
    }

    try {
      const res = await api.community.likePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked: res.liked,
                likes_count: res.likes_count,
              }
            : p
        )
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to like post.');
    }
  };

  const toggleCommentsBox = async (postId: string) => {
    const nextState = !showCommentBox[postId];
    setShowCommentBox((prev) => ({ ...prev, [postId]: nextState }));

    if (nextState && !postCommentsMap[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      try {
        const comments = await api.community.getComments(postId);
        setPostCommentsMap((prev) => ({ ...prev, [postId]: comments }));
      } catch {
        // Fallback to empty if fetch fails
        setPostCommentsMap((prev) => ({ ...prev, [postId]: [] }));
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    if (!user) {
      setErrorMessage('Please sign in to comment.');
      return;
    }

    try {
      const newComment = await api.community.commentOnPost(postId, text.trim());
      setPostCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to post comment.');
    }
  };

  const handleShare = (post: CommunityPost) => {
    const shareUrl = `${window.location.origin}/community#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Post link copied to clipboard!');
      }).catch(() => {
        showToast(`Post URL: ${shareUrl}`);
      });
    } else {
      showToast(`Post URL: ${shareUrl}`);
    }
  };

  const toggleToolTag = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  return (
    <div className="flex flex-col w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-secondary text-on-secondary px-5 py-3 rounded-full shadow-2xl font-label-md flex items-center gap-2 animate-fade-in border border-secondary-container">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Feed Header Section */}
      <section className="max-w-7xl mx-auto px-gutter w-full pt-space-lg pb-space-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-md">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-space-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                Community Feed
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              The Creative AI Community
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
              Show your work, find collaborators, and discover what’s being built across leading generative studios.
            </p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`inline-flex items-center gap-2 px-space-md py-2.5 rounded-full font-label-lg text-label-lg transition-colors cursor-pointer ${
                showFilterBar || activeFilter !== 'All'
                  ? 'bg-secondary/20 text-secondary border border-secondary/40'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Filter: {activeFilter}</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('composer-textarea');
                el?.focus();
              }}
              className="inline-flex items-center gap-2 px-space-lg py-2.5 bg-primary text-on-primary hover:bg-primary-container hover:text-on-surface font-label-lg text-label-lg rounded-full transition-all shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">edit_square</span>
              <span>Create post</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilterBar && (
          <div className="pt-2 pb-4 flex items-center gap-2 flex-wrap animate-fade-in border-t border-outline-variant/20">
            <span className="font-label-sm text-on-surface-variant uppercase tracking-wider text-xs font-semibold mr-1">
              Filter By Type:
            </span>
            {[
              { label: 'All Posts', value: 'All' },
              { label: 'Showcase', value: 'Showcase' },
              { label: 'Looking for Creator', value: 'Looking for creator' },
              { label: 'Offering Service', value: 'Offering service' },
              { label: 'Collaboration', value: 'Collaboration' },
              { label: 'Open Brief', value: 'Open brief' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setActiveFilter(f.value)}
                className={`px-3 py-1 rounded-full font-label-sm text-xs tracking-wider transition-colors cursor-pointer ${
                  activeFilter === f.value
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-error-container/40 text-on-error-container rounded-xl text-body-sm border border-error/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-error">error</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 text-on-error-container hover:opacity-70"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}
      </section>

      {/* Main Stream (8 Col) & Editorial Sidebar (4 Col) */}
      <div className="max-w-7xl mx-auto px-gutter w-full pb-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Feed Column (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-space-lg">
            {/* Post Composer Card */}
            <div className="bg-surface-container-low rounded-xl p-space-md md:p-space-lg shadow-sm border border-outline-variant/30">
              <div className="flex items-start gap-space-sm mb-space-sm">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary font-label-md font-bold">
                  {user ? (user.name ? user.name[0].toUpperCase() : 'U') : 'C'}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Post Title (optional)..."
                    className="w-full bg-surface text-on-surface font-headline-sm text-[16px] px-3 py-1.5 rounded-lg placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary/50 border border-outline-variant/20"
                  />
                  <textarea
                    id="composer-textarea"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full bg-surface text-on-surface font-body-md text-body-md p-space-sm rounded-lg resize-none placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-secondary/50 shadow-inner border border-outline-variant/20"
                    placeholder="Share what you created, what you need, or who you’re looking for..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Post Type Selector Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 pb-space-sm">
                {[
                  { label: 'Showcase work', type: 'Showcase' },
                  { label: 'Looking for creator', type: 'Looking for creator' },
                  { label: 'Offering service', type: 'Offering service' },
                  { label: 'Collaboration request', type: 'Collaboration' },
                  { label: 'Open brief', type: 'Open brief' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setPostType(item.type as any)}
                    className={`px-space-sm py-1 font-label-sm text-label-sm uppercase tracking-wider rounded-full transition-colors cursor-pointer ${
                      postType === item.type
                        ? 'bg-primary text-on-primary font-semibold'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Tool Picker Expansion */}
              {showToolPicker && (
                <div className="p-3 bg-surface rounded-lg mb-space-sm border border-outline-variant/20 space-y-2 animate-fade-in">
                  <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant block font-semibold">
                    Select AI Models & Pipeline Tools:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVAILABLE_TOOLS.map((tool) => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleToolTag(tool)}
                        className={`px-2.5 py-1 rounded-full font-label-sm text-xs transition-colors cursor-pointer ${
                          selectedTools.includes(tool)
                            ? 'bg-secondary text-on-secondary font-semibold'
                            : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                        }`}
                      >
                        {selectedTools.includes(tool) ? '✓ ' : '+ '}
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image URL Expansion */}
              {showImageInput && (
                <div className="p-3 bg-surface rounded-lg mb-space-sm border border-outline-variant/20 space-y-2 animate-fade-in">
                  <span className="font-label-sm text-xs uppercase tracking-wider text-on-surface-variant block font-semibold">
                    Attach Image URL:
                  </span>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-surface-container text-on-surface text-body-sm px-3 py-1.5 rounded-lg border border-outline-variant/30 focus:outline-none focus:border-secondary"
                  />
                  {imageUrl && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-outline-variant/30 mt-1">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-space-xs border-t border-surface-container-highest/60">
                <div className="flex items-center gap-space-xs">
                  <button
                    onClick={() => setShowImageInput(!showImageInput)}
                    className={`flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
                      showImageInput || imageUrl ? 'bg-secondary/15 text-secondary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                    <span className="hidden sm:inline">Attach Image</span>
                  </button>

                  <button
                    onClick={() => setShowToolPicker(!showToolPicker)}
                    className={`flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
                      showToolPicker ? 'bg-secondary/15 text-secondary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">neurology</span>
                    <span className="hidden sm:inline">Tag Models ({selectedTools.length})</span>
                  </button>
                </div>

                <button
                  onClick={handleCreatePost}
                  disabled={isSubmitting || !postContent.trim()}
                  className="px-space-md py-2 bg-primary text-on-primary font-label-md text-label-md rounded-full hover:bg-primary-container hover:text-on-surface transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  type="button"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish to community'}
                </button>
              </div>
            </div>

            {/* Posts Stream */}
            {isLoading ? (
              <LoadingSpinner message="Loading community feed..." />
            ) : posts.length === 0 ? (
              <div className="bg-surface-container-low rounded-xl p-space-xl text-center border border-outline-variant/30 space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">forum</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">No community posts yet</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                  Be the first to share an AI creation, brief, or service with the community.
                </p>
              </div>
            ) : (
              posts.map((post) => {
                const currentComments = postCommentsMap[post.id] || post.comments || [];
                const creatorProfilePath = post.creator_id ? `/creators/${post.creator_id}` : null;

                return (
                  <article
                    key={post.id}
                    id={`post-${post.id}`}
                    className="bg-surface-container-low rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md transition-all hover:border-outline-variant border border-outline-variant/30"
                  >
                    {/* Author Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {creatorProfilePath ? (
                          <Link to={creatorProfilePath} className="group">
                            <div className="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline-sm text-headline-sm overflow-hidden group-hover:scale-105 transition-transform">
                              {post.author_avatar ? (
                                <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                              ) : (
                                post.author_initial || (post.author_name ? post.author_name[0] : 'M')
                              )}
                            </div>
                          </Link>
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-headline-sm text-headline-sm overflow-hidden">
                            {post.author_avatar ? (
                              <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                            ) : (
                              post.author_initial || (post.author_name ? post.author_name[0] : 'U')
                            )}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            {creatorProfilePath ? (
                              <Link to={creatorProfilePath} className="font-headline-sm text-[18px] text-on-surface leading-tight hover:text-secondary transition-colors font-semibold">
                                {post.author_name}
                              </Link>
                            ) : (
                              <span className="font-headline-sm text-[18px] text-on-surface leading-tight font-semibold">
                                {post.author_name}
                              </span>
                            )}

                            {post.author_badge && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wider font-semibold ${
                                  post.badge_class || 'bg-secondary-fixed text-on-secondary-fixed'
                                }`}
                              >
                                {post.author_badge}
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                            {post.author_title} • {post.time_ago}
                          </p>
                        </div>
                      </div>

                      {/* Post Type Pill & Share */}
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[10px] uppercase tracking-wider font-semibold">
                          {post.post_type}
                        </span>
                        <button
                          onClick={() => handleShare(post)}
                          title="Share post"
                          className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container cursor-pointer transition-colors"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">share</span>
                        </button>
                      </div>
                    </div>

                    {/* Body Title & Text */}
                    <div className="space-y-space-xs">
                      {post.title && post.title !== post.body && (
                        <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                          {post.title}
                        </h2>
                      )}
                      <p className="font-body-md text-body-md text-on-surface leading-relaxed whitespace-pre-line">
                        {post.body}
                      </p>
                    </div>

                    {/* Pipeline Badges */}
                    {post.pipeline_badges && post.pipeline_badges.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {post.pipeline_badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 bg-surface-container-high text-on-surface font-label-sm text-xs uppercase tracking-wider rounded-md"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Artwork Image */}
                    {post.media_url && (
                      <div className="w-full rounded-lg overflow-hidden bg-surface-container shadow-inner max-h-[500px]">
                        <img
                          alt={post.media_caption || post.title}
                          className="w-full h-auto max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-500"
                          src={post.media_url}
                          onError={(e) => {
                            // Hide broken image gracefully
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Interaction Bar */}
                    <div className="flex items-center justify-between pt-space-xs border-t border-surface-container-highest/60">
                      <div className="flex items-center gap-space-md">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`inline-flex items-center gap-1.5 transition-colors font-label-md text-label-md cursor-pointer ${
                            post.is_liked ? 'text-secondary font-semibold' : 'text-on-surface-variant hover:text-secondary'
                          }`}
                          type="button"
                          title={`${post.likes_count} likes`}
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={post.is_liked ? { fontVariationSettings: "'FILL' 1" } : {}}
                          >
                            favorite
                          </span>
                          <span>{formatCompactNumber(post.likes_count)}</span>
                        </button>

                        <button
                          onClick={() => toggleCommentsBox(post.id)}
                          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-label-md text-label-md cursor-pointer"
                          type="button"
                          title={`${post.comments_count} comments`}
                        >
                          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                          <span>{formatCompactNumber(post.comments_count)} comments</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-space-xs">
                        {creatorProfilePath && (
                          <Link
                            to={creatorProfilePath}
                            className="px-space-md py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs rounded-full transition-colors font-semibold"
                          >
                            View Creator Profile
                          </Link>
                        )}
                        <Link
                          to="/briefs"
                          className="px-space-md py-1.5 bg-primary text-on-primary hover:bg-primary-container hover:text-on-surface font-label-md text-xs rounded-full transition-all shadow-sm"
                        >
                          Create Project
                        </Link>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {showCommentBox[post.id] && (
                      <div className="pt-space-xs space-y-space-sm border-t border-outline-variant/20 animate-fade-in">
                        {/* Comments List */}
                        {loadingComments[post.id] ? (
                          <p className="text-body-sm text-on-surface-variant text-xs py-2">Loading comments...</p>
                        ) : currentComments.length > 0 ? (
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {currentComments.map((c) => (
                              <div key={c.id} className="bg-surface p-2.5 rounded-lg border border-outline-variant/20 flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0 font-label-sm font-bold text-xs">
                                  {c.user_avatar ? (
                                    <img src={c.user_avatar} alt={c.user_name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    c.user_name ? c.user_name[0].toUpperCase() : 'U'
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="font-label-sm font-semibold text-on-surface text-xs truncate">
                                        {c.user_name}
                                      </span>
                                      {c.user_role && (
                                        <span className="px-1.5 py-0.2 rounded font-label-sm text-[9px] bg-surface-container text-on-surface-variant uppercase">
                                          {c.user_role}
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-label-sm text-[10px] text-on-surface-variant shrink-0">
                                      {c.created_at}
                                    </span>
                                  </div>
                                  <p className="font-body-sm text-body-sm text-on-surface mt-1 leading-relaxed">
                                    {c.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-body-sm text-on-surface-variant text-xs py-1 italic">
                            No comments yet. Be the first to comment!
                          </p>
                        )}

                        {/* Comment Input */}
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={user ? "Write a comment..." : "Sign in to comment..."}
                            disabled={!user}
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                            className="flex-1 bg-surface text-on-surface text-body-sm px-3.5 py-2 rounded-lg border border-outline-variant focus:outline-none focus:border-secondary disabled:opacity-60"
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!user || !commentInputs[post.id]?.trim()}
                            className="px-4 py-2 bg-primary text-on-primary font-label-sm text-xs rounded-lg hover:bg-primary-container hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* Editorial Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-space-lg">
            {/* Featured Creators */}
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-high mb-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Featured Creators
                </span>
                <Link to="/leaderboard" className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface">
                  Rankings →
                </Link>
              </div>

              <div className="space-y-space-sm">
                {creators.slice(0, 4).map((creator) => (
                  <div key={creator.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <img
                        alt={creator.name}
                        className="w-9 h-9 rounded-full object-cover bg-surface-container"
                        src={creator.avatar || creator.hero_image}
                      />
                      <div className="truncate">
                        <h4 className="font-label-md text-label-md text-on-surface truncate font-semibold">
                          {creator.name}
                        </h4>
                        <span className="font-body-sm text-xs text-on-surface-variant block truncate">
                          {creator.specialization.split('•')[0]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/creators/${creator.id}`)}
                      className="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded-full font-label-sm text-xs text-on-surface cursor-pointer font-medium"
                    >
                      Portfolio
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Ecosystems */}
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm border border-outline-variant/30">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block mb-space-sm">
                AI Tools in Demand
              </span>
              <div className="space-y-2">
                {[
                  { name: 'Sora Enterprise v2', use: 'Commercial Video', count: '48% of briefs' },
                  { name: 'Runway Gen-3 Alpha', use: 'Kinetic Motion', count: '32% of briefs' },
                  { name: 'Flux 1.1 Pro Ultra', use: 'Fashion Images', count: '20% of briefs' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-outline-variant/20">
                    <div>
                      <span className="font-label-md text-on-surface block font-medium">{item.name}</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">{item.use}</span>
                    </div>
                    <span className="font-label-sm text-[10px] text-secondary font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curator's Dispatch */}
            <div className="bg-surface-container rounded-xl p-space-md space-y-space-xs border border-secondary/20">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold block">
                Community Highlight
              </span>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">
                Showcase Real Workflows
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Recruiters look for consistent seeds, clean prompts, and predictable delivery turnaround. Share your production experiments to get hired directly.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
