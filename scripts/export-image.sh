#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
IMAGE_TAG="${IMAGE_TAG:-fenqi:release-${STAMP}}"
IMAGE_PLATFORM="${IMAGE_PLATFORM:-linux/amd64}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/tmp/images}"
OUTPUT_TAR="${OUTPUT_TAR:-$OUTPUT_DIR/${IMAGE_TAG//[:\/]/-}.tar}"

mkdir -p "$OUTPUT_DIR"

echo "[1/3] Building image: $IMAGE_TAG"
echo "      Target platform: $IMAGE_PLATFORM"
docker buildx build \
  --platform "$IMAGE_PLATFORM" \
  -f Dockerfile \
  -t "$IMAGE_TAG" \
  --load \
  --build-arg DATABASE_URL="${DATABASE_URL:-postgres://build:build@127.0.0.1:5432/fenqi}" \
  --build-arg BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-build-only-secret-0123456789abcdef}" \
  --build-arg BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:3000}" \
  --build-arg NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}" \
  --build-arg CRON_SECRET="${CRON_SECRET:-build-only-cron-secret}" \
  .

echo "[2/3] Saving image tar: $OUTPUT_TAR"
docker save -o "$OUTPUT_TAR" "$IMAGE_TAG"

echo "[3/3] Writing checksum"
shasum -a 256 "$OUTPUT_TAR" | tee "${OUTPUT_TAR}.sha256"

echo "Done."
echo "Image tag: $IMAGE_TAG"
echo "Tar: $OUTPUT_TAR"
