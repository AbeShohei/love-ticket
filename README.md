# Love Ticket

カップル向けデート計画アプリ。TinderスタイルのスワイプUIでデート提案を閲覧し、パートナーと一緒に日程を調整してデート計画を立てることができます。

## 機能

### デート案（スワイプ）
- カードを左右/上にスワイプしてデート案を評価
- 「気になる」「超いいね」「スキップ」の3つのアクション
- 広告カードの自動挿入（3枚ごと）

### チケット（マッチ）
- 気に入ったデート案をチケットとして管理
- カテゴリ別に整理
- デート計画の作成ウィザード

### スケジュール
- 確定したデート計画をカレンダー表示
- パートナーとの日程調整機能

### カタログ
- カテゴリからデート案を作成
- **AIスポット提案機能**（無料枠5回）
  - カテゴリ選択
  - 希望や要望の入力
  - 候補日の指定
  - AIがおすすめスポットを3件提案

### マイページ
- プロフィール管理
- パートナー連携（QRコード/ID共有）

## 技術スタック

- **Framework**: React Native with Expo 54
- **Language**: TypeScript
- **Navigation**: Expo Router 6
- **Backend**: Supabase（認証・データベース）
- **State Management**: Zustand
- **Animation**: React Native Reanimated + Gesture Handler
- **Ads**: Google AdMob

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# プラットフォーム別実行
npm run ios
npm run android
npm run web
```

## プロジェクト構成

```
love-ticket/
├── app/                    # Expo Router 画面
│   ├── (tabs)/            # タブナビゲーション
│   │   ├── index.tsx      # デート案（スワイプ）
│   │   ├── matches.tsx    # チケット
│   │   ├── schedule.tsx   # スケジュール
│   │   ├── explore.tsx    # カタログ
│   │   └── profile.tsx    # マイページ
│   ├── proposals/         # デート提案作成
│   ├── login.tsx
│   ├── register.tsx
│   └── pairing.tsx
├── components/            # 再利用可能コンポーネント
├── stores/                # Zustand ストア
│   ├── matchStore.ts
│   ├── planStore.ts
│   └── swipeStore.ts
├── providers/             # Context Provider
├── lib/
│   └── supabase.ts
├── constants/
│   ├── MockData.ts
│   └── Presets.ts
└── types/
    └── Proposal.ts
```

## 文字数制限

デート案作成時の入力制限：

| フィールド | 最大文字数 |
|-----------|-----------|
| タイトル | 40文字 |
| 詳細 | 60文字 |
| 場所 | 15文字 |
| 予算 | 10文字 |
| URL | 50文字 |

## AIスポット提案

無料枠で5回まで利用可能。将来的にプレミアムプランでの拡張を予定。

## ライセンス

MIT
