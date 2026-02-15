export const PRESETS = [
    {
        id: 'preset-1',
        title: '水族館デート 🐬',
        description: 'ゆったり魚を見て癒やされよう',
        category: 'date_spot',
        image_url: 'https://images.unsplash.com/photo-1520698379669-0268ac35d947?auto=format&fit=crop&q=80',
    },
    {
        id: 'preset-2',
        title: '映画鑑賞 🎬',
        description: '新作映画を見に行こう！',
        category: 'date_spot',
        image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80',
    },
    {
        id: 'preset-3',
        title: 'マッサージしてほしい 💆',
        description: '最近疲れてるから15分くらい！',
        category: 'other',
        image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80',
    },
    {
        id: 'preset-4',
        title: '美味しい焼肉 🥩',
        description: 'スタミナつけに行こう',
        category: 'restaurant',
        image_url: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&q=80',
    },
    {
        id: 'preset-5',
        title: '二人だけの時間 (R-18) 💋',
        description: 'ゆっくり愛し合いたい',
        category: 'adult',
        image_url: 'https://images.unsplash.com/photo-1506806877478-a25eb31e4c76?auto=format&fit=crop&q=80',
    },
];

export const CATEGORIES = [
    {
        id: 'date_spot',
        label: 'デートスポット',
        icon: 'heart',
        color: '#FF4B4B',
        image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00'
    },
    {
        id: 'restaurant',
        label: 'レストラン',
        icon: 'restaurant',
        color: '#FF9F43',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
    },
    {
        id: 'activity',
        label: 'アクティビティ',
        icon: 'bicycle',
        color: '#54a0ff',
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874'
    },
    {
        id: 'travel',
        label: '旅行',
        icon: 'airplane',
        color: '#00d2d3',
        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'
    },
    {
        id: 'adult',
        label: '夜の営み',
        icon: 'moon',
        color: '#8854d0',
        isSensitive: true,
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'
    },
    {
        id: 'other',
        label: 'その他',
        icon: 'more-horizontal',
        color: '#888',
        image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348'
    },
];
