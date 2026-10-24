"""Linguae cat rig generator.

Builds the four cousins (Fēlix, Felicísimo, Félicien, Fröhlix) as separate, static SVG parts so the intro can
move them with code: body (outfit), ears, head, eyes, brows, mouths (lip-sync visemes), hat, paws and props.
Everything shares one 240x240 coordinate space, the same one tools/felix.py in Verba uses.

Run:  python3 tools/rig.py            -> writes js/cats.js (the rig) and art/<cat>/<mood>.svg (static mood sets)
"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import felix_base as F
from felix_base import st, line, O, FUR, DFUR, MUZ, PINK, HEAD, BUST

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------- shared head pieces
def ear(side):
    if side < 0:
        return f'<path d="M64,74 L66,18 L108,44 Z" fill="{FUR}" {st(3.6)}/><path d="M72,64 L73,30 L98,46 Z" fill="{PINK}"/>'
    return f'<path d="M176,74 L174,18 L132,44 Z" fill="{FUR}" {st(3.6)}/><path d="M168,64 L167,30 L142,46 Z" fill="{PINK}"/>'

def head_base():
    h = f'<path d="{HEAD}" fill="{FUR}" {st(3.6)}/><g clip-path="url(#cp-head)"><ellipse cx="170" cy="104" rx="34" ry="56" fill="{DFUR}" opacity=".5"/>'
    h += f'<path d="M110,36 L114,56 L118,36 Z M122,36 L126,54 L130,36 Z" fill="{DFUR}"/>'
    h += line('M55,90 L70,92', 3) + line('M55,104 L68,104', 3) + line('M185,90 L170,92', 3) + line('M185,104 L172,104', 3) + '</g>'
    h += f'<path d="{HEAD}" fill="none" {st(3.6)}/>'
    h += f'<path d="M94,124 C94,110 108,106 120,110 C132,106 146,110 146,124 C146,140 132,146 120,144 C108,146 94,140 94,124 Z" fill="{MUZ}"/>'
    return h

def whiskers():
    return ''.join(line(d, 2) for d in ('M92,116 L56,108', 'M92,122 L54,124', 'M148,116 L184,108', 'M148,122 L186,124'))

def nose():
    return f'<path d="M114,108 Q120,105 126,108 Q124,114 120,115 Q116,114 114,108 Z" fill="{PINK}" {st(2.4)}/>' + line('M120,115 L120,118', 2.8)

def blush(strong=False):
    rx, ry, op = (10, 5.5, .85) if strong else (8, 4.5, .6)
    return f'<ellipse cx="80" cy="118" rx="{rx}" ry="{ry}" fill="{PINK}" opacity="{op}"/><ellipse cx="160" cy="118" rx="{rx}" ry="{ry}" fill="{PINK}" opacity="{op}"/>'

# eyes: each entry draws both eyes. 'half' and 'closed' are the blink frames.
def eyes_pair(a, b=None):
    return F.eye(a, 96, 1) + F.eye(b or a, 144, -1)
def lid(x, y=98, k=0.5):
    # half-closed: dark lower half + heavy lid line
    return (f'<path d="M{x-8},{y} A8,{10.5*k} 0 0 0 {x+8},{y} Z" fill="{O}"/>' + line(f'M{x-9.5},{y-0.5} Q{x},{y-3} {x+9.5},{y-0.5}', 3.6)
            + f'<circle cx="{x+2.5}" cy="{y+2.5}" r="1.6" fill="#fff"/>')
EYES = {
    'open': eyes_pair('open'), 'soft': eyes_pair('soft'), 'big': eyes_pair('big'), 'arc': eyes_pair('arc'),
    'squint': eyes_pair('squint'), 'heart': eyes_pair('heart'), 'sly': eyes_pair('sly'), 'wide': eyes_pair('wide'),
    'sad': eyes_pair('softsad'), 'up': eyes_pair('softup'), 'grump': eyes_pair('grump'), 'wink': F.eye('soft', 96, 1) + F.eye('arc', 144, -1),
    'half': lid(96) + lid(144),
    'closed': line('M87,99 Q96,105 105,99', 3.6) + line('M135,99 Q144,105 153,99', 3.6),
}
BROWS = {
    'none': '',
    'happy': line('M84,80 Q95,73 106,77', 3.6) + line('M134,77 Q145,73 156,80', 3.6),
    'up': line('M84,74 Q95,66 106,72', 3.6) + line('M134,72 Q145,66 156,74', 3.6),
    'sad': line('M86,78 Q96,80 105,74', 3.6) + line('M135,74 Q144,80 154,78', 3.6),
    'grumpy': line('M84,78 L106,88', 3.6) + line('M156,78 L134,88', 3.6),
    'think': line('M84,82 Q95,78 106,82', 3.6) + line('M134,74 Q145,64 156,70', 3.6),
    'sly': line('M84,84 Q95,82 106,86', 3.6) + line('M134,80 Q145,74 156,78', 3.6),
}
# mouths. X..H are Rhubarb Lip Sync's mouth shapes (Preston Blair set); the rest are expressions.
MD = '#6B2A22'; TONGUE = '#E36E78'
def mo(d, extra=''):
    return f'<path d="{d}" fill="{MD}" {st(3)}/>' + extra
MOUTHS = {
    # rest / smile
    'X': line('M108,117 Q114,124 120,118 Q126,124 132,117', 3.2),
    'fang': line('M106,117 Q113,126 120,118 Q127,126 134,116', 3.2) + f'<path d="M124.5,121.5 L127,127 L129.5,120.5 Z" fill="#fff" {st(2)}/>',
    # A: M B P (closed, lips pressed)
    'A': line('M109,121 Q114,123 120,120 Q126,123 131,121', 3.4),
    # B: most consonants (K S T EE): slightly open, teeth showing
    'B': mo('M108,119 Q120,123 132,119 Q130,128 120,128 Q110,128 108,119 Z', f'<path d="M110,120 Q120,123.5 130,120 L129.5,123 Q120,125.5 110.5,123 Z" fill="#fff"/>'),
    # C: EH / AE: open
    'C': mo('M107,118 Q120,122 133,118 Q131,133 120,133 Q109,133 107,118 Z', f'<path d="M113,129 Q120,125 127,129 Q124,132.5 120,132.5 Q116,132.5 113,129 Z" fill="{TONGUE}"/>'),
    # D: AA: wide open
    'D': mo('M105,117 Q120,121 135,117 Q133,140 120,140 Q107,140 105,117 Z', f'<path d="M111,133 Q120,126 129,133 Q125,139 120,139 Q115,139 111,133 Z" fill="{TONGUE}"/>'),
    # E: AO / ER: rounded
    'E': mo('M111,120 Q120,117 129,120 Q131,129 120,133 Q109,129 111,120 Z', f'<path d="M115,129 Q120,126 125,129 Q122,132 120,132 Q118,132 115,129 Z" fill="{TONGUE}"/>'),
    # F: UW / OW / W: puckered
    'F': f'<ellipse cx="120" cy="124" rx="7.5" ry="7" fill="#E9B98F" {st(3)}/><ellipse cx="120" cy="124.5" rx="3.6" ry="3.8" fill="{MD}"/>',
    # G: F / V: upper teeth on lower lip
    'G': mo('M109,119 Q120,121 131,119 Q129,127 120,127 Q111,127 109,119 Z', f'<path d="M112,119.6 L128,119.6 L127.5,124 Q120,125 112.5,124 Z" fill="#fff" {st(1.6)}/>'),
    # H: L: open with tongue up
    'H': mo('M107,118 Q120,122 133,118 Q131,134 120,134 Q109,134 107,118 Z', f'<path d="M113,124 Q120,119 127,124 Q127,132 120,132 Q113,132 113,124 Z" fill="{TONGUE}" {st(1.8)}/>'),
    # expressions
    'w': line('M107,117 Q113,125 120,118 Q127,125 133,117', 3.2),
    'smirk': line('M108,119 Q114,124 120,119 Q128,124 135,113', 3.2),
    'pout': line('M110,128 Q114,122 120,124 Q126,122 130,128', 3.2),
    'hmm': line('M111,121 Q118,118 128,123', 3.2),
    'o': f'<ellipse cx="120" cy="127" rx="6" ry="8" fill="{MD}" {st(3)}/>',
    'laugh': mo('M106,117 Q120,121 134,117 Q132,138 120,138 Q108,138 106,117 Z', f'<path d="M112,131 Q120,125 128,131 Q124,137 120,137 Q116,137 112,131 Z" fill="{TONGUE}"/>'),
    'zig': line('M108,124 L114,120 L120,124 L126,120 L132,124', 3.2),
    'tongue': f'<path d="M121,121 Q122,133 128,132 Q133,130 130,120 Z" fill="{TONGUE}" {st(2.6)}/>' + line('M126,122 L127,127', 1.8, '#B04650') + line('M107,118 Q113,124 120,119 Q128,124 135,114', 3.2),
}

def paw(left):
    # floating paw drawn around (0,0) so code can place and rotate it anywhere
    k = -1 if left else 1
    s = f'<ellipse cx="0" cy="0" rx="14" ry="13" fill="{FUR}" {st(3.2)}/>'
    s += f'<ellipse cx="{-k*10}" cy="3" rx="5.5" ry="6.5" fill="{FUR}" {st(2.8)}/>'
    s += line('M-4,3 L-4,9', 2.2) + line('M3,3 L3,9', 2.2)
    s += f'<ellipse cx="1" cy="-4" rx="5" ry="3" fill="#F3B98A" opacity=".55"/>'
    return s

# ---------------------------------------------------------------- outfits
def neck():
    return f'<path d="M98,160 Q120,176 142,160 L142,172 Q120,184 98,172 Z" fill="{MUZ}" {st(3)}/>'

def body_felix():
    s = f'<path d="{BUST}" fill="{F.TOGA}" {st(3.6)}/><g clip-path="url(#cp-bust)"><path d="M150,160 L190,166 L96,240 L52,240 Z" fill="{F.SASH}" {st(2.4)}/>'
    s += line('M60,206 Q78,214 84,236', 2.4) + line('M178,200 Q170,218 176,240', 2.4) + line('M200,214 Q196,228 200,240', 2.4)
    s += f'<path d="M120,164 L220,180 L220,240 L150,240 Z" fill="{F.TSH}" opacity=".35"/></g>'
    return s + neck()

HAT = '#3B3330'; HATB = '#B3261E'; JACK = '#34302D'; JACKL = '#4A4541'; SHIRT = '#FBF5E9'; RED = '#C2321F'; REDD = '#8E2216'
def body_felicisimo():
    s = f'<path d="{BUST}" fill="{JACK}" {st(3.6)}/><g clip-path="url(#cp-bust)">'
    s += f'<path d="M96,160 L144,160 L131,240 L109,240 Z" fill="{SHIRT}" {st(2.6)}/>'
    s += line('M120,184 L120,240', 1.8, '#CFC3AE') + ''.join(f'<circle cx="120" cy="{y}" r="2.2" fill="#CFC3AE"/>' for y in (196, 212, 228))
    s += f'<path d="M96,160 L112,240 L90,240 L80,182 Z" fill="{JACKL}" {st(2.6)}/><path d="M144,160 L128,240 L150,240 L160,182 Z" fill="{JACKL}" {st(2.6)}/>'
    s += f'<rect x="0" y="228" width="240" height="14" fill="{RED}" {st(2.6)}/>'
    s += line('M44,214 Q52,226 50,240', 2.2, '#5E5752') + line('M196,214 Q188,226 190,240', 2.2, '#5E5752')
    s += ''.join(f'<circle cx="{x}" cy="{y}" r="3" fill="{JACKL}" {st(1.8)}/>' for x, y in ((88, 196), (86, 212), (152, 196), (154, 212)))
    s += f'<path d="M120,164 L220,180 L220,240 L150,240 Z" fill="#000" opacity=".12"/></g>'
    s += neck()
    s += f'<path d="M104,172 L120,178 L136,172 L128,200 L120,186 L112,200 Z" fill="{RED}" {st(2.8)}/><path d="M114,174 Q120,170 126,174 L125,183 Q120,186 115,183 Z" fill="{REDD}" {st(2.4)}/>'
    return s

def hat_felicisimo():
    s = '<g transform="rotate(-7 120 40)">'
    s += f'<ellipse cx="120" cy="42" rx="64" ry="10" fill="{HAT}" {st(3.4)}/>'
    s += f'<path d="M92,41 L95,14 Q120,8 145,14 L148,41 Q120,47 92,41 Z" fill="{HAT}" {st(3.4)}/>'
    s += f'<path d="M93.5,33 Q120,38 146.5,33 L147.2,40 Q120,46 92.8,40 Z" fill="{HATB}" {st(2.2)}/>'
    s += f'<ellipse cx="120" cy="14" rx="25" ry="4.5" fill="{JACKL}" {st(2.6)}/>'
    s += line('M70,44 Q120,52 170,44', 1.8, '#6A5F58')
    return s + '</g>'

# Félicien: navy-and-white Breton striped shirt (marinière), red beret, small blue neckerchief
NAVY = '#26375F'; STRIPEW = '#F6F0E2'; BERET = '#B8322A'; BERETD = '#8C2219'; SCARF = '#4F86C6'; SCARFD = '#2F5F98'
def body_felicien():
    s = f'<path d="{BUST}" fill="{STRIPEW}" {st(3.6)}/><g clip-path="url(#cp-bust)">'
    # stripes bow gently with the chest so they read as cloth, not a flat pattern
    for i, y in enumerate(range(178, 248, 15)):
        bow = 4 + i * 0.8
        s += f'<path d="M0,{y} Q120,{y+bow} 240,{y} L240,{y+7} Q120,{y+7+bow} 0,{y+7} Z" fill="{NAVY}"/>'
    s += f'<path d="M120,164 L220,180 L220,240 L150,240 Z" fill="#1A2440" opacity=".14"/>'
    s += line('M58,206 Q74,214 80,236', 2.2, '#9A9182') + line('M184,204 Q174,220 178,240', 2.2, '#9A9182')
    s += '</g>'
    # wide boat neck
    s += f'<path d="M92,162 Q120,182 148,162 L148,170 Q120,190 92,170 Z" fill="{MUZ}" {st(3)}/>'
    s += f'<path d="M86,164 Q120,186 154,164" fill="none" stroke="{NAVY}" stroke-width="3" stroke-linecap="round"/>'
    # neckerchief knotted off to one side, tails fluttering
    s += f'<path d="M100,170 Q120,182 140,170 L138,178 Q120,190 102,178 Z" fill="{SCARF}" {st(2.8)}/>'
    s += f'<path d="M136,174 L164,186 L158,196 L134,182 Z" fill="{SCARF}" {st(2.6)}/><path d="M136,176 L156,200 L146,204 L132,182 Z" fill="{SCARFD}" {st(2.6)}/>'
    s += f'<ellipse cx="136" cy="177" rx="7" ry="5.5" fill="{SCARF}" {st(2.6)}/>'
    s += ''.join(f'<circle cx="{x}" cy="{y}" r="1.5" fill="#fff" opacity=".85"/>' for x, y in ((108, 177), (118, 181), (126, 180), (152, 188), (146, 196)))
    return s

def hat_felicien():
    # beret slouched toward the viewer's right, with the little stalk (tige) on top
    s = '<g transform="rotate(-9 122 40)">'
    s += f'<path d="M66,44 C62,22 96,10 128,12 C164,14 188,30 180,46 C176,54 160,56 150,52 Q120,44 90,52 C78,55 68,52 66,44 Z" fill="{BERET}" {st(3.4)}/>'
    s += f'<path d="M86,48 Q120,40 156,48 L156,54 Q120,47 86,55 Z" fill="{BERETD}" {st(2.4)}/>'
    s += line('M84,30 Q110,22 136,26', 2, '#D8574C') + line('M150,26 Q166,30 172,38', 2, '#8C2219')
    s += f'<path d="M124,13 Q125,5 130,3" fill="none" stroke="{O}" stroke-width="6.5" stroke-linecap="round"/><path d="M124,13 Q125,5 130,3" fill="none" stroke="{BERET}" stroke-width="3" stroke-linecap="round"/>'
    return s + '</g>'

# Fröhlix: white shirt with pointed collar, leather suspenders with an embroidered chest bar (edelweiss), alpine hat with a feather
LEATHER = '#7A4E2D'; LEATHERD = '#5A3820'; LODEN = '#4F6B3A'; LODEND = '#3A5129'; CORD = '#C9A15A'; FEATHER = '#8C7A62'
def edelweiss(x, y, r=7):
    s = ''
    for i in range(6):
        a = math.radians(i * 60 - 90)
        px, py = x + math.cos(a) * r * .62, y + math.sin(a) * r * .62
        s += f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{r*.42:.1f}" ry="{r*.2:.1f}" transform="rotate({i*60} {px:.1f} {py:.1f})" fill="#FFFDF6" {st(1.6)}/>'
    return s + f'<circle cx="{x}" cy="{y}" r="{r*.3:.1f}" fill="#E8C14A" {st(1.4)}/>'
def body_frohlix():
    s = f'<path d="{BUST}" fill="{SHIRT}" {st(3.6)}/><g clip-path="url(#cp-bust)">'
    s += line('M120,182 L120,240', 1.8, '#CFC3AE') + ''.join(f'<circle cx="120" cy="{y}" r="2.2" fill="#CFC3AE"/>' for y in (190, 222))
    s += line('M52,206 Q70,214 76,238', 2.2, '#D4C6AC') + line('M188,204 Q176,220 180,240', 2.2, '#D4C6AC')
    # suspenders
    for x0, x1 in ((76, 94), (164, 146)):
        s += f'<path d="M{x0-10},166 L{x0+10},166 L{x1+9},240 L{x1-9},240 Z" fill="{LEATHER}" {st(2.6)}/>'
        s += line(f'M{x0-5},170 L{x1-5},240', 1.4, '#C9A27A') + line(f'M{x0+5},170 L{x1+5},240', 1.4, '#C9A27A')
    # chest bar (Brustlatz) with an edelweiss
    s += f'<path d="M80,196 Q120,201 160,196 L158,220 Q120,225 82,220 Z" fill="{LEATHER}" {st(2.6)}/>'
    s += f'<path d="M86,200 Q120,205 154,200 L153,216 Q120,221 87,216 Z" fill="none" stroke="#C9A27A" stroke-width="1.4" stroke-dasharray="3 2.4"/>'
    s += edelweiss(120, 209, 8) + f'<path d="M98,206 q4,-4 8,0 q-4,4 -8,0 Z M134,206 q4,-4 8,0 q-4,4 -8,0 Z" fill="{LODEN}"/>'
    s += f'<path d="M120,164 L220,180 L220,240 L150,240 Z" fill="#000" opacity=".1"/></g>'
    s += neck()
    # pointed collar
    s += f'<path d="M98,166 L112,176 L104,190 L92,172 Z" fill="{SHIRT}" {st(2.6)}/><path d="M142,166 L128,176 L136,190 L148,172 Z" fill="{SHIRT}" {st(2.6)}/>'
    s += f'<circle cx="120" cy="180" r="2.6" fill="#CFC3AE" {st(1.4)}/>'
    return s

def hat_frohlix():
    s = '<g transform="rotate(8 120 40)">'
    # feather behind the crown
    s += f'<path d="M140,34 C150,18 162,4 178,-6 C170,8 160,22 146,38 Z" fill="{FEATHER}" {st(2.6)}/>'
    s += line('M144,36 C154,22 164,8 176,-4', 1.4, '#5E5040')
    s += ''.join(line(f'M{150+i*6},{24-i*7} l{-5},{-1}', 1.4, '#5E5040') for i in range(4))
    # brim, curled up at the sides
    s += f'<path d="M52,36 C56,52 86,56 120,54 C154,56 184,52 188,36 C178,44 160,42 120,42 C80,42 62,44 52,36 Z" fill="{LODEN}" {st(3.2)}/>'
    # crown, pinched at the top
    s += f'<path d="M88,44 C88,26 94,10 106,8 Q120,14 134,8 C146,10 152,26 152,44 Q120,49 88,44 Z" fill="{LODEN}" {st(3.4)}/>'
    s += line('M110,12 Q120,24 130,12', 2, LODEND)
    # twisted cord band
    s += f'<path d="M89,36 Q120,41 151,36 L151.6,43 Q120,48 88.6,43 Z" fill="{CORD}" {st(2.2)}/>'
    s += ''.join(line(f'M{x},{37+abs(x-120)*0.02} l3,5', 1.2, '#8E6E36') for x in range(93, 150, 6))
    s += edelweiss(98, 34, 5.5)
    return s + '</g>'

# ---------------------------------------------------------------- props
# Props held in the left paw. Each is drawn around the grip point (0,0), where the paw sits on top of it.
def rose():
    s = f'<path d="M16,26 C6,8 -10,-14 -28,-40" fill="none" stroke="{O}" stroke-width="7.5" stroke-linecap="round"/><path d="M16,26 C6,8 -10,-14 -28,-40" fill="none" stroke="#4E7A32" stroke-width="3.6" stroke-linecap="round"/>'
    s += f'<path d="M-6,-12 C-22,-12 -28,-2 -30,6 C-18,6 -8,0 -6,-12 Z" fill="#5E8F3A" {st(2.4)}/>' + line('M-8,-10 Q-18,-4 -26,4', 1.4, '#3E6526')
    s += f'<path d="M4,6 C16,-2 26,2 30,10 C20,14 8,12 4,6 Z" fill="#5E8F3A" {st(2.4)}/>'
    s += f'<path d="M-30,-34 L-36,-30 L-28,-30 Z" fill="#5E8F3A" {st(2)}/>'
    # bloom: outer petals, cupped middle, spiral
    s += f'<path d="M-46,-48 C-50,-64 -34,-74 -24,-66 C-12,-72 -2,-58 -10,-48 C-8,-36 -22,-30 -30,-34 C-40,-30 -50,-38 -46,-48 Z" fill="#C8283A" {st(3)}/>'
    s += f'<path d="M-38,-50 C-38,-60 -24,-62 -20,-54 C-16,-46 -24,-40 -30,-42" fill="#E0414F" {st(2.4)}/>'
    s += line('M-32,-52 C-28,-56 -24,-52 -27,-48', 2, '#8E1426') + line('M-44,-44 C-38,-38 -30,-38 -22,-44', 2, '#8E1426')
    return s
def baguette():
    s = '<g transform="translate(-14 -20) rotate(56)">'
    s += f'<path d="M-46,-9 C-56,-9 -56,9 -46,9 L46,9 C56,9 56,-9 46,-9 Z" fill="#D9A15A" {st(3.2)}/>'
    s += f'<path d="M-44,3 L44,3 C50,3 52,7 46,8 L-46,8 C-52,7 -50,3 -44,3 Z" fill="#B9783A" opacity=".7"/>'
    s += ''.join(line(f'M{x},-6 Q{x+6},-3 {x+10},1', 2.6, '#F1D29A') for x in (-36, -18, 0, 18, 32))
    return s + '</g>'
def pretzel():
    d = 'M-14,16 C-36,6 -26,-26 0,-12 C26,-26 36,6 14,16 M-14,16 L9,-4 M14,16 L-9,-4'
    s = '<g transform="translate(16 -20) rotate(-8) scale(1.3)">'
    s += f'<path d="{d}" fill="none" stroke="{O}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>'
    s += f'<path d="{d}" fill="none" stroke="#9A5A2B" stroke-width="8.4" stroke-linecap="round" stroke-linejoin="round"/>'
    s += f'<path d="M-24,-6 C-24,-14 -14,-18 -6,-14 M6,-14 C14,-18 24,-14 24,-6" fill="none" stroke="#C07A40" stroke-width="2.4" stroke-linecap="round"/>'
    s += ''.join(f'<rect x="{x}" y="{y}" width="2.6" height="2.2" rx=".6" fill="#FFFDF6" transform="rotate({r} {x} {y})"/>' for x, y, r in ((-22, -2, 20), (-14, -14, -30), (12, -15, 40), (22, -4, 10), (-2, 4, 0), (6, 10, 60), (-8, 10, -20)))
    return s + '</g>'
PROPS = {
    'scroll': F.scroll(38, 0, 74, 0),   # Fēlix's scroll, grip at its left roller
    'rose': rose(), 'baguette': baguette(), 'pretzel': pretzel(),
    # a wooden pointer for walking through the site's features (held at 0,0, tip up-right)
    'pointer': f'<path d="M0,0 L74,-58" stroke="{O}" stroke-width="8" stroke-linecap="round"/><path d="M0,0 L74,-58" stroke="#B9874E" stroke-width="4.4" stroke-linecap="round"/><circle cx="74" cy="-58" r="4" fill="#F2C94C" {st(2)}/>',
    'sparkle': F.sparkle(0, 0, 10),
    'heart': F.heart(0, 0),
    'tear': F.tear(0, -5),
}

CHARS = {
    'felix':      dict(name='Fēlix',      lang='Latin',   site='Verba',    body=body_felix,      hat=F.wreath,         prop='scroll',  color='#9A3B26'),
    'felicisimo': dict(name='Felicísimo', lang='Spanish', site='Palabras', body=body_felicisimo, hat=hat_felicisimo,   prop='rose', color='#C2321F'),
    'felicien':   dict(name='Félicien',   lang='French',  site='Mots',     body=body_felicien,   hat=hat_felicien,     prop='baguette', color=NAVY),
    'frohlix':    dict(name='Fröhlix',    lang='German',  site='Wörter',   body=body_frohlix,    hat=hat_frohlix,      prop='pretzel', color=LODEN),
}

DEFS = (f'<clipPath id="cp-head"><path d="{HEAD}"/></clipPath><clipPath id="cp-bust"><path d="{BUST}"/></clipPath>')

def rig():
    out = {'defs': DEFS, 'eyes': EYES, 'brows': BROWS, 'mouths': MOUTHS, 'paw': {'L': paw(True), 'R': paw(False)},
           'props': PROPS, 'parts': {'earL': ear(-1), 'earR': ear(1), 'head': head_base(), 'nose': nose(), 'whiskers': whiskers(),
                                     'blush': blush(), 'blushStrong': blush(True)}, 'chars': {}}
    for k, c in CHARS.items():
        out['chars'][k] = {'name': c['name'], 'lang': c['lang'], 'site': c['site'], 'color': c['color'], 'prop': c['prop'],
                           'body': c['body'](), 'hat': c['hat']()}
    return out

# ---------------------------------------------------------------- static mood sets (same poses as Verba's Fēlix)
MOOD_FACE = {  # eyes, brows, mouth, strong blush
    'happy': ('soft', 'happy', 'fang', 0), 'delighted': ('arc', 'none', 'laugh', 1), 'laughing': ('squint', 'none', 'laugh', 1),
    'adoring': ('heart', 'none', 'w', 1), 'sly': ('sly', 'sly', 'smirk', 1), 'cheeky': ('wink', 'happy', 'tongue', 0),
    'shocked': ('wide', 'up', 'o', 1), 'sad': ('sad', 'sad', 'pout', 0), 'grumpy': ('grump', 'grumpy', 'zig', 1),
    'thinking': ('up', 'think', 'hmm', 0),
}
def mood_svg(k, mood, face_only=False):
    c = CHARS[k]; P = F.POSE[mood]; e, b, m, bs = MOOD_FACE[mood]
    dy = 14 + P.get('lift', 0) + P.get('drop', 0)
    head = ear(-1) + ear(1) + head_base() + blush(bs) + EYES[e] + BROWS[b] + nose() + MOUTHS[m] + whiskers() + c['hat']()
    s = c['body']()
    if P.get('tab') and not face_only:
        gx, gy = P['arms'][0][3]
        s += f'<g transform="translate({gx} {gy})">{PROPS[c["prop"]]}</g>'
    s += f'<g transform="translate(0 {dy}) rotate({P["tilt"]} 120 150)">{head}</g>'
    for sh, c1, c2, end, a in P['arms']:
        s += f'<g transform="translate({end[0]} {end[1]}) rotate({a})">{paw(sh[0] < 120)}</g>'
    if 'fx' in P: s += P['fx']()
    if mood == 'grumpy': s += F.GRUMPMARK
    vb = '46 4 148 148' if face_only else '0 -10 240 250'
    w = 148 if face_only else 240
    rough = ('<filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" '
             'numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{w}">\n<defs>{rough}{DEFS}</defs>\n<g filter="url(#rough)">\n{s}\n</g>\n</svg>\n'

if __name__ == '__main__':
    os.makedirs(f'{ROOT}/js', exist_ok=True)
    with open(f'{ROOT}/js/cats.js', 'w') as f:
        f.write('/* Generated by tools/rig.py. Do not edit by hand. */\nwindow.CATS=' + json.dumps(rig(), ensure_ascii=False, separators=(',', ':')) + ';\n')
    for k in CHARS:
        d = f'{ROOT}/art/{k}'; os.makedirs(d, exist_ok=True)
        for m in MOOD_FACE:
            open(f'{d}/{m}.svg', 'w').write(mood_svg(k, m)); open(f'{d}/face-{m}.svg', 'w').write(mood_svg(k, m, True))
    print('ok')
