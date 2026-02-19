import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed preset proposals (run once via Convex Dashboard or CLI)
export const seedPresets = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if presets already exist
    const existing = await ctx.db
      .query("proposals")
      .filter((q) => q.eq(q.field("isPreset"), true))
      .first();

    if (existing) {
      return "Presets already exist";
    }

    const presets = [
      // Date Spots
      {
        title: "東京タワー展望台 🗼",
        description: "東京の夜景を一望できる定番デートスポット。イルミネーション期間は特にロマンチック。",
        imageUrl: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?q=80&w=600&h=800&auto=format&fit=crop",
        category: "date_spot",
        location: "東京都港区",
        price: "¥1,200",
        url: "https://www.tokyotower.co.jp",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        title: "お台場海浜公園 🌊",
        description: "レインボーブリッジを眺めながら散歩。夕暮れ時が特におすすめ。",
        imageUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?q=80&w=600&h=800&auto=format&fit=crop",
        category: "date_spot",
        location: "東京都江東区",
        price: "無料",
        url: "https://www.tptc.co.jp",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        title: "井の頭恩賜公園 🦢",
        description: "ボートに乗ったり、桜や紅葉を楽しんだり。吉祥寺の街歩きにも便利。",
        imageUrl: "https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=600&h=800&auto=format&fit=crop",
        category: "date_spot",
        location: "東京都武蔵野市",
        price: "無料",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      // Restaurants
      {
        title: "焼肉・炭火焼鳥 🍖",
        description: "個室でゆっくり過ごせるお店。コース料理で特別な日にも最適。",
        imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=600&h=800&auto=format&fit=crop",
        category: "restaurant",
        location: "渋谷・恵比寿エリア",
        price: "¥5,000〜",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        title: "カフェでんたく ☕",
        description: "隠れ家的な落ち着いたカフェ。手作りスイーツが絶品。",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&h=800&auto=format&fit=crop",
        category: "restaurant",
        location: "下北沢",
        price: "¥1,000〜",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        title: "イタリアン・トラットリア 🍝",
        description: "本格的なイタリアン。ワインと一緒にゆっくり楽しもう。",
        imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=600&h=800&auto=format&fit=crop",
        category: "restaurant",
        location: "代官山",
        price: "¥4,000〜",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      // Activities
      {
        title: "ボウリング 🎳",
        description: "久しぶりにボウリングはいかが？勝負しても楽しい！",
        imageUrl: "https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?q=80&w=600&h=800&auto=format&fit=crop",
        category: "activity",
        location: "新宿・池袋エリア",
        price: "¥800/ゲーム",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        title: "映画館デート 🎬",
        description: "話題の映画を一緒に観よう。ポップコーンも忘れずに！",
        imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&h=800&auto=format&fit=crop",
        category: "activity",
        location: "各地",
        price: "¥1,900〜",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        title: "水族館 🐠",
        description: "美しい海洋生物に癒される。クリスマス時期のイルミネーションも人気。",
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600&h=800&auto=format&fit=crop",
        category: "activity",
        location: "品川・墨田水族館",
        price: "¥2,500〜",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      // Travel
      {
        title: "箱根温泉旅行 ♨️",
        description: "日帰りでも泊まりでも。温泉でリフレッシュして富士山を眺めよう。",
        imageUrl: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?q=80&w=600&h=800&auto=format&fit=crop",
        category: "travel",
        location: "神奈川県箱根",
        price: "¥10,000〜",
        url: "https://www.hakone.or.jp",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
      {
        title: "鎌倉・江ノ島散策 ⛩️",
        description: "歴史ある寺社と海の幸を楽しんで。小旅行気分で。",
        imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&h=800&auto=format&fit=crop",
        category: "travel",
        location: "神奈川県鎌倉市",
        price: "¥3,000〜",
        isPreset: true,
        isActive: true,
        createdAt: Date.now(),
      },
    ];

    // Insert all presets
    for (const preset of presets) {
      await ctx.db.insert("proposals", preset);
    }

    return `Seeded ${presets.length} preset proposals`;
  },
});
