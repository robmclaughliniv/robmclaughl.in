# TV Channels — Asset Organization

Site-wide lo-fi channels bundle music, background visuals, and theme tokens. Each channel is a self-contained folder under `public/channels/`.

## Structure

```
public/channels/
├── manifest.json              # Master registry (channel order, themes, asset paths)
└── study-chill/               # Channel 1
    ├── playlist.json
    ├── audio/                 # MP3s (gitignored — upload to S3)
    ├── videos/
    │   ├── manifest.json
    │   └── *.mp4
    └── mobile/
        ├── manifest.json
        └── *.mp4, *.jpg
```

## Adding a New Channel

1. Create `public/channels/{channel-id}/` with `playlist.json`, `videos/manifest.json`, and `mobile/manifest.json`.
2. Add an entry to `public/channels/manifest.json` with the next channel number and theme.
3. Upload binaries to S3 (see below).
4. No code changes required — the channel list is data-driven.

## Local Development

JSON manifests are committed. Large binaries are gitignored:

- `public/channels/**/audio/*.mp3`
- `public/channels/**/videos/*.mp4`
- `public/channels/**/mobile/*.mp4`
- `public/channels/**/mobile/*.jpg`

Copy media into the channel folders locally for dev playback.

## S3 Upload

Deploy syncs the static build but **excludes** channel binaries so manually uploaded media is not deleted:

```bash
BUCKET=robmclaughl-in-website-bucket

# Master manifest + per-channel JSON (also deployed via CI)
aws s3 sync public/channels/ s3://$BUCKET/channels/ \
  --exclude "*/audio/*" \
  --exclude "*/videos/*.mp4" \
  --exclude "*/mobile/*.mp4" \
  --exclude "*/mobile/*.jpg"

# Channel 1 audio
aws s3 sync public/channels/study-chill/audio/ \
  s3://$BUCKET/channels/study-chill/audio/

# Channel 1 videos
aws s3 sync public/channels/study-chill/videos/ \
  s3://$BUCKET/channels/study-chill/videos/ \
  --exclude "manifest.json"

# Channel 1 mobile backgrounds
aws s3 sync public/channels/study-chill/mobile/ \
  s3://$BUCKET/channels/study-chill/mobile/ \
  --exclude "manifest.json"

# Invalidate CDN
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/channels/*"
```

## User Controls

- **Channel up/down** — buttons in the expanded audio player (disabled when only one channel exists)
- **Keyboard** — `Alt+ArrowUp` / `Alt+ArrowDown` to change channels
- **Track skip** — existing prev/next track buttons (within the active channel)

## Current Channels

| # | ID | Name |
|---|-----|------|
| 1 | `study-chill` | Study Chill |
