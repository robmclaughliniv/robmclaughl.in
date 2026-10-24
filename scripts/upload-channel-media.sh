#!/usr/bin/env bash
# Sync one channel's gitignored media to S3.
# Commands match docs/CHANNELS.md ("S3 Upload"). Dry-run unless --apply.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/upload-channel-media.sh --bucket BUCKET --channel CHANNEL [--apply]

Runs the per-channel aws s3 sync commands from docs/CHANNELS.md:

  public/channels/CHANNEL/audio/  -> s3://BUCKET/channels/CHANNEL/audio/
  public/channels/CHANNEL/videos/ -> s3://BUCKET/channels/CHANNEL/videos/
      excludes manifest.json
  public/channels/CHANNEL/mobile/ -> s3://BUCKET/channels/CHANNEL/mobile/
      excludes manifest.json

Defaults to --dryrun. Pass --apply to write. A second --apply only
transfers files that differ. JSON manifests deploy with the site.
This script does not invalidate CloudFront; that command is in
docs/CHANNELS.md.
EOF
}

apply=0
explicit_dryrun=0
bucket=""
channel=""

usage_error() {
  echo "upload-channel-media: $*" >&2
  exit 2
}

fail() {
  echo "upload-channel-media: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)
      [[ $# -ge 2 ]] || usage_error "--bucket requires a value"
      bucket="$2"
      shift 2
      ;;
    --channel)
      [[ $# -ge 2 ]] || usage_error "--channel requires a value"
      channel="$2"
      shift 2
      ;;
    --apply)
      apply=1
      shift
      ;;
    --dryrun|--dry-run)
      explicit_dryrun=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage_error "unknown argument: $1"
      ;;
  esac
done

if [[ "$apply" -eq 1 && "$explicit_dryrun" -eq 1 ]]; then
  usage_error "pass either --apply or --dryrun, not both"
fi

if [[ -z "$bucket" || -z "$channel" ]]; then
  usage >&2
  usage_error "--bucket and --channel are required"
fi

if [[ ! "$bucket" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]]; then
  usage_error "bucket must be an S3 bucket name, not an s3:// URI"
fi

if [[ ! "$channel" =~ ^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$ ]]; then
  usage_error "channel must be a lowercase id such as study-chill"
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

channel_dir="public/channels/${channel}"
if [[ ! -d "$channel_dir" ]]; then
  fail "missing ${channel_dir}"
fi

missing=()
for sub in audio videos mobile; do
  if [[ ! -d "${channel_dir}/${sub}" ]]; then
    missing+=("${channel_dir}/${sub}")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "upload-channel-media: copy gitignored media into these folders first:" >&2
  printf '  %s\n' "${missing[@]}" >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  fail "aws CLI is not on PATH"
fi

run_sync() {
  local src="$1"
  local dest="$2"
  shift 2
  local -a args=(aws s3 sync "$src" "$dest" "$@")
  if [[ "$apply" -eq 0 ]]; then
    args+=(--dryrun)
  fi
  printf '+'
  printf ' %q' "${args[@]}"
  printf '\n'
  "${args[@]}"
}

if [[ "$apply" -eq 1 ]]; then
  echo "upload-channel-media: writing s3://${bucket}/channels/${channel}/"
else
  echo "upload-channel-media: dry-run (pass --apply to write)"
fi

run_sync "${channel_dir}/audio/" "s3://${bucket}/channels/${channel}/audio/"
run_sync "${channel_dir}/videos/" "s3://${bucket}/channels/${channel}/videos/" --exclude "manifest.json"
run_sync "${channel_dir}/mobile/" "s3://${bucket}/channels/${channel}/mobile/" --exclude "manifest.json"
