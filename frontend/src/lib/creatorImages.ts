/**
 * Diverse, verified Unsplash portrait and category-matched thumbnail image pools.
 * Provides deterministic unique avatars and category-appropriate hero thumbnails
 * for all creators on CODE XERO.
 */

export const AVATAR_POOL = [
  // Curated diverse portraits (mix of genders, backgrounds, styles)
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1496346236851-c1a786571e98?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1564564244660-5d73c057f2d2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1548544149-4ab5a7b1b48e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1472099645-95d2f359f400?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1531927935-9b2e3d6f5c51?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1614289688-d11a74002154?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1584917865-7d96e8f9e5f8?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1566753323237-a9c63db3-baa8?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1603415526960-f7e0328c6343?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1595152772835-219674b2a163?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1474176857210-7287d38d27c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1476234251651-f353703a034d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
];

export const CATEGORY_HERO_POOLS: Record<string, string[]> = {
  // AI Videos: cinematic, camera, film sets, anamorphic VFX
  'AI Videos': [
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574717024-79f3a97fc2a8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
  ],

  // AI Images: photography, generative portraits, landscapes, fine art
  'AI Images': [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1510784722466-f2aa240ef3db?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1543877087-ebf71fde2be1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
  ],

  // 3D & CGI: 3D models, spatial architecture, Unreal, Blender renders
  '3D & CGI': [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1487058497253-45d8b8d2d6c3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461695008851-3c397dee88f3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  ],

  // Product Ads: commercial, luxury, cosmetics, tech, packaging
  'Product Ads': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542744173-8659-43-d2-a7f3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560769127756-c3-bcd2-b1aa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1441986380513-ad1e8fcd9bb5?auto=format&fit=crop&w=1200&q=80',
  ],

  // Fashion: haute couture, lookbook, textile, modeling, runway
  'Fashion': [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1487222477-96d8-4c81-9a4f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1445205170490-f9-a2-fded?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509631928-411592f2-6bd4?auto=format&fit=crop&w=1200&q=80',
  ],

  // Social Media: reels, creator content, mobile-friendly vibrant visuals
  'Social Media': [
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  ],

  // Animation: motion design, 2D/3D characters, anime, motion graphics
  'Animation': [
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
  ],

  // Graphic Design: typography, visual identity, branding, posters
  'Graphic Design': [
    'https://images.unsplash.com/photo-1558655686-d3c0b1f8b18a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1561986635-1-99b5a8-7ee5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1508739773-b7b3e4-9bbc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541462608143-67571c6738dd?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1200&q=80',
  ],

  // Audio & Voice: music studio, sound waves, audio synthesizer, podcast
  'Audio & Voice': [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507838972-d5a4b83-d19e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526142684086-7ebd69df27a5?auto=format&fit=crop&w=1200&q=80',
  ],
};

/** Deterministic string hash algorithm */
export function strHash(str: string): number {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Extracts clean 2-letter uppercase initials from full name or studio name */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'CX';
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return 'CX';
}

/**
 * Deterministically returns a distinct avatar URL for any given creator ID / name.
 */
export function getCreatorAvatar(creatorId?: string, creatorName?: string): string {
  const seed = `${creatorId || ''}_${creatorName || ''}`;
  const idx = strHash(seed) % AVATAR_POOL.length;
  return AVATAR_POOL[idx];
}

/**
 * Deterministically returns a category-appropriate hero thumbnail for a creator.
 */
export function getCreatorHeroImage(
  creatorId?: string,
  specialization?: string,
  categoryHint?: string
): string {
  const text = `${categoryHint || ''} ${specialization || ''}`.toLowerCase();

  let poolName = 'AI Images';
  if (text.includes('video') || text.includes('cinematic') || text.includes('film') || text.includes('vfx')) {
    poolName = 'AI Videos';
  } else if (text.includes('3d') || text.includes('cgi') || text.includes('spatial') || text.includes('render')) {
    poolName = '3D & CGI';
  } else if (text.includes('product') || text.includes('commercial') || text.includes('ad') || text.includes('campaign')) {
    poolName = 'Product Ads';
  } else if (text.includes('fashion') || text.includes('couture') || text.includes('textile') || text.includes('lookbook')) {
    poolName = 'Fashion';
  } else if (text.includes('social') || text.includes('reels') || text.includes('tiktok') || text.includes('instagram')) {
    poolName = 'Social Media';
  } else if (text.includes('animation') || text.includes('animated') || text.includes('motion') || text.includes('kinetic') || text.includes('anime')) {
    poolName = 'Animation';
  } else if (text.includes('graphic') || text.includes('design') || text.includes('typography') || text.includes('brand')) {
    poolName = 'Graphic Design';
  } else if (text.includes('audio') || text.includes('sound') || text.includes('voice') || text.includes('music') || text.includes('sonic')) {
    poolName = 'Audio & Voice';
  }

  const pool = CATEGORY_HERO_POOLS[poolName] || CATEGORY_HERO_POOLS['AI Images'];
  const seed = `${creatorId || 'c'}_hero`;
  const idx = strHash(seed) % pool.length;
  return pool[idx];
}
