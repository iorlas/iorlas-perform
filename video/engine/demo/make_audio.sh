#!/bin/sh
# Builds demo/demo.wav (gitignored): 8.5 s take + 8 s of another take, PCM16 mono 44.1 kHz, so the demo timeline has two scenes.
set -e
cd "$(dirname "$0")"
A="${1:-$HOME/Workspaces/ru-voice-clone/out.wav}"; B="${2:-$HOME/Downloads/shmatko_starik.wav}"
ffmpeg -v error -y -i "$A" -t 9.0 -af apad=whole_dur=9.0 -ar 44100 -ac 1 -c:a pcm_s16le a.tmp.wav
ffmpeg -v error -y -i "$B" -t 8.0 -ar 44100 -ac 1 -c:a pcm_s16le b.tmp.wav
ffmpeg -v error -y -i a.tmp.wav -i b.tmp.wav -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[a]" -map "[a]" -c:a pcm_s16le demo.wav
rm -f a.tmp.wav b.tmp.wav
