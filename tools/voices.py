"""Builds the intro's voice track from tools/script.json.

For every line: Kokoro TTS (free, Apache-2.0, run offline) speaks each segment in its own language's pronunciation,
the clip is pitched up a little so the cats sound like cartoon cats, Rhubarb Lip Sync works out the mouth shapes,
and the result goes to audio/<id>.mp3 plus js/voice.js (durations, captions, word timings, mouth cues).

Needs: pip install kokoro-onnx soundfile; ffmpeg; Rhubarb Lip Sync 1.13; kokoro-v1.0.onnx + voices-v1.0.bin.
Run:  python3 tools/voices.py /path/to/tts-models-dir [only-this-id]
"""
import html, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/tts'
ONLY = sys.argv[2] if len(sys.argv) > 2 else None
RHUBARB = os.path.join(MODELS, 'Rhubarb-Lip-Sync-1.13.0-Linux', 'rhubarb')
SR = 24000
S = json.load(open(f'{ROOT}/tools/script.json'))
K = Kokoro(f'{MODELS}/kokoro.onnx', f'{MODELS}/voices.bin')

def voice_of(v):
    if isinstance(v, str): return v
    return sum(K.get_voice_style(n) * w for n, w in v)

SEG = re.compile(r'\{([a-z-]+):([^}|]+)(?:\|([^}]*))?\}')
def segments(text):
    out, pos = [], 0
    for m in SEG.finditer(text):
        if m.start() > pos: out.append(('en-us', text[pos:m.start()], None))
        out.append((m.group(1), m.group(2), m.group(3)))
        pos = m.end()
    if pos < len(text): out.append(('en-us', text[pos:], None))
    return [(l, t, g) for l, t, g in out if t.strip()]

def trim(a, thr=0.008):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx): return a
    return a[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.06 * SR)]

def synth(who, text):
    V = S['voices'][who]; style = voice_of(V['voice']); parts = []
    for lang, t, _ in segments(text):
        t2 = t.strip()
        if not re.search(r'\w', t2): continue
        a, sr = K.create(t2, voice=style, speed=V['speed'], lang=lang)
        parts.append(trim(a)); parts.append(np.zeros(int(0.07 * SR), dtype=np.float32))
    return np.concatenate(parts[:-1]) if parts else np.zeros(SR // 4, dtype=np.float32)

def pitch(src, dst, st):
    f = 2 ** (st / 12)
    af = f'asetrate={int(SR*f)},aresample={SR},atempo={1/f:.5f},highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=7'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', af, '-ar', '22050', '-ac', '1', dst], check=True)

def lipsync(wav, text, english):
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False) as f:
        f.write(text); dlg = f.name
    cmd = [RHUBARB, '-q', '-f', 'json', '--extendedShapes', 'GHX', '-r', 'pocketSphinx' if english else 'phonetic', wav]
    if english: cmd[1:1] = ['-d', dlg]
    r = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return [[round(c['start'], 3), c['value']] for c in json.loads(r.stdout)['mouthCues']]

def caption_html(text):
    h = ''; pos = 0
    for m in SEG.finditer(text):
        h += html.escape(text[pos:m.start()])
        w, g = m.group(2), m.group(3)
        h += f'<u data-en="{html.escape(g)}">{html.escape(w)}</u>' if g else f'<i>{html.escape(w)}</i>'
        pos = m.end()
    return h + html.escape(text[pos:])

def word_times(text, cues, dur):
    """Spread the caption's words over the time the mouth is actually moving (Rhubarb's X = closed / silent)."""
    plain = SEG.sub(lambda m: m.group(2), text)
    words = plain.split()
    speech = []  # (start, end) of non-silent spans
    for i, (t, v) in enumerate(cues):
        end = cues[i + 1][0] if i + 1 < len(cues) else dur
        if v != 'X': speech.append((t, end))
    merged = []
    for a, b in speech:
        if merged and a - merged[-1][1] < 0.12: merged[-1] = (merged[-1][0], b)
        else: merged.append((a, b))
    total = sum(b - a for a, b in merged) or dur
    weights = [len(re.sub(r'\W', '', w)) + 1.5 for w in words]; W = sum(weights)
    out, acc = [], 0.0
    def at(x):  # x = seconds of speech elapsed -> clip time
        for a, b in merged:
            if x <= b - a: return a + x
            x -= b - a
        return dur
    for w in weights:
        out.append(round(at(acc / W * total), 3)); acc += w
    return out

def main():
    os.makedirs(f'{ROOT}/audio', exist_ok=True)
    vf = f'{ROOT}/js/voice.js'
    data = {}
    if os.path.exists(vf):
        try: data = json.loads(open(vf).read().split('=', 1)[1].rstrip().rstrip(';'))
        except Exception: data = {}
    for lid, (who, text) in S['lines'].items():
        if ONLY and lid != ONLY: continue
        a = synth(who, text)
        with tempfile.TemporaryDirectory() as d:
            raw, wav = f'{d}/raw.wav', f'{d}/out.wav'
            sf.write(raw, a, SR); pitch(raw, wav, S['voices'][who]['pitch'])
            dur = sf.info(wav).duration
            english = not SEG.search(text)
            plain = SEG.sub(lambda m: m.group(2), text)
            try: cues = lipsync(wav, plain, english)
            except subprocess.CalledProcessError: cues = lipsync(wav, plain, False)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '48k', f'{ROOT}/audio/{lid}.mp3'], check=True)
        data[lid] = {'who': who, 'dur': round(dur, 3), 'cap': caption_html(text), 'words': word_times(text, cues, dur), 'cues': cues}
        print(f'{lid:12s} {who:11s} {dur:5.2f}s {len(cues):3d} cues')
    data = {k: data[k] for k in S['lines'] if k in data}
    open(vf, 'w').write('/* Generated by tools/voices.py from tools/script.json. */\nwindow.VOICE=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')

if __name__ == '__main__':
    main()
