---
name: uppbeat-music
description: Find free background music on Uppbeat (uppbeat.io/music) for a video, then add it under the voice with ducking and keep the credit record. Use when the user wants background music, a song, a "lagu", or BGM for a talking-head video.
---

# Free background music from Uppbeat

Source: https://uppbeat.io/music (free tracks for creators).

## What Claude does and does not do

Uppbeat downloads need the user's own account, and the site limits automated requests (it answered HTTP 429 when fetched by a script). So:

- **Do** help choose: ask for mood, genre, tempo, video length and platform, then give the user concrete things to filter on at https://uppbeat.io/music and what to look for in a track.
- **Do** process the file once the user has downloaded it: mix it, keep the credit record.
- **Do not** scrape the site, bulk-download, loop requests, or try to get around login, download limits or the player. If a page returns 429, stop and tell the user; don't retry in a loop.
- **Do not** state licence terms, free-tier limits or the credit wording from memory. They change. Have the user read the licence and the track's download page, and copy the credit text exactly as the site shows it.
- Opening one track page the user pasted is fine. Anything beyond that is the user's own browsing.

## Steps

1. **Brief.** Ask: mood (calm, upbeat, serious, emotional), genre, any instrument preference, whether it needs to be quiet under speech, and where the video will be posted (YouTube, TikTok, Instagram, client work). Prefer instrumental tracks with a steady, low-energy mix; busy melodies fight the voice.
2. **User picks and downloads.** The user filters at https://uppbeat.io/music, previews tracks, and downloads while logged in. Ask them to also confirm, on the track page and the site's terms, that their use is allowed (for example monetised or client videos) and what credit is required. If they paste the page text, use it.
3. **Save the file** under `assets/music/` (audio files are git-ignored; do not commit them).
4. **Record the credit.** Append to `assets/music/CREDITS.md`: track title, artist, track page URL, date downloaded, and the exact credit text from the site. Put the credit where the platform and the site's terms require it (usually the video description).
5. **Mix:**

   ```bash
   bash scripts/mix-music.sh talking-head.mp4 assets/music/track.mp3 final.mp4 0.35
   ```

   The music loops to the video length, fades in over 1 s, ducks while the voice speaks, and fades out over the last second. The last argument is music volume (0.35 default); lower it to 0.2 for dense speech. The video stream is copied, not re-encoded.
6. **Check by ear** on the final file. If the music is still loud under speech, lower the volume argument or choose a calmer track.

## Notes

- Keep the original download untouched; mix into a new file.
- One track per video. Do not strip or alter a track's metadata or watermark.
