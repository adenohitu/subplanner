# subplanner
サブスクを管理する AI generated

## 技術スタック

- **ランタイム / パッケージ管理**: Bun
- **開発ビルド**: Vite
- **UI**: React + TypeScript
- **スタイリング**: Tailwind CSS v4 + shadcn/ui
- **データフェッチ**: TanStack Query (React Query)
- **テスト**: bun test

## 開発環境のセットアップ

```bash
# 依存関係のインストール
bun install

# 開発サーバーの起動
bun run dev

# ビルド
bun run build

# テストの実行
bun test

# Lintの実行
bun run lint
```

## プロジェクト構造

```
src/
├── components/     # Reactコンポーネント
│   └── ui/        # shadcn/uiコンポーネント
├── lib/           # ユーティリティ関数
│   └── utils.ts   # cn()関数（classname utility）
├── hooks/         # カスタムフック
├── __tests__/     # テストファイル
└── App.tsx        # メインアプリ（TanStack Query設定済み）
```

## 機能

- TanStack Query によるデータフェッチとキャッシング
- shadcn/ui によるモダンなUIコンポーネント
- Tailwind CSS v4 による高速なスタイリング
- TypeScript による型安全性
