/* eslint-disable react-refresh/only-export-components -- Static SVG resource registries share this module with their layer components; AvatarRenderer is the refresh boundary. */
import type { ReactNode } from 'react';
import { fitBodyPath, fitBodyX } from './avatarGeometry';
export { hairLayers, BackHairLayer } from './AvatarHair';

export interface LayerProps { skin: string; hair: string; eyes: string; id: string; base?: string; hairstyle?: string; underCap?: boolean }
type Layer = (props: LayerProps) => ReactNode;

// Original vector artwork. Every layer uses the same 300 × 600 coordinate system.
// The pose and anchors never depend on the selected garment.
export function BodyLayer({ id, base }: LayerProps) {
  return <g data-layer="body">
    <path fill={`url(#${id}-skin)`} d={fitBodyPath('M119 203Q150 213 181 203L184 333Q150 347 114 333Z M113 332Q151 342 185 332L190 412 187 536 165 536 153 423 147 402 136 451 128 536 104 536 106 420Z M104 532L128 532 131 554 98 557 92 551Z M165 532L187 532 201 550 197 557 162 554Z',base)}/>
    <path fill={`url(#${id}-skin)`} d={fitBodyPath('M108 211Q92 215 87 241L73 319 66 359Q62 372 69 381 73 386 77 379L79 367 81 380Q85 384 88 378L90 357 102 306 119 247ZM187 211Q206 213 213 240L226 319 233 357Q240 372 232 380 227 384 224 376L222 366 220 379Q215 383 212 376L210 357 199 307 181 246Z',base)} />
    <path fill="#59362e" opacity=".13" d={fitBodyPath('M90 282L80 353 77 367 80 377 86 371 91 342 102 286ZM205 280L215 348 221 365 218 376 213 369 199 284Z',base)} />
    <path fill={`url(#${id}-skin)`} d={base==='feminine'?'M133 158L133 193 119 207Q150 230 181 207L167 193 167 158Z':'M129 158L128 195 112 207Q150 236 190 207L172 194 170 158Z'} />
    <path fill="#513026" opacity=".19" d={base==='feminine'?'M133 162L133 181Q151 190 167 177L167 159Z':'M129 162L129 181Q151 196 171 177L170 159Z'} />
    <path fill={`url(#${id}-skin)`} d={base==='feminine'?'M110 83Q103 48 146 43 190 40 195 83L189 130Q185 155 160 171 149 178 138 170 117 157 110 132L104 108Z':'M110 83Q102 48 146 43 190 40 195 83L190 133Q186 162 163 175 149 182 134 171 112 156 108 131L104 108Z'} />
    <path fill={`url(#${id}-skin)`} d={fitBodyPath('M108 107Q94 101 97 119 98 132 111 132ZM191 107Q205 100 203 117 202 130 190 132Z',base)} />
    <path fill="none" stroke="#663d31" strokeOpacity=".28" strokeWidth="2.5" strokeLinecap="round" d={fitBodyPath('M103 115L106 123M198 114L195 123',base)} />
    <path fill="#fff" opacity=".12" d={fitBodyPath('M118 83Q116 57 145 54 163 51 173 59 135 57 124 91Z',base)} />
  </g>;
}

export function FaceLayer({ hair, eyes, base }: LayerProps) {
  return <g data-layer="face" strokeLinecap="round" strokeLinejoin="round">
    <path d={base==='feminine'?'M119 102Q128 97 137 101M162 101Q171 97 180 102':'M119 102Q128 96 137 100M162 100Q171 96 180 102'} fill="none" stroke={hair} strokeWidth={base==='feminine'?3:4} />
    {[128, 171].map(x => <g key={x}>
      <path d={`M${x - 8} 114Q${x} 105 ${x + 9} 114Q${x + 2} 123 ${x - 8} 116Z`} fill="#fffaf4" />
      <ellipse cx={x + 1} cy="114" rx="4.7" ry="6" fill={eyes} />
      <ellipse cx={x + 1} cy="115" rx="2.2" ry="3.8" fill="#252330" />
      <circle cx={x - .5} cy="111.5" r="1.5" fill="white" />
      <path d={`M${x - 8} 113Q${x} 106 ${x + 9} 113`} stroke="#433039" strokeWidth="1.8" fill="none" />
    </g>)}
    <path d="M149 116L145 132Q149 136 154 132" fill="none" stroke="#603d32" strokeOpacity=".4" strokeWidth="2" />
    <path d="M136 145Q149 153 165 143 160 158 148 157 140 155 136 145Z" fill="#784c44" />
    <path d="M139 146Q151 151 162 145L159 150Q149 154 141 149Z" fill="#fffaf3" />
    <path d="M143 164Q150 166 157 162" stroke="#fff" strokeOpacity=".2" fill="none" strokeWidth="2" />
    <ellipse cx="121" cy="135" rx="8" ry="4" fill="#cf6e68" opacity=".16" />
    <ellipse cx="178" cy="135" rx="8" ry="4" fill="#cf6e68" opacity=".16" />
  </g>;
}

export const avatarAnchors = { waistY: 333, ankleY: 533, leftAnkleX: 116, rightAnkleX: 176 } as const;
const trouserShape = `M110 ${avatarAnchors.waistY}Q149 342 189 ${avatarAnchors.waistY}L195 411 190 ${avatarAnchors.ankleY}Q178 538 162 ${avatarAnchors.ankleY}L153 426 147 405 139 451 131 ${avatarAnchors.ankleY}Q114 538 101 ${avatarAnchors.ankleY}L102 420Z`;
export const bottomLayers: Record<string, Layer> = {
  chinos: ({ base }) => <g data-layer="bottom"><path d={fitBodyPath(trouserShape,base)} fill="currentColor"/><path d={fitBodyPath('M111 345Q149 355 188 345M119 351L135 374M179 351L164 374M150 354L148 389M118 399L116 526M177 399L176 526',base)} stroke="#6e5a46" strokeOpacity=".4" strokeWidth="2" fill="none"/><circle cx="149" cy="350" r="2" fill="#584f42"/></g>,
  jeans: ({ base }) => <g data-layer="bottom" strokeLinejoin="round">
    <path d={fitBodyPath(trouserShape,base)} fill="currentColor" />
    <path d={fitBodyPath('M111 345L108 421 105 525 115 527 122 425 134 354ZM158 355L166 422 170 530 181 532 177 417 179 345Z',base)} fill="#708eb1" opacity=".26" />
    <path d={fitBodyPath('M153 357L150 393 139 451 132 531 124 533 130 445 142 386 145 354ZM187 363L194 411 189 533 181 532 185 422Z',base)} fill="#273e60" opacity=".6" />
    <path d={fitBodyPath('M112 351Q148 358 188 349M150 357L149 389 155 399M115 356Q115 376 135 379M181 355Q181 373 165 379M111 407L109 518M184 407L184 519',base)} fill="none" stroke="#adc1d4" strokeWidth="1.3" opacity=".65" />
    <path d={fitBodyPath('M109 338L109 350Q150 362 190 349L189 337Z',base)} fill="#354c70" />
    <path d={fitBodyPath('M126 342L126 354M173 342L173 354',base)} stroke="#8da3be" strokeWidth="3" />
    <circle cx="150" cy="350" r="2.3" fill="#c4b4a1" />
    <path d={fitBodyPath('M103 521L131 523 131 535 101 533ZM162 523L191 523 190 535 163 535Z',base)} fill="#6c85a3" />
  </g>,
  joggers: ({ base }) => <g data-layer="bottom">
    <path d={fitBodyPath(trouserShape,base)} fill="currentColor" />
    <path d={fitBodyPath('M111 354L110 419 108 512M185 353L187 419 184 512',base)} fill="none" stroke="#c9c3dd" strokeWidth="4" />
    <path d={fitBodyPath('M150 363L146 398 136 451 130 525M179 378L173 406 182 441',base)} fill="none" stroke="#353345" strokeWidth="5" opacity=".4" />
    <path d={fitBodyPath('M110 341Q149 351 189 340M117 360L130 379M181 360L168 379',base)} fill="none" stroke="#aaa2ba" strokeWidth="2" />
    <path d={fitBodyPath('M145 351L143 373M154 351L158 372',base)} stroke="#e5dfed" strokeWidth="2.5" />
    <path d={fitBodyPath('M103 520L132 522 130 538 103 535ZM162 522L192 521 190 536 164 538Z',base)} fill="#403d50" />
  </g>,
};

function Sneakers({ color }: { color: string }) {
  return <g data-layer="shoes" strokeLinejoin="round">
    {[false, true].map(right => <g key={String(right)} transform={right ? `translate(${avatarAnchors.leftAnkleX+avatarAnchors.rightAnkleX} 0) scale(-1 1)` : undefined}>
      <path d="M101 533Q114 538 130 533L134 553Q133 565 117 566L79 566Q71 561 78 551L96 544Z" fill={color} stroke="#56546a" strokeOpacity=".25" strokeWidth="1.5" />
      <path d="M80 550L101 544 110 553 101 559 77 559Z" fill="#fff" opacity=".4" />
      <path d="M75 559Q101 563 134 556L133 566Q104 574 76 568Z" fill="#e9e7ee" />
      <path d="M77 566L131 565M101 545L115 548M97 549L111 552M93 553L107 556" stroke="#b3afc1" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M119 539L122 550 130 549" stroke="#78658f" strokeWidth="3" fill="none" />
    </g>)}
  </g>;
}
export const shoeLayers: Record<string, Layer> = {
  sneakers: () => <Sneakers color="currentColor" />,
  sport: () => <><Sneakers color="currentColor"/><path d="M93 554L98 561M100 551L105 559M107 549L112 557M199 554L194 561M192 551L187 559M185 549L180 557" stroke="#d5e9d9" strokeWidth="3"/></>,
};

// Sleeve openings enclose the actual arm cross-section at y=266 (short)
// and y=346 (long). Inner edges join the torso at the same armpit anchor.
const longSleeves = 'M115 203Q93 204 85 240L71 319 66 345Q80 355 96 348L108 299 120 244ZM185 203Q207 204 215 240L229 319 234 345Q220 355 204 348L192 299 180 244Z';
const torso = 'M115 203L130 196Q148 208 169 196L184 203 189 272 191 339Q152 353 107 340L111 272Z';
export const topLayers: Record<string, Layer> = {
  tee: ({ id, base }) => <g data-layer="top">
    <path d={fitBodyPath('M130 197L115 203Q95 204 86 240L81 261Q98 270 114 268L119 247 113 292 108 339Q150 350 190 339L187 292 181 247 186 268Q202 270 219 261L214 240Q205 204 185 203L170 197Q150 215 130 197Z',base)} fill={`url(#${id}-tee)`} />
    <path d={fitBodyPath('M129 198Q150 223 171 198',base)} stroke="currentColor" strokeWidth="7" fill="none" />
    <path d={fitBodyPath('M130 199Q150 216 169 199',base)} stroke="var(--avatar-highlight)" strokeWidth="2" fill="none" />
    <path d={fitBodyPath('M84 258Q100 266 114 264M186 264Q200 266 216 258M114 333Q150 341 185 333M119 247L122 268M181 247L178 268',base)} stroke="var(--avatar-highlight)" strokeOpacity=".5" strokeWidth="2" fill="none" />
    <path d={fitBodyPath('M160 239L177 239 176 258Q168 265 161 258Z',base)} fill="currentColor" stroke="currentColor" strokeWidth="1" />
    <path d={fitBodyPath('M121 290Q130 298 137 294M167 313L182 307',base)} stroke="var(--avatar-highlight)" strokeOpacity=".4" fill="none" strokeWidth="2" />
  </g>,
  hoodie: ({ id, base }) => <g data-layer="top">
    <path d={fitBodyPath(longSleeves,base)} fill={`url(#${id}-cloth)`} />
    <path d={fitBodyPath(torso,base)} fill={`url(#${id}-cloth)`} />
    <path d={fitBodyPath('M127 194Q112 184 120 179L135 180Q150 189 166 179L179 183Q186 197 174 207L151 221 127 207Z',base)} fill="currentColor" />
    <path d={fitBodyPath('M128 193Q148 212 172 193L169 204 150 218 131 205Z',base)} fill="var(--avatar-highlight)" />
    <path d={fitBodyPath('M135 211L134 256M164 211L166 256',base)} stroke="var(--avatar-highlight)" strokeWidth="2.6" strokeLinecap="round" />
    <path d={fitBodyPath('M133 253L133 258M166 253L166 258',base)} stroke="var(--avatar-detail)" strokeWidth="3" />
    <path d={fitBodyPath('M131 282L168 282 179 311Q150 319 120 310Z',base)} fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    <path d={fitBodyPath('M131 285L123 300M168 285L176 300M129 308Q150 312 170 308M103 257L98 292M195 258L201 292M84 320L94 309M207 309L218 322',base)} stroke="var(--avatar-highlight)" strokeOpacity=".6" fill="none" strokeWidth="2" />
    <path d={fitBodyPath('M108 328Q150 341 190 328L191 342Q151 356 107 342ZM68 334Q82 343 100 337L96 350Q80 357 66 346ZM232 334Q218 343 200 337L204 350Q220 357 234 346Z',base)} fill="currentColor" />
    <path d={fitBodyPath('M114 338Q152 350 184 338',base)} stroke="var(--avatar-highlight)" strokeWidth="1.3" fill="none" />
  </g>,
  jacket: ({ id, base }) => <g data-layer="top">
    <path d={fitBodyPath(longSleeves,base)} fill={`url(#${id}-jacket)`} />
    <path d={fitBodyPath(torso,base)} fill="#f0eaf4" />
    <path d={fitBodyPath('M130 197L115 201 109 273 107 341 141 346 139 233ZM170 197L184 202 189 272 192 341 158 346 160 233Z',base)} fill={`url(#${id}-jacket)`} />
    <path d={fitBodyPath('M130 193L120 207 139 237 147 221ZM170 193L179 207 160 237 152 221Z',base)} fill="currentColor" />
    <path d={fitBodyPath('M139 233L141 340M160 233L158 340M120 279L115 306M180 279L184 306',base)} fill="none" stroke="var(--avatar-highlight)" strokeWidth="2" />
    <path d={fitBodyPath('M113 259L131 259 130 274 115 274ZM168 259L185 259 184 274 169 274Z',base)} fill="currentColor" stroke="var(--avatar-highlight)" strokeWidth="1.2" />
    <path d={fitBodyPath('M111 329L137 333M163 333L187 329M95 249L89 292M204 249L211 292M81 320L93 310M207 311L219 321',base)} stroke="var(--avatar-highlight)" strokeWidth="1.5" fill="none" />
    <path d={fitBodyPath('M68 334Q82 343 100 337L96 350Q80 357 66 346ZM232 334Q218 343 200 337L204 350Q220 357 234 346Z',base)} fill="currentColor" />
    {[248, 283, 320].map(y => <circle key={y} cx={fitBodyX(136,y,base)} cy={y} r="2" fill="#e8e0cf" />)}
  </g>,
};

export const accessoryLayers: Record<string, Layer> = {
  sunglasses: () => <g data-layer="accessory" fill="currentColor" stroke="currentColor" strokeWidth="3"><path d="M110 105Q126 101 142 106L140 121Q127 129 114 121ZM158 106Q173 101 189 105L186 121Q174 128 160 121Z"/><path d="M142 109L158 109M104 104L112 108M188 108L196 103" fill="none"/><path d="M116 109L124 107M164 109L172 107" stroke="#fff" strokeOpacity=".4" strokeWidth="2"/></g>,
  headphones: () => <g data-layer="accessory" fill="currentColor"><path d="M99 112Q91 36 148 34 207 35 202 111L195 111Q200 44 149 43 103 44 106 112Z"/><path d="M98 106Q111 100 114 112L115 134Q108 145 99 136ZM190 110Q196 101 204 107L204 132Q198 143 189 135Z" stroke="#c3afd8" strokeWidth="2"/></g>,
  medal: () => <g data-layer="accessory"><path d="M130 195L147 231 171 195M138 203L149 226 162 204" stroke="#5a729d" strokeWidth="5" fill="none"/><circle cx="149" cy="235" r="11" fill="currentColor" stroke="#ead8a9" strokeWidth="2"/><path d="M149 228L151 233 156 233 152 237 153 242 149 239 145 242 146 237 142 233 147 233Z" fill="#f7e9b7"/></g>,
  crown: () => <g data-layer="accessory" fill="currentColor" stroke="#e2cf8e" strokeWidth="2"><path d="M105 70L101 38 125 51 149 27 171 49 196 35 192 71Q151 59 105 70Z"/><path d="M108 64Q150 55 189 65" fill="none"/><circle cx="148" cy="48" r="4" fill="#9684b7"/></g>,
  flower: () => <g data-layer="accessory" fill="currentColor" stroke="#e4c7db" strokeWidth="1.5">{[0,72,144,216,288].map(angle=><ellipse key={angle} cx="193" cy="90" rx="5" ry="9" transform={`rotate(${angle} 193 98)`}/>)}<circle cx="193" cy="98" r="4" fill="#e1bd79"/></g>,
  mask: () => <g data-layer="accessory"><path d="M109 105Q128 95 145 107L156 107Q177 95 191 105L184 125 166 126 150 116 135 127 115 123Z" fill="currentColor"/><path d="M118 113Q128 104 139 113Q130 122 118 113ZM162 113Q174 104 183 113Q174 122 162 113Z" fill="#eee8fa" fillOpacity=".7"/></g>,
  none: () => null,
  cap: () => <g data-layer="accessory">
    <path d="M103 80Q98 24 144 15 192 9 200 72L190 88Q149 70 106 89Z" fill="currentColor" />
    <path d="M145 35Q166 48 168 77M113 76Q149 63 191 80" stroke="#a593c3" strokeWidth="2" fill="none" />
    <path d="M108 81Q150 67 192 79L214 90Q220 99 205 100L162 91Q135 84 106 92Z" fill="currentColor" />
    <path d="M142 49L153 48 156 61 145 63Z" fill="#c4b6e0" />
  </g>,
  glasses: () => <g data-layer="accessory" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round">
    <path d="M111 105Q126 101 142 106L140 121Q127 129 114 121ZM158 106Q173 101 189 105L186 121Q174 128 160 121ZM142 109Q150 105 158 109M111 108L104 104M189 108L196 103" />
    <path d="M116 108L122 106M164 108L170 106" stroke="#fff" strokeOpacity=".65" strokeWidth="2" />
  </g>,
};
