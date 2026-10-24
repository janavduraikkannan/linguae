# Copied from Verba/tools/felix.py: the shared drawing code (eyes, poses, paws) the rig builds on.
"""Fēlix mascot generator (bust, floating paws, one pose per mood). Run: python3 tools/felix.py img/felix"""
import math
O='#2A2420';FUR='#E8944A';DFUR='#C9733A';MUZ='#F7DDB2';PINK='#E7A3A0';TOGA='#F1E6CD';TSH='#D9C9A6';SASH='#9A3B26';L1='#4E6A2A';L2='#6E8B3D';FISH='#7FA9BC';FISHD='#557F93'
def st(w=3.4): return f'stroke="{O}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'
def line(d,w=3.2,c=O): return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def bez(p0,p1,p2,p3,t):
    u=1-t;return tuple(u**3*a+3*u*u*t*b+3*u*t*t*c+t**3*d for a,b,c,d in zip(p0,p1,p2,p3))
def limb(p,col=FUR,w=18.5):
    return f'<path d="{p}" fill="none" stroke="{O}" stroke-width="{w+6.5}" stroke-linecap="round"/><path d="{p}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round"/>'
def paw(x,y,a=0,r=12.5):
    s=f'<g transform="rotate({a} {x} {y})"><ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r*0.92}" fill="{FUR}" {st()}/>'
    s+=line(f'M{x-3.5},{y+2} L{x-3.5},{y+7}',2.2)+line(f'M{x+3.5},{y+2} L{x+3.5},{y+7}',2.2)+'</g>'
    return s
def arm(sh,c1,c2,end,a=0):
    return limb(f'M{sh[0]},{sh[1]} C{c1[0]},{c1[1]} {c2[0]},{c2[1]} {end[0]},{end[1]}')+paw(end[0],end[1],a)
def tail(pts,puff=False):
    p0,p1,p2,p3=pts;d=f'M{p0[0]},{p0[1]} C{p1[0]},{p1[1]} {p2[0]},{p2[1]} {p3[0]},{p3[1]}'
    w=19 if puff else 12.5
    s=limb(d,FUR,w)
    for t in (0.45,0.65,0.85):
        x,y=bez(p0,p1,p2,p3,t);x2,y2=bez(p0,p1,p2,p3,t+0.02);dx,dy=x2-x,y2-y;n=math.hypot(dx,dy);nx,ny=-dy/n,dx/n;h=w/2-0.5
        s+=line(f'M{x+nx*h:.1f},{y+ny*h:.1f} L{x-nx*h*0.2:.1f},{y-ny*h*0.2:.1f}',2.6,DFUR)
    if puff:
        x,y=p3;s+=''.join(line(f'M{x+dx2},{y+dy2} l{dx2*0.5},{dy2*0.5}',2.4) for dx2,dy2 in ((-12,-4),(12,-6),(-10,10)))
    return s
HEAD='M54,96 C50,56 84,36 120,36 C156,36 190,56 186,96 C184,132 156,150 120,150 C84,150 56,132 54,96 Z'
BODY='M70,226 C62,190 82,152 120,150 C158,152 178,190 170,226 Q120,236 70,226 Z'
def wreath():
    s=''
    for side in (-1,1):
        for i in range(9):
            a=math.radians(198+i*7.5) if side<0 else math.radians(342-i*7.5)
            x=120+70*math.cos(a);y=94+58*math.sin(a)
            rot=math.degrees(a)+90+(-25 if side<0 else 25)
            s+=f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="9.5" ry="4.8" transform="rotate({rot:.1f} {x:.1f} {y:.1f})" fill="{L1 if i%2==0 else L2}" {st(2.2)}/>'
    return s
def eye(kind,x,side):
    y=98
    if kind=='open': return f'<ellipse cx="{x}" cy="{y}" rx="8" ry="10.5" fill="{O}"/><circle cx="{x+2.6}" cy="{y-3.6}" r="3.2" fill="#fff"/><circle cx="{x-2.6}" cy="{y+3.6}" r="1.4" fill="#fff"/>'
    if kind=='big': return f'<ellipse cx="{x}" cy="{y+1}" rx="9" ry="11.5" fill="{O}"/><circle cx="{x+2.8}" cy="{y-3.4}" r="3.8" fill="#fff"/><circle cx="{x-3}" cy="{y+4.6}" r="1.8" fill="#fff"/>'
    if kind=='arc': return line(f'M{x-9},{y+3} Q{x},{y-9} {x+9},{y+3}',3.8)
    if kind=='squint':
        k=side;return line(f'M{x-7*k},{y-7} L{x+5*k},{y} L{x-7*k},{y+7}',3.8)
    if kind=='heart':
        return f'<path d="M{x},{y+9} C{x-13},{y} {x-10},{y-11} {x},{y-4} C{x+10},{y-11} {x+13},{y} {x},{y+9} Z" fill="#D8484A" {st(2.4)}/><circle cx="{x-4}" cy="{y-3}" r="1.8" fill="#fff"/>'
    if kind=='sly': return f'<path d="M{x-8},{y} A8,8 0 0 0 {x+8},{y} Z" fill="{O}"/>'+line(f'M{x-10},{y-1} L{x+10},{y-2}',3.6)+f'<circle cx="{x+2.5}" cy="{y+3}" r="1.6" fill="#fff"/>'
    if kind=='wide': return f'<circle cx="{x}" cy="{y}" r="10" fill="#fff" {st(3)}/><circle cx="{x}" cy="{y+1}" r="4" fill="{O}"/>'
    if kind=='soft': return f'<ellipse cx="{x}" cy="{y+1}" rx="6.6" ry="8.6" fill="{O}"/><circle cx="{x+2}" cy="{y-2.6}" r="2.1" fill="#fff"/>'
    if kind=='softsad': return f'<ellipse cx="{x}" cy="{y+2}" rx="6.6" ry="8" fill="{O}"/><circle cx="{x+2}" cy="{y-1.2}" r="2" fill="#fff"/>'
    if kind=='softup': return f'<ellipse cx="{x+1}" cy="{y}" rx="6.4" ry="8.4" fill="{O}"/><circle cx="{x+3}" cy="{y-4}" r="1.9" fill="#fff"/>'
    if kind=='up': return f'<ellipse cx="{x}" cy="{y}" rx="8" ry="10.5" fill="{O}"/><circle cx="{x+3}" cy="{y-5}" r="3.2" fill="#fff"/><circle cx="{x-2}" cy="{y+2}" r="1.3" fill="#fff"/>'
    if kind=='grump': return f'<path d="M{x-8},{y-1} A8,8 0 0 0 {x+8},{y-1} Z" fill="{O}"/><circle cx="{x+2}" cy="{y+2}" r="1.5" fill="#fff"/>'
def face(mood):
    s=''
    E={'happy':('soft','soft'),'delighted':('arc','arc'),'laughing':('squint','squint'),'adoring':('heart','heart'),'sly':('sly','sly'),'cheeky':('arc','soft'),'shocked':('wide','wide'),'sad':('softsad','softsad'),'grumpy':('grump','grump'),'fish':('arc','arc'),'thinking':('softup','softup')}[mood]
    s+=eye(E[0],96,1)+eye(E[1],144,-1)
    B={'happy':('M84,80 Q95,73 106,77','M134,77 Q145,73 156,80'),'sly':('M84,84 Q95,82 106,86','M134,80 Q145,74 156,78'),'sad':('M86,78 Q96,80 105,74','M135,74 Q144,80 154,78'),'grumpy':('M84,78 L106,88','M156,78 L134,88'),'shocked':('M84,74 Q95,66 106,72','M134,72 Q145,66 156,74'),'cheeky':('M84,80 Q95,73 106,77','M134,76 Q145,70 156,76'),'thinking':('M84,82 Q95,78 106,82','M134,74 Q145,64 156,70')}
    if mood in B: s+=line(B[mood][0],3.6)+line(B[mood][1],3.6)
    bl=(8,4.5,.6) if mood in ('happy','cheeky','sad','thinking') else (10,5.5,.85)
    s+=f'<ellipse cx="80" cy="118" rx="{bl[0]}" ry="{bl[1]}" fill="{PINK}" opacity="{bl[2]}"/><ellipse cx="160" cy="118" rx="{bl[0]}" ry="{bl[1]}" fill="{PINK}" opacity="{bl[2]}"/>'
    s+=f'<path d="M114,108 Q120,105 126,108 Q124,114 120,115 Q116,114 114,108 Z" fill="{PINK}" {st(2.4)}/>'
    if mood!='fish': s+=line('M120,115 L120,118',2.8)
    M={'happy':'fang','sly':'smirk','sad':'pout','cheeky':'tongue','grumpy':'zig','shocked':'o','delighted':'open','laughing':'open','adoring':'w','thinking':'hmm'}.get(mood)
    if M=='w': s+=line('M107,117 Q113,125 120,118 Q127,125 133,117',3.2)
    if M=='smirk': s+=line('M108,119 Q114,124 120,119 Q128,124 135,113',3.2)
    if M=='frown': s+=line('M110,126 Q120,117 130,126',3.2)
    if M=='zig': s+=line('M108,124 L114,120 L120,124 L126,120 L132,124',3.2)
    if M=='fang': s+=line('M106,117 Q113,126 120,118 Q127,126 134,116',3.2)+f'<path d="M124.5,121.5 L127,127 L129.5,120.5 Z" fill="#fff" {st(2)}/>'
    if M=='pout': s+=line('M110,128 Q114,122 120,124 Q126,122 130,128',3.2)
    if M=='hmm': s+=line('M111,121 Q118,118 128,123',3.2)
    if M=='o': s+=f'<ellipse cx="120" cy="127" rx="6" ry="8" fill="#6B2A22" {st(3)}/>'
    if M=='open': s+=f'<path d="M106,117 Q120,121 134,117 Q132,138 120,138 Q108,138 106,117 Z" fill="#6B2A22" {st(3)}/><path d="M112,131 Q120,125 128,131 Q124,137 120,137 Q116,137 112,131 Z" fill="#E36E78"/>'
    if M=='tongue': s+=f'<path d="M121,121 Q122,133 128,132 Q133,130 130,120 Z" fill="#E36E78" {st(2.6)}/>'+line('M126,122 L127,127',1.8,'#B04650')+line('M107,118 Q113,124 120,119 Q128,124 135,114',3.2)
    for d in ('M92,116 L56,108','M92,122 L54,124','M148,116 L184,108','M148,122 L186,124'): s+=line(d,2)
    return s
def fishprop():
    s=f'<path d="M156,124 L172,112 Q168,124 172,136 Z" fill="{FISH}" {st(3)}/>'
    s+=f'<path d="M86,124 C92,110 120,108 140,114 C150,117 156,121 158,124 C156,127 150,131 140,134 C120,140 92,138 86,124 Z" fill="{FISH}" {st(3.2)}/>'
    s+=f'<path d="M120,111 Q132,104 142,115" fill="{FISHD}" {st(2.4)}/>'
    s+=line('M100,116 Q104,124 100,132',2.4)+f'<circle cx="94" cy="121" r="2.6" fill="{O}"/>'
    for x in (116,128,140): s+=line(f'M{x},{120} Q{x+4},{124} {x},{128}',1.8,FISHD)
    s+=f'<path d="M108,114 L111,121 L114,114 Z" fill="#fff" {st(1.8)}/><path d="M126,113 L129,120 L132,113 Z" fill="#fff" {st(1.8)}/>'
    return s
def scroll(x,y,w=46,a=0):
    return (f'<g transform="rotate({a} {x} {y})"><rect x="{x-w/2}" y="{y-11}" width="{w}" height="22" rx="2" fill="#F4E9CF" {st(3)}/>'
      +line(f'M{x-w/2+8},{y-3} L{x+w/2-8},{y-3}',2)+line(f'M{x-w/2+8},{y+4} L{x+w/2-16},{y+4}',2)
      +f'<rect x="{x-w/2-6}" y="{y-14}" width="11" height="28" rx="5.5" fill="#E2CFA6" {st(3)}/><rect x="{x+w/2-5}" y="{y-14}" width="11" height="28" rx="5.5" fill="#E2CFA6" {st(3)}/></g>')
def sparkle(x,y,r=9,c='#F2C94C'):
    return f'<path d="M{x},{y-r} Q{x+2},{y-2} {x+r},{y} Q{x+2},{y+2} {x},{y+r} Q{x-2},{y+2} {x-r},{y} Q{x-2},{y-2} {x},{y-r} Z" fill="{c}" {st(2.2)}/>'
def heart(x,y,k=1,a=0):
    return f'<g transform="rotate({a} {x} {y}) scale({k})" transform-origin="{x} {y}"><path d="M{x},{y+8} C{x-12},{y} {x-9},{y-10} {x},{y-4} C{x+9},{y-10} {x+12},{y} {x},{y+8} Z" fill="#D8484A" {st(2.2)}/></g>'
def tear(x,y): return f'<path d="M{x},{y} Q{x+5},{y+8} {x},{y+11} Q{x-5},{y+8} {x},{y} Z" fill="#7FC4E8" {st(2)}/>'
def split(p0,p1,p2,p3,t):
    lerp=lambda a,b:(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)
    a,b_,c=lerp(p0,p1),lerp(p1,p2),lerp(p2,p3);d,e=lerp(a,b_),lerp(b_,c);f=lerp(d,e)
    return (p0,a,d,f),(f,e,c,p3)
def P(seg): return 'M{:.1f},{:.1f} C{:.1f},{:.1f} {:.1f},{:.1f} {:.1f},{:.1f}'.format(*[v for pt in seg for v in pt])
def toga_arm(sh,c1,c2,end,a=0):
    # upper arm is a draped toga sleeve; fur forearm and paw come out of the cuff
    s1,s2=split(sh,c1,c2,end,.5)
    s=limb(P(s2),FUR,18.5)+limb(P(s1),TOGA,25)
    ln=math.dist(s1[0],s1[3])
    for t in ((.3,.62) if ln>34 else ()):
        x,y=bez(*s1,t);x2,y2=bez(*s1,t+.03);dx,dy=x2-x,y2-y;n=math.hypot(dx,dy);nx,ny=-dy/n,dx/n
        s+=line(f'M{x+nx*9:.1f},{y+ny*9:.1f} Q{x+dx/n*4:.1f},{y+dy/n*4:.1f} {x-nx*3:.1f},{y-ny*3:.1f}',2,'#B9A47E')
    fx,fy=s1[3];x2,y2=bez(*s2,.05);dx,dy=x2-fx,y2-fy;n=math.hypot(dx,dy);nx,ny=-dy/n,dx/n
    s+=f'<ellipse cx="{fx:.1f}" cy="{fy:.1f}" rx="13" ry="4.6" transform="rotate({math.degrees(math.atan2(ny,nx)):.1f} {fx:.1f} {fy:.1f})" fill="#E9DCBF" {st(3)}/>'
    return s+paw(end[0],end[1],a)
def tension(arms):
    s=''
    for sh,c1,c2,end,a in arms:
        if end[1]<175:
            k=1 if sh[0]>120 else -1
            s+=line(f'M{120+k*14},{200} Q{120+k*40},{190} {sh[0]-k*4},{sh[1]-6}',2.2,'#B9A47E')+line(f'M{120+k*6},{218} Q{120+k*42},{206} {sh[0]+k*2},{sh[1]+6}',2.2,'#B9A47E')
    return s
BUST='M22,240 C26,196 58,170 100,164 L140,164 C182,170 214,196 218,240 Z'
L=(58,204);R=(182,204)
TAB=lambda:scroll(120,212,74,0)
def think_dots(): return ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFF8EA" {st(2.4)}/>' for x,y,r in ((190,50,4),(202,36,5.5),(216,20,7)))
POSE0={
 'happy':dict(tilt=-6,tab=1,arms=[(L,(66,216),(72,218),(82,212),0),(R,(204,198),(212,168),(204,144),-20)]),
 'delighted':dict(tilt=0,lift=-3,arms=[(L,(44,196),(32,166),(40,140),20),(R,(196,196),(208,166),(200,140),-20)],fx=lambda:sparkle(24,70,10)+sparkle(214,60,8)+sparkle(36,100,6)),
 'laughing':dict(tilt=7,arms=[(L,(70,228),(82,226),(98,214),0),(R,(170,228),(158,226),(142,214),0)],fx=lambda:tear(54,96)+tear(190,110)+sparkle(212,62,7)),
 'adoring':dict(tilt=-8,arms=[(L,(72,196),(92,182),(110,174),15),(R,(168,196),(148,182),(130,174),-15)],fx=lambda:heart(206,66,1,15)+heart(220,104,1,-10)+heart(28,80,1,-15)),
 'sly':dict(tilt=7,tab=1,arms=[(L,(66,216),(72,218),(82,212),0),(R,(198,204),(182,172),(152,166),-30)]),
 'cheeky':dict(tilt=-8,tab=1,arms=[(L,(66,216),(72,218),(82,212),0),(R,(204,198),(210,168),(200,146),-15)],fx=lambda:sparkle(214,70,7)),
 'shocked':dict(tilt=0,lift=-4,arms=[(L,(40,198),(36,166),(56,142),30),(R,(200,198),(204,166),(184,142),-30)],fx=lambda:tear(194,58)),
 'sad':dict(tilt=6,drop=4,tab=1,arms=[(L,(66,218),(70,220),(80,214),0),(R,(174,218),(170,220),(160,214),0)],fx=lambda:tear(150,122)),
 'grumpy':dict(tilt=-3,arms=[(R,(0,0),(0,0),(108,212),-25),(L,(0,0),(0,0),(134,206),20)]),
 'fish':dict(tilt=-6,lift=-2,tab=1,arms=[(L,(66,216),(72,218),(82,212),0),(R,(206,198),(212,166),(204,142),-10)],fx=lambda:sparkle(30,70,9)+sparkle(214,96,6)),
 'thinking':dict(tilt=5,tab=1,arms=[(L,(66,216),(72,218),(82,212),0),(R,(200,204),(184,170),(152,162),-30)],fx=think_dots),
}
GRUMPMARK='<g transform="translate(184 50)">'+''.join(line(d,3,'#C0392B') for d in ('M0,6 Q5,5 6,0','M10,0 Q11,5 16,6','M16,10 Q11,11 10,16','M6,16 Q5,11 0,10'))+'</g>'
POSE=POSE0
def float_paw(end,a,left):
    x,y=end;k=-1 if left else 1
    s=f'<ellipse cx="{x}" cy="{y+17}" rx="8" ry="2.6" fill="{O}" opacity=".12"/>' if y<200 else ''
    s+=f'<g transform="rotate({a} {x} {y})"><ellipse cx="{x}" cy="{y}" rx="14" ry="13" fill="{FUR}" {st(3.2)}/>'
    s+=f'<ellipse cx="{x-k*10}" cy="{y+3}" rx="5.5" ry="6.5" fill="{FUR}" {st(2.8)}/>'
    s+=line(f'M{x-4},{y+3} L{x-4},{y+9}',2.2)+line(f'M{x+3},{y+3} L{x+3},{y+9}',2.2)
    s+=f'<ellipse cx="{x+1}" cy="{y-4}" rx="5" ry="3" fill="#F3B98A" opacity=".55"/></g>'
    if y<150: s+=line(f'M{x+k*20},{y-12} q{k*5},8 0,16',2.2)+line(f'M{x+k*26},{y-8} q{k*4},6 0,11',2.2)
    return s
TUNIC='#E2CB9C'
def raised(P,side): return any(end[1]<160 and (sh[0]<120)==(side<0) for sh,c1,c2,end,a in P['arms'])
def body_path(P):
    l=raised(P,-1);r=raised(P,1)
    s='M54,240 C55,222 59,204 66,190 C72,176 86,166 100,164' if l else 'M22,240 C26,196 58,170 100,164'
    s+=' L140,164 '+('C154,166 168,176 174,190 C181,204 185,222 186,240' if r else 'C182,170 214,196 218,240')
    return s+' Z'
def body_svg(P):
    l=raised(P,-1);r=raised(P,1);bp=body_path(P)
    s=f'<path d="{bp}" fill="{TUNIC}"/><g clip-path="url(#body)">'
    if l and r:   # toga hangs off both shoulders and wraps the waist
        edge='M30,214 C70,200 110,198 150,206 C180,212 200,220 230,230'
        toga=edge+' L240,240 L0,240 Z'
    elif r:       # drapes off his right shoulder (viewer right), stays on the other
        edge='M122,168 C130,190 140,214 144,240'
        toga='M0,140 L122,140 L122,168 C130,190 140,214 144,240 L0,240 Z'
    elif l:
        edge='M118,168 C110,190 100,214 96,240'
        toga='M240,140 L118,140 L118,168 C110,190 100,214 96,240 L240,240 Z'
    else: edge=None;toga='M0,140 L240,140 L240,240 L0,240 Z'
    if l or r:
        s+=line('M160,204 Q166,222 164,238',2,'#B99B66') if r and not l else ''
        s+=line('M90,206 Q84,222 86,238',2,'#B99B66') if l and not r else ''
        s+=line('M96,184 Q120,194 144,184',2,'#B99B66') if l and r else ''
    s+=f'<path d="{toga}" fill="{TOGA}" {st(2.6)}/>'
    if edge is None:
        s+=f'<path d="M150,160 L190,166 L96,240 L52,240 Z" fill="{SASH}" {st(2.4)}/>'
        s+=line('M60,206 Q78,214 84,236',2.4)+line('M178,200 Q170,218 176,240',2.4)+line('M200,214 Q196,228 200,240',2.4)
    else:
        s+=f'<path d="{edge}" fill="none" stroke="{O}" stroke-width="15" stroke-linecap="round"/><path d="{edge}" fill="none" stroke="{SASH}" stroke-width="9.5" stroke-linecap="round"/>'
        if r and not l: s+=line('M60,206 Q78,214 84,236',2.4)+line('M106,196 Q116,214 118,238',2.2)
        if l and not r: s+=line('M178,200 Q170,218 176,240',2.4)+line('M128,196 Q118,214 116,238',2.2)
        if l and r: s+=line('M70,226 Q90,220 104,236',2.2)+line('M150,224 Q170,226 184,238',2.2)
    s+=f'<path d="M120,164 L220,180 L220,240 L150,240 Z" fill="{TSH}" opacity=".3"/></g>'
    s+=f'<path d="{bp}" fill="none" {st(3.6)}/>'
    return s
def head_svg(mood):
    h=f'<path d="M64,74 L66,18 L108,44 Z" fill="{FUR}" {st(3.6)}/><path d="M72,64 L73,30 L98,46 Z" fill="{PINK}"/>'
    h+=f'<path d="M176,74 L174,18 L132,44 Z" fill="{FUR}" {st(3.6)}/><path d="M168,64 L167,30 L142,46 Z" fill="{PINK}"/>'
    h+=f'<path d="{HEAD}" fill="{FUR}" {st(3.6)}/><g clip-path="url(#head)"><ellipse cx="170" cy="104" rx="34" ry="56" fill="{DFUR}" opacity=".5"/>'
    h+=f'<path d="M110,36 L114,56 L118,36 Z M122,36 L126,54 L130,36 Z" fill="{DFUR}"/>'
    h+=line('M55,90 L70,92',3)+line('M55,104 L68,104',3)+line('M185,90 L170,92',3)+line('M185,104 L172,104',3)+'</g>'
    h+=f'<path d="{HEAD}" fill="none" {st(3.6)}/>'
    h+=f'<path d="M94,124 C94,110 108,106 120,110 C132,106 146,110 146,124 C146,140 132,146 120,144 C108,146 94,140 94,124 Z" fill="{MUZ}"/>'
    h+=wreath()+face(mood)
    if mood=='fish': h+=fishprop()
    return h
def build(mood):
    P=POSE[mood];dy=14+P.get('lift',0)+P.get('drop',0)
    s=f'<path d="{BUST}" fill="{TOGA}" {st(3.6)}/><g clip-path="url(#body)"><path d="M150,160 L190,166 L96,240 L52,240 Z" fill="{SASH}" {st(2.4)}/>'
    s+=line('M60,206 Q78,214 84,236',2.4)+line('M178,200 Q170,218 176,240',2.4)+line('M200,214 Q196,228 200,240',2.4)
    s+=f'<path d="M120,164 L220,180 L220,240 L150,240 Z" fill="{TSH}" opacity=".35"/></g>'
    s+=f'<path d="M98,160 Q120,176 142,160 L142,172 Q120,184 98,172 Z" fill="{MUZ}" {st(3)}/>'
    if P.get('tab'): s+=TAB()
    s+=f'<g transform="translate(0 {dy}) rotate({P["tilt"]} 120 150)">{head_svg(mood)}</g>'
    for sh,c1,c2,end,a in P['arms']: s+=float_paw(end,a,sh[0]<120)
    if 'fx' in P: s+=P['fx']()
    if mood=='grumpy': s+=GRUMPMARK
    return s
def svg(mood,face=False):
    vb='46 22 148 148' if face else '0 0 240 240';w=148 if face else 240
    defs=(f'<defs><filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/></filter>'
          f'<clipPath id="head"><path d="{HEAD}"/></clipPath><clipPath id="body"><path d="{BUST}"/></clipPath></defs>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{w}">\n{defs}\n<g filter="url(#rough)">\n{build(mood)}\n</g>\n</svg>\n'
if __name__=='__main__':
    import sys
    out=sys.argv[1]
    for m in POSE:
        open(f'{out}/{m}.svg','w').write(svg(m));open(f'{out}/face-{m}.svg','w').write(svg(m,True))
    if len(sys.argv)>2:
        import cairosvg
        from PIL import Image
        moods=list(POSE);W=Image.new('RGBA',(240*6,240*2+110),'white')
        for i,m in enumerate(moods):
            cairosvg.svg2png(bytestring=svg(m).encode(),write_to='/tmp/a.png',output_width=240);im=Image.open('/tmp/a.png');W.paste(im,((i%6)*240,(i//6)*240),im)
            cairosvg.svg2png(bytestring=svg(m,True).encode(),write_to='/tmp/b.png',output_width=96);im=Image.open('/tmp/b.png');W.paste(im,(10+i*118,490),im)
        W.save(sys.argv[2])
