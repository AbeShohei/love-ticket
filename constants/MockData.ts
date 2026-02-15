
export const MOCK_PROPOSALS = [
    {
        id: 'mock-1',
        title: '水族館デート 🐬',
        description: '久しぶりに水族館に行きたい！イルカショー見たり、ゆっくり魚を見て癒やされよう。',
        category: 'date_spot',
        location: 'サンシャイン水族館',
        url: 'https://sunshinecity.jp/aquarium/',
        price: '約30,000円',
        image_url: 'https://picsum.photos/seed/aquarium/600/900',
        images: [
            'https://picsum.photos/seed/aquarium/600/900',
            'https://picsum.photos/seed/dolphin/600/900',
            'https://picsum.photos/seed/jellyfish/600/900',
        ],
        created_by: 'partner-id',
        couple_id: 'couple-id',
        is_active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'mock-2',
        title: '映画鑑賞 🎬',
        description: '気になってたあの新作映画、今週末に見に行かない？ポップコーン食べながら！',
        category: 'date_spot',
        location: 'TOHOシネマズ六本木',
        url: 'https://www.tohotheater.jp/',
        price: '約5,000円',
        image_url: 'https://picsum.photos/seed/movie/600/900',
        images: [
            'https://picsum.photos/seed/movie/600/900',
            'https://picsum.photos/seed/cinema/600/900',
            'https://picsum.photos/seed/popcorn/600/900',
        ],
        created_by: 'partner-id',
        couple_id: 'couple-id',
        is_active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'mock-3',
        title: '肩マッサージ券 💆',
        description: '最近仕事頑張ってるから、15分くらいマッサージしてあげる！',
        category: 'other',
        location: 'お家',
        url: '',
        price: 'プライスレス',
        image_url: 'https://picsum.photos/seed/relax/600/900',
        images: [
            'https://picsum.photos/seed/relax/600/900',
            'https://picsum.photos/seed/massage/600/900',
        ],
        created_by: 'partner-id',
        couple_id: 'couple-id',
        is_active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'mock-4',
        title: '美味しい焼肉 🥩',
        description: 'ボーナス入ったし、ちょっといい焼肉屋さんに行こう！スタミナつけたい。',
        category: 'restaurant',
        location: '叙々苑 游玄亭',
        url: 'https://www.jojoen.co.jp/',
        price: '約20,000円',
        image_url: 'https://picsum.photos/seed/meat/600/900',
        images: [
            'https://picsum.photos/seed/meat/600/900',
            'https://picsum.photos/seed/bbq/600/900',
            'https://picsum.photos/seed/beer/600/900',
        ],
        created_by: 'partner-id',
        couple_id: 'couple-id',
        is_active: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'mock-5',
        title: '二人だけの時間 (R-18) 💋',
        description: '今夜はゆっくり愛し合いたいな。準備しておくね。',
        category: 'adult',
        location: 'ホテル ラ・スイート',
        url: 'https://www.l-s.jp/',
        price: '約50,000円',
        image_url: 'https://picsum.photos/seed/night/600/900',
        images: [
            'https://picsum.photos/seed/night/600/900',
            'https://picsum.photos/seed/candle/600/900',
            'https://picsum.photos/seed/wine/600/900',
        ],
        created_by: 'partner-id',
        couple_id: 'couple-id',
        is_active: true,
        created_at: new Date().toISOString(),
    },
];

export const MOCK_MATCHES = [
    {
        id: 'match-1',
        matched_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        priority: 0,
        proposal: MOCK_PROPOSALS[0],
        couple_id: 'couple-id',
    },
    {
        id: 'match-2',
        matched_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        priority: 1, // Super Like
        proposal: MOCK_PROPOSALS[3],
        couple_id: 'couple-id',
    },
    {
        id: 'match-3',
        matched_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        priority: 0,
        proposal: MOCK_PROPOSALS[4],
        couple_id: 'couple-id',
    }
];

export const AD_MOCK_DATA = [
    {
        id: 'ad-1',
        isAd: true,
        title: 'Netflix 🍿',
        description: '今週末は二人で映画三昧！最新作から不朽の名作まで、Netflixで忘れられない時間を。',
        image_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&h=900&auto=format&fit=crop',
        category: 'ad',
        created_by: 'admob',
        url: 'https://www.netflix.com'
    },
    {
        id: 'ad-2',
        isAd: true,
        title: 'Starbucks ☕',
        description: 'ちょっと一息、季節の新作を。素敵な空間で、二人だけの会話を楽しんで。',
        image_url: 'https://images.unsplash.com/photo-1544787210-282dd74b00d7?q=80&w=600&h=900&auto=format&fit=crop',
        category: 'ad',
        created_by: 'admob',
        url: 'https://www.starbucks.co.jp'
    }
];
