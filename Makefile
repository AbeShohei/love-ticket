# Love Ticket - デプロイ自動化
# 使い方: make <コマンド>

.PHONY: help convex-deploy build build-submit submit store-submit revenuecat-check deploy

# デフォルト: ヘルプ表示
help:
	@echo ""
	@echo "🎫 Love Ticket デプロイコマンド一覧"
	@echo "======================================"
	@echo ""
	@echo "  個別コマンド:"
	@echo "    make convex-deploy    Convex 本番環境にデプロイ"
	@echo "    make build            EAS でビルドのみ（TestFlight提出なし）"
	@echo "    make submit           TestFlight に提出（ビルド済み前提）"
	@echo "    make build-submit     EAS ビルド + TestFlight 自動提出"
	@echo "    make store-submit     App Store 審査に提出（fastlane）"
	@echo "    make revenuecat-check RevenueCat 商品・価格を確認"
	@echo "    make version          現在のビルド番号を確認"
	@echo "    make version-bump     ビルド番号をインクリメント"
	@echo ""
	@echo "  まとめて実行:"
	@echo "    make deploy           Convex + EAS ビルド + TestFlight 提出"
	@echo "    make release          Convex + EAS ビルド + App Store 提出"
	@echo ""

# ──────────────────────────────────────────────
# 1. Convex 本番デプロイ
# ──────────────────────────────────────────────
convex-deploy:
	@echo "🚀 Convex を本番環境にデプロイ中..."
	npx convex deploy --prod
	@echo "✅ Convex デプロイ完了"

# ──────────────────────────────────────────────
# 2. EAS ビルド（TestFlight 提出なし）
# ──────────────────────────────────────────────
build:
	@echo "🔨 EAS ビルド開始（iOS）..."
	eas build --platform ios --profile production --non-interactive
	@echo "✅ ビルド完了"

# ──────────────────────────────────────────────
# 3. TestFlight 提出（ビルド済みの場合）
# ──────────────────────────────────────────────
submit:
	@echo "📤 TestFlight に提出中..."
	eas submit --platform ios --latest
	@echo "✅ TestFlight 提出完了"

# ──────────────────────────────────────────────
# 4. EAS ビルド + TestFlight 自動提出
# ──────────────────────────────────────────────
build-submit:
	@echo "🔨📤 EAS ビルド + TestFlight 提出..."
	eas build --platform ios --profile production --auto-submit --non-interactive
	@echo "✅ ビルド & 提出完了"

# ──────────────────────────────────────────────
# 5. App Store 審査提出（fastlane）
# ──────────────────────────────────────────────
store-submit:
	@echo "🏪 App Store 審査に提出中..."
	@if command -v fastlane >/dev/null 2>&1; then \
		fastlane deliver --skip_screenshots --skip_metadata; \
	else \
		echo "⚠️  fastlane が見つかりません。インストール: gem install fastlane"; \
		exit 1; \
	fi
	@echo "✅ App Store 提出完了"

# ──────────────────────────────────────────────
# 6. RevenueCat 商品確認
# ──────────────────────────────────────────────
revenuecat-check:
	@echo "💰 RevenueCat 商品・オファリング確認..."
	@if [ -z "$$REVENUECAT_API_KEY" ]; then \
		echo "⚠️  REVENUECAT_API_KEY が未設定です"; \
	else \
		curl -s -H "Authorization: Bearer $$REVENUECAT_API_KEY" \
			"https://api.revenuecat.com/v1/subscribers/\$$RCAnonymousID:1" | \
			python3 -m json.tool 2>/dev/null || echo "（認証にはユーザーIDが必要です）"; \
	fi
	@echo ""
	@echo "RevenueCat ダッシュボード: https://app.revenuecat.com"

# ──────────────────────────────────────────────
# 7. ビルド番号確認
# ──────────────────────────────────────────────
version:
	@echo "📦 現在のビルド番号:"
	eas build:version:get --platform ios
	@echo ""
	@echo "app.json version: $$(node -e "console.log(require('./app.json').expo.version)")"

# ──────────────────────────────────────────────
# 8. ビルド番号インクリメント
# ──────────────────────────────────────────────
version-bump:
	@echo "📦 ビルド番号をインクリメント中..."
	eas build:version:set --platform ios
	@echo "✅ 完了"

# ──────────────────────────────────────────────
# まとめ: Convex + EAS + TestFlight
# ──────────────────────────────────────────────
deploy: convex-deploy build-submit
	@echo ""
	@echo "🎉 デプロイ完了！TestFlight でテスト可能です"

# ──────────────────────────────────────────────
# まとめ: Convex + EAS + App Store 審査
# ──────────────────────────────────────────────
release: convex-deploy build-submit store-submit
	@echo ""
	@echo "🎉 リリース完了！App Store 審査待ちです"
