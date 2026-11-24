/**
 * The White Bloom stage's stylesheet: the design's own section styles,
 * scoped to the stage, plus the stage frame and the Arabic overrides.
 * vw is replaced by cqw so the card sizes to its column (the builder frame
 * is narrower than the window).
 */
export const BLOOM_CSS = `
/* platform base for the venue and RSVP blocks */
[data-stage="bloom"] .lb-inner{align-items:center;flex-direction:column;gap:16px;margin-inline:auto;display:flex;position:relative;text-align:center}
[data-stage="bloom"] .lb-eyebrow{letter-spacing:.32em;text-transform:uppercase;margin:0}
[data-stage="bloom"] .lb-body{max-width:60ch;margin:0}
[data-stage="bloom"] .lb-venue,[data-stage="bloom"] .lb-address{margin:0}
[data-stage="bloom"] .lb-map iframe{border:0;width:100%;height:100%;display:block}
[data-stage="bloom"] .lb-btn{font:inherit;cursor:pointer;color:inherit;background:0 0;border:1px solid #0000;border-radius:999px;justify-content:center;align-items:center;gap:8px;padding:12px 26px;text-decoration:none;transition:transform .18s,background .18s,color .18s;display:inline-flex}
[data-stage="bloom"] .lb-btn:hover{transform:translateY(-2px)}
[data-stage="bloom"] .lb-card{width:100%}
[data-stage="bloom"] .lb-form{text-align:start;flex-direction:column;gap:14px;display:flex}
[data-stage="bloom"] .lb-field{flex-direction:column;gap:6px;display:flex}
[data-stage="bloom"] .lb-field input:not([type=radio]):not([type=checkbox]),[data-stage="bloom"] .lb-field textarea,[data-stage="bloom"] .lb-field select{font:inherit;appearance:none;width:100%;font-size:max(16px,1em);box-sizing:border-box}
[data-stage="bloom"] .lb-field textarea{resize:vertical}
[data-stage="bloom"] .lb-choices{flex-wrap:wrap;display:flex}
[data-stage="bloom"] .lb-choices label{cursor:pointer;align-items:center;max-width:100%;display:inline-flex}
[data-stage="bloom"] .lb-choices input{flex:none;margin:0}
/* cover */
[data-stage="bloom"] .tpi{position:fixed;inset:0;z-index:20;overflow:hidden;direction:ltr;text-align:center;line-height:1.25;color:#0b3f48;font-family:'Cormorant Garamond', 'Amiri', serif;background:radial-gradient(70% 60% at 50% 48%, #ffffff, #eff1f2 70%, #e2e5e7);transition:opacity .7s ease;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;touch-action:none;cursor:pointer}
[data-stage="bloom"] .tpi *, [data-stage="bloom"] .tpi *::before, [data-stage="bloom"] .tpi *::after{box-sizing:border-box;margin:0;padding:0}
[data-stage="bloom"] .tpi.is-leave{opacity:0;pointer-events:none}
[data-stage="bloom"] .tpi.is-done{visibility:hidden}
[data-stage="bloom"] .tpi.is-done *{animation:none !important}
[data-stage="bloom"] .tpi-cam{position:absolute;left:0;top:0;width:100%;height:100%}
[data-stage="bloom"] .tpi.is-fly .tpi-cam{transform:scale(3.4);transition:transform 1.7s cubic-bezier(.55, 0, .25, 1)}
[data-stage="bloom"] .tpi-bg{position:absolute;background-repeat:no-repeat;background-size:100% 100%;opacity:0;transform:scale(1.06);transition:opacity 1.2s ease, transform 3.2s cubic-bezier(.2, .7, .2, 1)}
[data-stage="bloom"] .tpi.is-ready .tpi-bg{opacity:1;transform:none}
[data-stage="bloom"] .tpi.is-wide .tpi-bg{-webkit-mask-image:linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);mask-image:linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)}
[data-stage="bloom"] .tpi-ov{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:50%}
[data-stage="bloom"] .tpi-ov::before{content:'';position:absolute;inset:6%;border-radius:50%;background:radial-gradient(closest-side, rgba(255, 255, 255, .75), rgba(255, 255, 255, 0))}
[data-stage="bloom"] .tpi-ov > p, [data-stage="bloom"] .tpi-ov > div{position:relative;opacity:0;transform:translateY(10px);transition:opacity .9s ease, transform 1.1s cubic-bezier(.2, .8, .2, 1)}
[data-stage="bloom"] .tpi.is-ready .tpi-ov > *{opacity:1;transform:none}
[data-stage="bloom"] .tpi.is-ready .tpi-ov > .tpi-k{transition-delay:.7s}
[data-stage="bloom"] .tpi.is-ready .tpi-ov > .tpi-n1{transition-delay:1s}
[data-stage="bloom"] .tpi.is-ready .tpi-ov > .tpi-a{transition-delay:1.25s}
[data-stage="bloom"] .tpi.is-ready .tpi-ov > .tpi-n2{transition-delay:1.45s}
[data-stage="bloom"] .tpi.is-ready .tpi-ov > .tpi-r{transition-delay:1.75s}
[data-stage="bloom"] .tpi.is-ready .tpi-ov > .tpi-d{transition-delay:1.95s}
[data-stage="bloom"] .tpi.is-press .tpi-ov{transform:scale(.96);transition:transform .18s ease}
[data-stage="bloom"] .tpi.is-ready.is-fly .tpi-ov > p, [data-stage="bloom"] .tpi.is-ready.is-fly .tpi-ov > div{opacity:0;transform:none;transition:opacity .55s ease;transition-delay:0s}
[data-stage="bloom"] .tpi-k{white-space:nowrap;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:.3em;letter-spacing:.3em;padding-left:.3em;text-transform:uppercase;color:#2f7f88}
[data-stage="bloom"] .tpi-n1, [data-stage="bloom"] .tpi-n2{font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:1.42em;line-height:1.02;padding:0 .15em;white-space:nowrap;color:#0b3f48;background:linear-gradient(100deg, #0b3f48 0%, #0b3f48 42%, #5fc3c9 50%, #0b3f48 58%, #0b3f48 100%) 100% 0 / 260% 100% no-repeat;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
[data-stage="bloom"] .tpi-k{margin-bottom:.2em}
[data-stage="bloom"] .tpi.is-shine .tpi-n1, [data-stage="bloom"] .tpi.is-shine .tpi-n2{animation:tpi-shine 6s ease-in-out infinite}
[data-stage="bloom"] .tpi.is-shine .tpi-n2{animation-delay:.25s}
@keyframes tpi-shine{0%{background-position:100% 0}40%, 100%{background-position:0 0}}
[data-stage="bloom"] .tpi-a{font-family:'Playfair Display', serif;font-style:italic;font-size:.46em;line-height:1.1;color:#b8975a}
[data-stage="bloom"] .tpi-r{display:flex;align-items:center;gap:.22em;margin:.45em 0 .35em}
[data-stage="bloom"] .tpi-r i{display:block;width:.2em;height:.2em;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 1px 2px rgba(11, 63, 72, .25)}
[data-stage="bloom"] .tpi-r i:nth-child(2), [data-stage="bloom"] .tpi-r i:nth-child(4){width:.14em;height:.14em}
[data-stage="bloom"] .tpi-r i:first-child, [data-stage="bloom"] .tpi-r i:last-child{width:.09em;height:.09em}
[data-stage="bloom"] .tpi-d{white-space:nowrap;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:.32em;letter-spacing:.26em;padding-left:.26em;color:#0b3f48}
[data-stage="bloom"] .tpi-btn{position:absolute;left:50%;bottom:max(5vh, 24px);transform:translateX(-50%);display:inline-flex;align-items:center;gap:10px;padding:10px 24px 11px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:13px;line-height:1.3;letter-spacing:.32em;text-transform:uppercase;white-space:nowrap;color:#0b3f48;background:rgba(255, 255, 255, .9);border:1px solid rgba(47, 127, 136, .7);border-radius:999px;box-shadow:inset 0 0 0 3px rgba(255, 255, 255, .95), inset 0 0 0 4px rgba(184, 151, 90, .45), 0 14px 26px -14px rgba(4, 40, 48, .55);cursor:pointer;-webkit-appearance:none;appearance:none;opacity:0;transition:opacity 1s 2.2s ease}
[data-stage="bloom"] .tpi.is-ready .tpi-btn{opacity:1}
[data-stage="bloom"] .tpi-btn i{display:block;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 1px 2px rgba(11, 63, 72, .3);flex:none}
[data-stage="bloom"] .tpi.is-burst .tpi-btn{opacity:0;transition:opacity .3s ease}
[data-stage="bloom"] .tpi-fx{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
[data-stage="bloom"] .tpi-pl{position:absolute;left:0;top:0;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:radial-gradient(circle at 34% 28%, #ffffff 0 16%, #f6f3ee 38%, #ddd7cd 72%, #b4ab9f 100%);box-shadow:0 3px 4px -1px rgba(4, 40, 48, .35);opacity:0;will-change:transform, opacity}
[data-stage="bloom"] .tpi-pl.m{width:10px;height:10px;margin:-5px 0 0 -5px}
[data-stage="bloom"] .tpi-pl.s{width:7px;height:7px;margin:-3.5px 0 0 -3.5px}
[data-stage="bloom"] .tpi-fl{position:absolute;left:0;top:0;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:60% 6% 60% 6%;background:radial-gradient(80% 80% at 30% 30%, #8fe0e3, #2aa3ad 55%, #136c78);opacity:0;will-change:transform, opacity}
[data-stage="bloom"] .tpi-fl.w{background:radial-gradient(80% 80% at 30% 30%, #ffffff, #eef1f0 60%, #cfd8d8);box-shadow:0 1px 2px rgba(4, 40, 48, .18)}
[data-stage="bloom"] .tpi-fl.s{width:11px;height:11px;margin:-5.5px 0 0 -5.5px}
[data-stage="bloom"] .tpi-veil{position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(60% 50% at 50% 50%, #ffffff, rgba(255, 255, 255, .92) 60%, rgba(240, 246, 246, .9));opacity:0}
[data-stage="bloom"] .tpi.is-fly .tpi-veil{opacity:1;transition:opacity .7s 1.15s ease}
[data-stage="bloom"] .tpi.is-still *, [data-stage="bloom"] .tpi.is-still *::before, [data-stage="bloom"] .tpi.is-still *::after{transition-duration:.01s !important;transition-delay:0s !important;animation:none !important}
/* verse */
[data-stage="bloom"] .tpa{position:relative;width:min(88cqw, 400px);margin:0 auto 10px;direction:ltr;text-align:center;line-height:1.3;color:#f6fbfb;font-family:'Cormorant Garamond', 'Amiri', serif}
[data-stage="bloom"] .tpa *, [data-stage="bloom"] .tpa *::before, [data-stage="bloom"] .tpa *::after{box-sizing:border-box;margin:0;padding:0}
[data-stage="bloom"] .tpa-frame{position:absolute;inset:0;pointer-events:none}
[data-stage="bloom"] .tpa-frame svg{position:absolute;left:0;top:0;overflow:visible}
[data-stage="bloom"] .tpa-frame .ln{fill:none;stroke:#e2c98f;stroke-width:1;stroke-linecap:round;stroke-linejoin:round}
[data-stage="bloom"] .tpa-frame .ln.o{stroke-opacity:.55}
[data-stage="bloom"] .tpa-frame .pl{opacity:0;transition:opacity .6s ease}
[data-stage="bloom"] .tpa-frame .pl.on{opacity:1}
[data-stage="bloom"] .tpa-in{position:relative;padding:0 9% 40px}
[data-stage="bloom"] .tpa-gem{display:flex;justify-content:center;gap:6px;margin-bottom:14px}
[data-stage="bloom"] .tpa-gem i{display:block;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 1px 3px rgba(0, 0, 0, .35)}
[data-stage="bloom"] .tpa-gem i:nth-child(2){width:10px;height:10px;margin-top:-1.5px}
[data-stage="bloom"] .tpa-bism{direction:rtl;font-family:'Amiri', 'Aref Ruqaa', serif;font-weight:700;font-size:28px;line-height:1.7;white-space:nowrap;color:#f2e3bd;background:linear-gradient(100deg, #f2e3bd 0%, #f2e3bd 40%, #ffffff 50%, #f2e3bd 60%, #f2e3bd 100%) 100% 0 / 260% 100% no-repeat;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
[data-stage="bloom"] .tpa.is-live .tpa-bism{animation:tpa-shine 6s 1s ease-in-out infinite}
@keyframes tpa-shine{0%{background-position:100% 0}45%, 100%{background-position:0 0}}
[data-stage="bloom"] .tpa-tr{margin-top:2px;font-style:italic;font-weight:500;font-size:16.5px;line-height:1.45;color:rgba(246, 251, 251, .72)}
[data-stage="bloom"] .tpa-rule{display:flex;align-items:center;justify-content:center;gap:8px;width:46%;margin:18px auto 20px}
[data-stage="bloom"] .tpa-rule i{flex:1;height:1px;background:linear-gradient(90deg, rgba(226, 201, 143, 0), rgba(226, 201, 143, .8))}
[data-stage="bloom"] .tpa-rule i:last-child{background:linear-gradient(270deg, rgba(226, 201, 143, 0), rgba(226, 201, 143, .8))}
[data-stage="bloom"] .tpa-rule b{width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);flex:none}
[data-stage="bloom"] .tpa-ayah{font-weight:500;font-size:22.5px;line-height:1.6;color:#f6fbfb}
[data-stage="bloom"] .tpa-ref{margin-top:16px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:11.5px;letter-spacing:.42em;padding-left:.42em;text-transform:uppercase;color:#e2c98f}
/* invitation card */
[data-stage="bloom"] .tpv{position:relative;width:min(88cqw, 380px);margin:0 auto 6px;direction:ltr;text-align:center;line-height:1.3;color:#0b3f48;font-family:'Cormorant Garamond', 'Amiri', serif;-webkit-tap-highlight-color:transparent}
[data-stage="bloom"] .tpv *, [data-stage="bloom"] .tpv *::before, [data-stage="bloom"] .tpv *::after{box-sizing:border-box;margin:0;padding:0}
[data-stage="bloom"] .tpv-card{position:relative;padding:50px 24px 46px;border-radius:4px;background:radial-gradient(120% 60% at 50% 0%, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0) 60%), linear-gradient(180deg, #fdfdfb, #f5f6f4);box-shadow:0 0 0 1px rgba(47, 127, 136, .28), 0 30px 50px -28px rgba(4, 40, 48, .55), 0 8px 18px -10px rgba(4, 40, 48, .25);cursor:pointer}
[data-stage="bloom"] .tpv.is-open .tpv-card{cursor:default}
[data-stage="bloom"] .tpv-card::before{content:'';position:absolute;inset:11px;border:1px solid rgba(184, 151, 90, .55);border-radius:2px;pointer-events:none}
[data-stage="bloom"] .tpv-card::after{content:'';position:absolute;inset:15px;border:1px solid rgba(47, 127, 136, .25);border-radius:1px;pointer-events:none}
[data-stage="bloom"] .tpv-txt{position:relative;z-index:1}
[data-stage="bloom"] .tpv-txt > *{opacity:.22;transition:opacity .9s ease, transform 1s cubic-bezier(.2, .8, .2, 1)}
[data-stage="bloom"] .tpv.is-open .tpv-txt > *{opacity:1}
[data-stage="bloom"] .tpv.is-open .tpv-txt > :nth-child(1){transition-delay:.55s}
[data-stage="bloom"] .tpv.is-open .tpv-txt > :nth-child(2){transition-delay:.7s}
[data-stage="bloom"] .tpv.is-open .tpv-txt > :nth-child(3){transition-delay:.85s}
[data-stage="bloom"] .tpv.is-open .tpv-txt > :nth-child(4){transition-delay:1s}
[data-stage="bloom"] .tpv.is-open .tpv-txt > :nth-child(5){transition-delay:1.15s}
[data-stage="bloom"] .tpv.is-open .tpv-txt > :nth-child(6){transition-delay:1.3s}
[data-stage="bloom"] .tpv.is-open .tpv-txt > :nth-child(7){transition-delay:1.45s}
[data-stage="bloom"] .tpv.is-open .tpv-txt > :nth-child(8){transition-delay:1.6s}
[data-stage="bloom"] .tpv-k{font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:11.5px;line-height:1.6;letter-spacing:.3em;padding-left:.3em;text-transform:uppercase;color:#2f7f88}
[data-stage="bloom"] .tpv-n{font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:54px;line-height:1.08;color:#0b3f48;white-space:nowrap}
[data-stage="bloom"] .tpv-k + .tpv-n{margin-top:14px}
[data-stage="bloom"] .tpv-a{font-family:'Playfair Display', serif;font-style:italic;font-size:22px;line-height:1.1;color:#b8975a}
[data-stage="bloom"] .tpv-r{display:flex;align-items:center;justify-content:center;gap:7px;margin:18px auto 16px}
[data-stage="bloom"] .tpv-r i{display:block;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 1px 2px rgba(11, 63, 72, .3)}
[data-stage="bloom"] .tpv-r i:nth-child(3){width:9px;height:9px}
[data-stage="bloom"] .tpv-r b{display:block;width:42px;height:1px;background:linear-gradient(90deg, rgba(184, 151, 90, 0), #b8975a)}
[data-stage="bloom"] .tpv-r b:last-child{background:linear-gradient(270deg, rgba(184, 151, 90, 0), #b8975a)}
[data-stage="bloom"] .tpv-p{max-width:26ch;margin:0 auto;font-style:italic;font-weight:500;font-size:19px;line-height:1.5;color:#2c5b62}
[data-stage="bloom"] .tpv-d{margin-top:18px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:14px;line-height:1.6;letter-spacing:.2em;padding-left:.2em;text-transform:uppercase;color:#0b3f48}
[data-stage="bloom"] .tpv-t{margin-top:2px;font-style:italic;font-size:17px;line-height:1.5;color:#2c5b62}
[data-stage="bloom"] .tpv-rb{position:absolute;inset:0;z-index:2;pointer-events:none;-webkit-clip-path:inset(0 round 4px);clip-path:inset(0 round 4px)}
[data-stage="bloom"] .tpv-rb > i{position:absolute;display:block;transition:transform 1s cubic-bezier(.6, 0, .2, 1), opacity 1s ease}
[data-stage="bloom"] .tpv-rb > .v1, [data-stage="bloom"] .tpv-rb > .v2{left:50%;width:46px;margin-left:-23px;background:linear-gradient(90deg, #08414b 0%, #157a86 16%, #3fb3bb 38%, #a5e4e6 47%, #3fb3bb 56%, #13707c 80%, #073a43 100%);box-shadow:-1px 0 0 rgba(255, 255, 255, .35), 1px 0 0 rgba(255, 255, 255, .35), 0 0 10px rgba(4, 40, 48, .25)}
[data-stage="bloom"] .tpv-rb > .v1{top:0;height:50%}
[data-stage="bloom"] .tpv-rb > .v2{bottom:0;height:50%}
[data-stage="bloom"] .tpv-rb > .h1, [data-stage="bloom"] .tpv-rb > .h2{top:50%;height:46px;margin-top:-23px;background:linear-gradient(180deg, #08414b 0%, #157a86 16%, #3fb3bb 38%, #a5e4e6 47%, #3fb3bb 56%, #13707c 80%, #073a43 100%);box-shadow:0 -1px 0 rgba(255, 255, 255, .35), 0 1px 0 rgba(255, 255, 255, .35), 0 0 10px rgba(4, 40, 48, .25)}
[data-stage="bloom"] .tpv-rb > .h1{left:0;width:50%}
[data-stage="bloom"] .tpv-rb > .h2{right:0;width:50%}
[data-stage="bloom"] .tpv-rb > .t1, [data-stage="bloom"] .tpv-rb > .t2{top:50%;left:50%;width:30px;height:92px;margin:6px 0 0 -15px;background:linear-gradient(90deg, #0a4a55, #2aa3ad 40%, #8fdadd 50%, #2aa3ad 60%, #0a4a55);-webkit-clip-path:polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%);clip-path:polygon(0 0, 100% 0, 100% 100%, 50% 86%, 0 100%);transform-origin:50% 0}
[data-stage="bloom"] .tpv-rb > .t1{transform:rotate(24deg)}
[data-stage="bloom"] .tpv-rb > .t2{transform:rotate(-24deg)}
[data-stage="bloom"] .tpv.is-open .tpv-rb > .v1{transform:translateY(-104%);transition-delay:.2s}
[data-stage="bloom"] .tpv.is-open .tpv-rb > .v2{transform:translateY(104%);transition-delay:.2s}
[data-stage="bloom"] .tpv.is-open .tpv-rb > .h1{transform:translateX(-104%);transition-delay:.3s}
[data-stage="bloom"] .tpv.is-open .tpv-rb > .h2{transform:translateX(104%);transition-delay:.3s}
[data-stage="bloom"] .tpv.is-open .tpv-rb > .t1{transform:rotate(40deg) translateY(160px);opacity:0;transition-duration:.8s}
[data-stage="bloom"] .tpv.is-open .tpv-rb > .t2{transform:rotate(-40deg) translateY(160px);opacity:0;transition-duration:.8s}
[data-stage="bloom"] .tpv-br{position:absolute;left:50%;top:50%;z-index:3;width:78px;height:78px;margin:-39px 0 0 -39px;pointer-events:none;transition:transform .7s cubic-bezier(.5, -0.3, .4, 1), opacity .5s .15s ease}
[data-stage="bloom"] .tpv-br svg{display:block;width:100%;height:100%}
[data-stage="bloom"] .tpv.is-press .tpv-br{transform:scale(.92);transition:transform .15s ease}
[data-stage="bloom"] .tpv.is-open .tpv-br{transform:translateY(-46px) scale(.5);opacity:0}
[data-stage="bloom"] .tpv-hint{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:18px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:11.5px;letter-spacing:.32em;padding-left:.32em;text-transform:uppercase;color:#2f7f88;transition:opacity .5s ease}
[data-stage="bloom"] .tpv-hint i{display:block;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 1px 2px rgba(11, 63, 72, .3)}
[data-stage="bloom"] .tpv.is-live .tpv-hint{animation:tpv-hint 2.4s ease-in-out infinite}
@keyframes tpv-hint{0%, 100%{opacity:1}50%{opacity:.45}}
[data-stage="bloom"] .tpv.is-open .tpv-hint{opacity:0;animation:none}
[data-stage="bloom"] .tpv.is-still *, [data-stage="bloom"] .tpv.is-still *::before, [data-stage="bloom"] .tpv.is-still *::after{transition-duration:.01s !important;transition-delay:0s !important;animation:none !important}
/* save the date */
[data-stage="bloom"] .tpd{position:relative;width:min(90cqw, 400px);margin:0 auto 6px;direction:ltr;text-align:center;line-height:1.3;color:#f6fbfb;font-family:'Cormorant Garamond', 'Amiri', serif}
[data-stage="bloom"] .tpd *, [data-stage="bloom"] .tpd *::before, [data-stage="bloom"] .tpd *::after{box-sizing:border-box;margin:0;padding:0}
[data-stage="bloom"] .tpd-h{font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:50px;line-height:1.15;color:#f6fbfb}
[data-stage="bloom"] .tpd-sub{margin-top:8px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:12px;letter-spacing:.26em;padding-left:.26em;text-transform:uppercase;color:rgba(246, 251, 251, .72)}
[data-stage="bloom"] .tpd-row{position:relative;display:flex;align-items:center;justify-content:center;gap:min(9.5cqw, 38px);margin:50px auto 48px}
[data-stage="bloom"] .tpd-line{position:absolute;left:4%;right:4%;top:50%;height:1px;background:linear-gradient(90deg, rgba(226, 201, 143, 0), rgba(226, 201, 143, .75) 18%, rgba(226, 201, 143, .75) 82%, rgba(226, 201, 143, 0));transform:scaleX(0);transition:transform 1.2s .2s cubic-bezier(.2, .7, .2, 1)}
[data-stage="bloom"] .tpd.is-live .tpd-line{transform:none}
[data-stage="bloom"] .tpd-gem{position:relative;flex:none;width:min(13.5cqw, 56px);height:min(13.5cqw, 56px)}
[data-stage="bloom"] .tpd-gem.c{width:min(20.5cqw, 86px);height:min(20.5cqw, 86px)}
[data-stage="bloom"] .tpd-gem > b{position:absolute;inset:0;border:1px solid #e2c98f;background:linear-gradient(135deg, rgba(255, 255, 255, .16), rgba(255, 255, 255, .03) 55%, rgba(255, 255, 255, .1));box-shadow:inset 0 0 0 4px rgba(10, 75, 92, .6), inset 0 0 0 5px rgba(246, 251, 251, .4), 0 18px 30px -18px rgba(0, 0, 0, .6);transform:rotate(0deg) scale(.5);opacity:0;transition:transform 1.1s cubic-bezier(.2, .9, .3, 1.15), opacity .7s ease}
[data-stage="bloom"] .tpd.is-live .tpd-gem > b{transform:rotate(45deg);opacity:1}
[data-stage="bloom"] .tpd.is-live .tpd-gem.c > b{transition-delay:.15s}
[data-stage="bloom"] .tpd.is-live .tpd-gem.r > b{transition-delay:.3s}
[data-stage="bloom"] .tpd-gem > span{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity .8s .7s ease}
[data-stage="bloom"] .tpd.is-live .tpd-gem > span{opacity:1}
[data-stage="bloom"] .tpd-gem.c > span{transition-delay:.85s}
[data-stage="bloom"] .tpd-gem.r > span{transition-delay:1s}
[data-stage="bloom"] .tpd-mo, [data-stage="bloom"] .tpd-yr{font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:min(3.3cqw, 13.5px);letter-spacing:.12em;padding-left:.14em;text-transform:uppercase;color:#f6fbfb}
[data-stage="bloom"] .tpd-dy{font-family:'Cormorant Garamond', serif;font-weight:500;font-size:min(11cqw, 46px);line-height:1;color:#f6fbfb}
[data-stage="bloom"] .tpd-pl{position:absolute;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 2px 3px rgba(0, 0, 0, .35);opacity:0;transform:scale(.4);transition:opacity .5s ease, transform .6s cubic-bezier(.2, .9, .3, 1.4)}
[data-stage="bloom"] .tpd.is-live .tpd-pl{opacity:1;transform:none}
[data-stage="bloom"] .tpd-pl.a{left:2%;transition-delay:1.1s}
[data-stage="bloom"] .tpd-pl.b{right:2%;transition-delay:1.15s}
[data-stage="bloom"] .tpd-drop{position:absolute;left:50%;top:100%;width:12px;height:15px;margin:14px 0 0 -6px;border-radius:50% 50% 50% 50% / 42% 42% 58% 58%;background:radial-gradient(circle at 35% 30%, #fff 0 22%, #ece7e0 55%, #b2a99c);box-shadow:0 3px 5px rgba(0, 0, 0, .4);opacity:0;transform:translateY(-8px);transition:opacity .6s 1.25s ease, transform .9s 1.25s cubic-bezier(.2, .9, .3, 1.4)}
[data-stage="bloom"] .tpd-drop::before{content:'';position:absolute;left:50%;bottom:100%;width:1px;height:12px;background:#e2c98f}
[data-stage="bloom"] .tpd.is-live .tpd-drop{opacity:1;transform:none}
[data-stage="bloom"] .tpd-when{display:flex;align-items:center;justify-content:center;gap:14px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:13.5px;letter-spacing:.22em;text-transform:uppercase;color:#f6fbfb}
[data-stage="bloom"] .tpd-when i{display:block;width:5px;height:5px;border-radius:50%;background:#e2c98f}
[data-stage="bloom"] .tpd-add{display:inline-flex;align-items:center;gap:10px;margin-top:26px;padding:11px 24px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:12.5px;letter-spacing:.24em;text-transform:uppercase;text-decoration:none;color:#f6fbfb;border:1px solid rgba(226, 201, 143, .75);border-radius:999px;box-shadow:inset 0 0 0 3px rgba(10, 75, 92, .9), inset 0 0 0 4px rgba(246, 251, 251, .22);transition:background-color .3s ease, color .3s ease}
[data-stage="bloom"] .tpd-add:hover{background:#f6fbfb;color:#0b3f48}
[data-stage="bloom"] .tpd-add i{display:block;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5)}
[data-stage="bloom"] .tpd.is-still *, [data-stage="bloom"] .tpd.is-still *::before, [data-stage="bloom"] .tpd.is-still *::after{transition-duration:.01s !important;transition-delay:0s !important}
/* countdown */
[data-stage="bloom"] .tpc{position:relative;width:min(92cqw, 400px);margin:0 auto 6px;direction:ltr;text-align:center;line-height:1.3;color:#0b3f48;font-family:'Cormorant Garamond', 'Amiri', serif}
[data-stage="bloom"] .tpc *, [data-stage="bloom"] .tpc *::before, [data-stage="bloom"] .tpc *::after{box-sizing:border-box;margin:0;padding:0}
[data-stage="bloom"] .tpc-k{font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:11.5px;letter-spacing:.34em;padding-left:.34em;text-transform:uppercase;color:#2f7f88}
[data-stage="bloom"] .tpc-h{margin-top:6px;font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:48px;line-height:1.15;color:#0b3f48}
[data-stage="bloom"] .tpc-bar{position:relative;height:14px;margin:30px 2% 0}
[data-stage="bloom"] .tpc-bar::before{content:'';position:absolute;left:0;right:0;top:6px;height:1px;background:linear-gradient(90deg, rgba(184, 151, 90, 0), #b8975a 12%, #b8975a 88%, rgba(184, 151, 90, 0))}
[data-stage="bloom"] .tpc-bar i{position:absolute;top:3px;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 1px 2px rgba(11, 63, 72, .3)}
[data-stage="bloom"] .tpc-bar i:nth-child(1){left:6%}
[data-stage="bloom"] .tpc-bar i:nth-child(2){left:50%}
[data-stage="bloom"] .tpc-bar i:nth-child(3){left:94%}
[data-stage="bloom"] .tpc-row{display:flex;justify-content:space-around;align-items:flex-start;margin-top:-7px}
[data-stage="bloom"] .tpc-u{display:flex;flex-direction:column;align-items:center;width:24%;transform-origin:50% 0}
[data-stage="bloom"] .tpc.is-live .tpc-u{animation:tpc-sway 4.6s ease-in-out infinite alternate}
[data-stage="bloom"] .tpc.is-live .tpc-u:nth-child(2){animation-duration:5.2s;animation-delay:-1.2s}
[data-stage="bloom"] .tpc.is-live .tpc-u:nth-child(3){animation-duration:4.9s;animation-delay:-2.6s}
[data-stage="bloom"] .tpc.is-live .tpc-u:nth-child(4){animation-duration:5.5s;animation-delay:-.6s}
@keyframes tpc-sway{0%{transform:rotate(-2.2deg)}100%{transform:rotate(2.2deg)}}
[data-stage="bloom"] .tpc-ch{width:2px;height:30px;background:repeating-linear-gradient(180deg, #b8975a 0 3px, rgba(184, 151, 90, .25) 3px 5px)}
[data-stage="bloom"] .tpc-u:nth-child(2) .tpc-ch{height:52px}
[data-stage="bloom"] .tpc-u:nth-child(3) .tpc-ch{height:40px}
[data-stage="bloom"] .tpc-u:nth-child(4) .tpc-ch{height:60px}
[data-stage="bloom"] .tpc-cap{width:14px;height:7px;margin-top:-1px;border-radius:7px 7px 2px 2px;background:linear-gradient(180deg, #f1dfae, #b8975a 60%, #7d6232)}
[data-stage="bloom"] .tpc-pearl{position:relative;display:flex;align-items:center;justify-content:center;width:min(20cqw, 80px);height:min(20cqw, 80px);margin-top:-2px;border-radius:50%;background:radial-gradient(circle at 70% 78%, rgba(120, 210, 214, .28), rgba(120, 210, 214, 0) 45%), radial-gradient(circle at 32% 26%, #ffffff 0 9%, #f8f6f2 24%, #ebe6de 52%, #d2c9bc 80%, #b9ae9f 100%);box-shadow:inset -5px -7px 12px rgba(140, 128, 112, .28), 0 14px 18px -10px rgba(4, 40, 48, .45);opacity:0;transform:translateY(-14px) scale(.85);transition:opacity .8s ease, transform 1s cubic-bezier(.2, .9, .3, 1.25)}
[data-stage="bloom"] .tpc.is-in .tpc-pearl{opacity:1;transform:none}
[data-stage="bloom"] .tpc.is-in .tpc-u:nth-child(2) .tpc-pearl{transition-delay:.12s}
[data-stage="bloom"] .tpc.is-in .tpc-u:nth-child(3) .tpc-pearl{transition-delay:.24s}
[data-stage="bloom"] .tpc.is-in .tpc-u:nth-child(4) .tpc-pearl{transition-delay:.36s}
[data-stage="bloom"] .tpc-pearl::after{content:'';position:absolute;left:22%;top:16%;width:26%;height:14%;border-radius:50%;background:rgba(255, 255, 255, .9);transform:rotate(-32deg)}
[data-stage="bloom"] .tpc-n{position:relative;z-index:1;font-family:'Cormorant Garamond', serif;font-weight:600;font-size:min(7.6cqw, 31px);line-height:1;color:#0b3f48;font-variant-numeric:tabular-nums}
[data-stage="bloom"] .tpc-l{margin-top:10px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:min(2.7cqw, 11px);letter-spacing:.2em;padding-left:.2em;text-transform:uppercase;color:#2f7f88}
[data-stage="bloom"] .tpc-note{margin-top:30px;font-style:italic;font-size:18px;line-height:1.5;color:#2c5b62}
[data-stage="bloom"] .tpc.is-still *, [data-stage="bloom"] .tpc.is-still *::before, [data-stage="bloom"] .tpc.is-still *::after{transition-duration:.01s !important;transition-delay:0s !important;animation:none !important}
/* program */
[data-stage="bloom"] .tpp{position:relative;width:min(92cqw, 410px);margin:0 auto 10px;direction:ltr;text-align:center;line-height:1.3;color:#f6fbfb;font-family:'Cormorant Garamond', 'Amiri', serif}
[data-stage="bloom"] .tpp *, [data-stage="bloom"] .tpp *::before, [data-stage="bloom"] .tpp *::after{box-sizing:border-box;margin:0;padding:0}
[data-stage="bloom"] .tpp-k{font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:11.5px;letter-spacing:.36em;padding-left:.36em;text-transform:uppercase;color:#e2c98f}
[data-stage="bloom"] .tpp-h{margin-top:6px;font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:50px;line-height:1.15;color:#f6fbfb}
[data-stage="bloom"] .tpp-tl{position:relative;margin-top:34px;padding:6px 0 34px}
[data-stage="bloom"] .tpp-track, [data-stage="bloom"] .tpp-fill{position:absolute;left:50%;top:0;bottom:34px;width:1px;margin-left:-.5px}
[data-stage="bloom"] .tpp-track{background:rgba(226, 201, 143, .22)}
[data-stage="bloom"] .tpp-fill{background:linear-gradient(180deg, #f2e3bd, #e2c98f);transform-origin:50% 0;transform:scaleY(0)}
[data-stage="bloom"] .tpp-it{position:relative;display:grid;grid-template-columns:1fr 34px 1fr;align-items:start;min-height:96px}
[data-stage="bloom"] .tpp-it + .tpp-it{margin-top:6px}
[data-stage="bloom"] .tpp-dot{grid-column:2;grid-row:1;justify-self:center;position:relative;width:16px;height:16px;margin-top:3px;border-radius:50%;background:radial-gradient(circle at 34% 28%, #fff 0 18%, #f1ede6 45%, #b7ad9f 100%);box-shadow:0 3px 5px rgba(0, 0, 0, .4);opacity:.32;transform:scale(.7);transition:opacity .5s ease, transform .6s cubic-bezier(.2, .9, .3, 1.5)}
[data-stage="bloom"] .tpp-dot::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:1px solid rgba(226, 201, 143, .8);opacity:0;transform:scale(.6);transition:opacity .5s .1s ease, transform .7s .1s ease}
[data-stage="bloom"] .tpp-it.on .tpp-dot{opacity:1;transform:none}
[data-stage="bloom"] .tpp-it.on .tpp-dot::after{opacity:1;transform:none}
[data-stage="bloom"] .tpp-t{grid-row:1;padding:0 4px;opacity:.2;transform:translateX(14px);transition:opacity .7s ease, transform .8s cubic-bezier(.2, .8, .2, 1)}
[data-stage="bloom"] .tpp-it:nth-child(odd) .tpp-t{grid-column:3;text-align:left}
[data-stage="bloom"] .tpp-it:nth-child(even) .tpp-t{grid-column:1;text-align:right;transform:translateX(-14px)}
[data-stage="bloom"] .tpp-it.on .tpp-t{opacity:1;transform:none}
[data-stage="bloom"] .tpp-time{font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:#e2c98f}
[data-stage="bloom"] .tpp-ti{margin-top:2px;font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:28px;line-height:1.15;color:#f6fbfb}
[data-stage="bloom"] .tpp-de{margin-top:3px;font-style:italic;font-size:15.5px;line-height:1.4;color:rgba(246, 251, 251, .72)}
[data-stage="bloom"] .tpp-end{position:absolute;left:50%;bottom:14px;width:24px;height:24px;margin-left:-12px;border-radius:50%;background:radial-gradient(circle at 34% 28%, #fff 0 18%, #f1ede6 45%, #b7ad9f 100%);box-shadow:0 4px 7px rgba(0, 0, 0, .45);opacity:.3;transform:scale(.6);transition:opacity .6s ease, transform .8s cubic-bezier(.2, .9, .3, 1.5)}
[data-stage="bloom"] .tpp.is-end .tpp-end{opacity:1;transform:none}
/* venue */
[data-stage="bloom"] .bl-venue .lb-inner{gap:8px;line-height:1.5;direction:ltr;width:min(100%, 400px);margin:0 auto;padding:34px 22px 32px;background:linear-gradient(180deg, rgba(255, 255, 255, .95), rgba(247, 249, 248, .93)) !important;border-radius:4px;box-shadow:0 0 0 1px rgba(47, 127, 136, .35), 0 0 0 6px rgba(255, 255, 255, .7), 0 0 0 7px rgba(184, 151, 90, .55), 0 30px 50px -26px rgba(4, 40, 48, .5)}
[data-stage="bloom"] .bl-venue .lb-eyebrow{display:flex;align-items:center;justify-content:center;gap:12px;margin:0;font-family:'Marcellus', 'Cormorant Garamond', Georgia, serif;font-weight:400;font-size:11.5px;line-height:1.4;letter-spacing:.4em;text-transform:uppercase;color:#2f7f88}
[data-stage="bloom"] .bl-venue .lb-eyebrow::before, [data-stage="bloom"] .bl-venue .lb-eyebrow::after{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 1px 2px rgba(11, 63, 72, .3)}
[data-stage="bloom"] .bl-venue .lb-heading{margin:0;font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:clamp(40px, 11.5cqw, 50px);line-height:1.15;color:#0b3f48}
[data-stage="bloom"] .bl-venue .lb-venue{margin:0;font-family:'Marcellus', 'Cormorant Garamond', Georgia, serif;font-weight:400;font-size:clamp(17px, 5cqw, 21px);line-height:1.4;letter-spacing:.08em;text-transform:uppercase;color:#0b3f48}
[data-stage="bloom"] .bl-venue .lb-address{margin:0;max-width:30ch;font-family:'Cormorant Garamond', Georgia, serif;font-style:italic;font-size:18px;line-height:1.6;color:#2c5b62}
[data-stage="bloom"] .bl-venue .lb-note{margin:0;max-width:32ch;font-family:'Cormorant Garamond', Georgia, serif;font-size:16px;line-height:1.6;color:#4f6f74}
[data-stage="bloom"] .bl-venue .lb-map{position:relative;width:230px !important;max-width:64cqw !important;height:auto !important;aspect-ratio:4 / 5;margin:26px auto 18px !important;overflow:hidden !important;border-radius:999px 999px 6px 6px !important;border:1px solid #0b3f48 !important;background:#e6eceb;box-shadow:0 0 0 6px #ffffff, 0 0 0 7px rgba(47, 127, 136, .8), 0 0 0 11px #ffffff, 0 0 0 12px rgba(184, 151, 90, .75), 0 30px 40px -24px rgba(4, 40, 48, .55) !important}
[data-stage="bloom"] .bl-venue .lb-map iframe, [data-stage="bloom"] .bl-venue .lb-map > :not(.tpl-pin){width:100% !important;height:100% !important}
[data-stage="bloom"] .bl-venue .lb-btn--solid, [data-stage="bloom"] .bl-venue .lb-inner .lb-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:9px;margin-top:6px;padding:12px 28px;font-family:'Marcellus', 'Cormorant Garamond', Georgia, serif;font-weight:400;font-size:13.5px;line-height:1.4;letter-spacing:.24em;text-transform:uppercase;color:#ffffff;background:linear-gradient(180deg, #1f8f9b, #0f6470 60%, #0a4b55);border:1px solid rgba(226, 201, 143, .9);border-radius:999px;box-shadow:inset 0 0 0 3px #0c5762, inset 0 0 0 4px rgba(226, 201, 143, .45), 0 14px 24px -14px rgba(4, 40, 48, .8)}
[data-stage="bloom"] .bl-venue .lb-btn--solid::after, [data-stage="bloom"] .bl-venue .lb-inner .lb-btn::after{content:'';position:absolute;top:0;bottom:0;left:-40%;width:30%;background:linear-gradient(100deg, transparent, rgba(255, 255, 255, .35), transparent);transform:translateX(0) skewX(-18deg);animation:tpl-sheen 4.6s 1.5s ease-in-out infinite}
@keyframes tpl-sheen{0%, 65%{transform:translateX(0) skewX(-18deg)}100%{transform:translateX(560%) skewX(-18deg)}}
[data-stage="bloom"] .bl-venue .tpl-pin{position:absolute !important;left:50%;top:50%;width:30px !important;height:42px !important;margin:-42px 0 0 -15px;z-index:3;pointer-events:none;animation:tpl-bob 2.6s ease-in-out infinite}
[data-stage="bloom"] .bl-venue .tpl-pin svg{display:block;width:100%;height:100%;filter:drop-shadow(0 5px 4px rgba(4, 40, 48, .4))}
@keyframes tpl-bob{0%, 100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
/* rsvp */
[data-stage="bloom"] .bl-rsvp .lb-inner{gap:10px;line-height:1.6;background:transparent !important;direction:ltr}
[data-stage="bloom"] .bl-rsvp .lb-eyebrow{display:flex;align-items:center;justify-content:center;gap:12px;margin:0;font-family:'Marcellus', 'Cormorant Garamond', Georgia, serif;font-weight:400;font-size:11.5px;line-height:1.4;letter-spacing:.4em;text-transform:uppercase;color:#e2c98f}
[data-stage="bloom"] .bl-rsvp .lb-eyebrow::before, [data-stage="bloom"] .bl-rsvp .lb-eyebrow::after{content:"";flex:none;width:30px;height:1px;background:linear-gradient(90deg, transparent, rgba(226, 201, 143, .9))}
[data-stage="bloom"] .bl-rsvp .lb-eyebrow::after{background:linear-gradient(270deg, transparent, rgba(226, 201, 143, .9))}
[data-stage="bloom"] .bl-rsvp .lb-heading{margin:0;font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:clamp(40px, 11.5cqw, 50px);line-height:1.15;color:#f6fbfb}
[data-stage="bloom"] .bl-rsvp .lb-body{margin:8px 0 6px;max-width:30ch;font-family:'Cormorant Garamond', Georgia, serif;font-style:italic;font-size:18px;line-height:1.6;color:rgba(246, 251, 251, .82)}
[data-stage="bloom"] .bl-rsvp .lb-card{position:relative;width:min(100%, 400px);border-radius:4px;background:radial-gradient(120% 50% at 50% 0%, rgba(255, 255, 255, .9), rgba(255, 255, 255, 0) 60%), linear-gradient(180deg, rgba(255, 255, 255, .98), rgba(244, 247, 246, .97));border:1px solid rgba(47, 127, 136, .5);outline:1px solid rgba(184, 151, 90, .5);outline-offset:-10px;box-shadow:0 0 0 5px rgba(255, 255, 255, .55), 0 0 0 6px rgba(226, 201, 143, .6), 0 28px 46px -26px rgba(0, 0, 0, .55);color:#0b3f48}
[data-stage="bloom"] .bl-rsvp .lb-rsvp{margin-top:44px;padding:54px 26px 28px}
[data-stage="bloom"] .bl-rsvp .lb-guest-hi{margin:0 0 14px;padding:8px 14px;font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-size:27px;line-height:1.3;color:#0b3f48;background:rgba(47, 127, 136, .06);border-radius:3px}
[data-stage="bloom"] .bl-rsvp .lb-form{gap:16px}
[data-stage="bloom"] .bl-rsvp .lb-field{gap:6px}
[data-stage="bloom"] .bl-rsvp .lb-field > span{font-family:'Marcellus', 'Cormorant Garamond', Georgia, serif;font-weight:400;font-size:13px;line-height:1.4;letter-spacing:.2em;text-transform:uppercase;color:#0f6470}
[data-stage="bloom"] .bl-rsvp .lb-q-hint{font-family:'Cormorant Garamond', Georgia, serif;font-size:14px;color:rgba(11, 63, 72, .6)}
[data-stage="bloom"] .bl-rsvp .lb-q-req{color:#b8975a}
[data-stage="bloom"] .bl-rsvp .lb-field input:not([type="radio"]):not([type="checkbox"]), [data-stage="bloom"] .bl-rsvp .lb-field textarea, [data-stage="bloom"] .bl-rsvp .lb-field select{padding:11px 14px;font-family:'Cormorant Garamond', Georgia, serif;font-size:18px;line-height:1.5;color:#0b3f48;background:rgba(255, 255, 255, .9);border:1px solid rgba(47, 127, 136, .4);border-radius:3px;transition:border-color .25s ease, box-shadow .25s ease}
[data-stage="bloom"] .bl-rsvp .lb-field input:not([type="radio"]):not([type="checkbox"]):focus, [data-stage="bloom"] .bl-rsvp .lb-field textarea:focus, [data-stage="bloom"] .bl-rsvp .lb-field select:focus{outline:none;background:#fff;border-color:#0f6470;box-shadow:0 0 0 3px rgba(47, 127, 136, .14)}
[data-stage="bloom"] .bl-rsvp .lb-field textarea{min-height:90px}
[data-stage="bloom"] .bl-rsvp .lb-choices{flex-direction:row;flex-wrap:wrap;gap:10px}
[data-stage="bloom"] .bl-rsvp .lb-choices label{flex:1 1 130px;justify-content:center;gap:9px;white-space:normal;padding:11px 12px;font-family:'Cormorant Garamond', Georgia, serif;font-weight:700;font-size:17px;line-height:1.4;color:#0b3f48;background:rgba(255, 255, 255, .8);border:1px solid rgba(47, 127, 136, .4);border-radius:999px;transition:background .3s ease, color .3s ease, transform .3s ease}
[data-stage="bloom"] .bl-rsvp .lb-choices label:has(input:checked){color:#ffffff;background:linear-gradient(180deg, #1f8f9b, #0f6470);border-color:#0f6470;transform:scale(1.03)}
[data-stage="bloom"] .bl-rsvp .lb-choices input{-webkit-appearance:none;appearance:none;width:16px;height:16px;margin:0;flex:none;border:1.5px solid #2f7f88;border-radius:50%;background:#fff}
[data-stage="bloom"] .bl-rsvp .lb-choices input[type="radio"]:checked{background:radial-gradient(circle at 35% 30%, #fff 0 2px, #e9e4dc 4px, #b9b1a5 6px);border-color:#e2c98f}
[data-stage="bloom"] .bl-rsvp .lb-choices input[type="checkbox"]{border-radius:3px}
[data-stage="bloom"] .bl-rsvp .lb-choices input[type="checkbox"]:checked{background:#e2c98f;box-shadow:inset 0 0 0 3px #fff}
[data-stage="bloom"] .bl-rsvp .lb-rsvp .lb-btn--solid{position:relative;overflow:hidden;margin-top:4px;padding:13px 26px;font-family:'Marcellus', 'Cormorant Garamond', Georgia, serif;font-weight:400;font-size:14px;line-height:1.4;letter-spacing:.26em;text-transform:uppercase;color:#ffffff;background:linear-gradient(180deg, #1f8f9b, #0f6470 60%, #0a4b55);border:0;border-radius:999px;box-shadow:inset 0 0 0 3px #0c5762, inset 0 0 0 4px rgba(226, 201, 143, .5), 0 14px 24px -14px rgba(4, 40, 48, .8)}
[data-stage="bloom"] .bl-rsvp .lb-rsvp .lb-btn--solid::after{content:'';position:absolute;top:0;bottom:0;left:-40%;width:30%;background:linear-gradient(100deg, transparent, rgba(255, 255, 255, .35), transparent);transform:translateX(0) skewX(-18deg);animation:tpr-sheen 4.5s 1.5s ease-in-out infinite}
@keyframes tpr-sheen{0%, 65%{transform:translateX(0) skewX(-18deg)}100%{transform:translateX(560%) skewX(-18deg)}}
[data-stage="bloom"] .bl-rsvp .lb-rsvp .lb-btn--solid:disabled{opacity:.8;cursor:default}
[data-stage="bloom"] .bl-rsvp .lb-rsvp .lb-btn.is-sent{opacity:1;color:#0b3f48;background:#e8f2f2;box-shadow:none}
[data-stage="bloom"] .bl-rsvp .lb-form-msg{padding:12px 16px;font-family:'Cormorant Garamond', Georgia, serif;font-size:18px;line-height:1.6;color:#0b3f48;background:rgba(47, 127, 136, .07);border-radius:3px}
[data-stage="bloom"] .bl-rsvp .lb-form-note, [data-stage="bloom"] .bl-rsvp .lb-rsvp-closed{font-family:'Cormorant Garamond', Georgia, serif;color:rgba(11, 63, 72, .7)}
[data-stage="bloom"] .bl-rsvp .lb-pass-title{font-family:'Great Vibes', 'Cormorant Garamond', cursive;color:#0b3f48}
[data-stage="bloom"] .bl-rsvp .lb-rsvp-wishes{margin-top:16px;padding:22px 20px 20px}
[data-stage="bloom"] .bl-rsvp .lb-rsvp-wishes-title{font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:32px;line-height:1.3;color:#0b3f48}
[data-stage="bloom"] .bl-rsvp .lb-rsvp-wish{padding:12px 15px;background:rgba(255, 255, 255, .8);border-inline-start:3px solid #2f7f88;border-radius:3px}
[data-stage="bloom"] .bl-rsvp .lb-rsvp-wish p{font-family:'Cormorant Garamond', Georgia, serif;font-size:17px;line-height:1.6;color:#0b3f48}
[data-stage="bloom"] .bl-rsvp .lb-rsvp-wish cite{font-family:'Cormorant Garamond', Georgia, serif;font-weight:700;font-size:14px;color:#b8975a}
[data-stage="bloom"] .bl-rsvp .lb-rsvp{position:relative}
[data-stage="bloom"] .bl-rsvp .tpr-br{position:absolute;left:50%;top:-39px;width:78px;height:78px;margin-left:-39px;z-index:3;pointer-events:none}
[data-stage="bloom"] .bl-rsvp .tpr-br svg{display:block;width:100%;height:100%;filter:drop-shadow(0 6px 6px rgba(0, 0, 0, .3))}
/* thank you */
[data-stage="bloom"] .tpz{position:relative;width:min(86cqw, 350px);margin:0 auto 6px;direction:ltr;text-align:center;line-height:1.3;color:#0b3f48;font-family:'Cormorant Garamond', 'Amiri', serif;-webkit-tap-highlight-color:transparent}
[data-stage="bloom"] .tpz *, [data-stage="bloom"] .tpz *::before, [data-stage="bloom"] .tpz *::after{box-sizing:border-box;margin:0;padding:0}
[data-stage="bloom"] .tpz-ov{position:relative;aspect-ratio:3 / 4;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 16%;cursor:pointer}
[data-stage="bloom"] .tpz-ov::before{content:'';position:absolute;inset:7%;border-radius:50%;background:radial-gradient(closest-side, rgba(255, 255, 255, .92), rgba(255, 255, 255, .55) 70%, rgba(255, 255, 255, 0))}
[data-stage="bloom"] .tpz-fr{position:absolute;inset:0;pointer-events:none}
[data-stage="bloom"] .tpz-fr svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}
[data-stage="bloom"] .tpz-fr .ln{fill:none;stroke-width:1}
[data-stage="bloom"] .tpz-fr .ln.g{stroke:#b8975a}
[data-stage="bloom"] .tpz-fr .ln.t{stroke:#2f7f88;stroke-opacity:.6}
[data-stage="bloom"] .tpz-fr .pl{opacity:0;transition:opacity .5s ease}
[data-stage="bloom"] .tpz.is-live .tpz-fr .pl{opacity:1}
[data-stage="bloom"] .tpz-fx{position:absolute;inset:0;pointer-events:none;overflow:hidden;-webkit-clip-path:inset(0);clip-path:inset(0)}
[data-stage="bloom"] .tpz-ov > p, [data-stage="bloom"] .tpz-ov > .tpz-r{position:relative;opacity:0;transform:translateY(10px);transition:opacity .9s ease, transform 1.1s cubic-bezier(.2, .8, .2, 1)}
[data-stage="bloom"] .tpz.is-live .tpz-ov > p, [data-stage="bloom"] .tpz.is-live .tpz-ov > .tpz-r{opacity:1;transform:none}
[data-stage="bloom"] .tpz.is-live .tpz-ov > :nth-child(3){transition-delay:.6s}
[data-stage="bloom"] .tpz.is-live .tpz-ov > :nth-child(4){transition-delay:.8s}
[data-stage="bloom"] .tpz.is-live .tpz-ov > :nth-child(5){transition-delay:1s}
[data-stage="bloom"] .tpz.is-live .tpz-ov > :nth-child(6){transition-delay:1.2s}
[data-stage="bloom"] .tpz.is-live .tpz-ov > :nth-child(7){transition-delay:1.4s}
[data-stage="bloom"] .tpz.is-live .tpz-ov > :nth-child(8){transition-delay:1.6s}
[data-stage="bloom"] .tpz-k{font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:10.5px;letter-spacing:.32em;padding-left:.32em;text-transform:uppercase;color:#2f7f88;white-space:nowrap}
[data-stage="bloom"] .tpz-h{margin-top:6px;font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:58px;line-height:1.05;color:#0b3f48;white-space:nowrap}
[data-stage="bloom"] .tpz-p{margin-top:8px;font-style:italic;font-size:17px;line-height:1.45;color:#2c5b62}
[data-stage="bloom"] .tpz-r{display:flex;align-items:center;justify-content:center;gap:6px;margin:14px auto 10px}
[data-stage="bloom"] .tpz-r i{display:block;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff 0 25%, #e9e4dc 60%, #b9b1a5);box-shadow:0 1px 2px rgba(11, 63, 72, .3)}
[data-stage="bloom"] .tpz-r i:nth-child(2){width:8px;height:8px}
[data-stage="bloom"] .tpz-n{font-family:'Great Vibes', 'Cormorant Garamond', cursive;font-weight:400;font-size:36px;line-height:1.15;color:#0b3f48;white-space:nowrap}
[data-stage="bloom"] .tpz-n b{font-family:'Playfair Display', serif;font-style:italic;font-weight:400;font-size:.5em;color:#b8975a}
[data-stage="bloom"] .tpz-d{margin-top:6px;font-family:'Marcellus', 'Cormorant Garamond', serif;font-size:11.5px;letter-spacing:.28em;padding-left:.28em;color:#0b3f48;white-space:nowrap}
[data-stage="bloom"] .tpz-pl{position:absolute;left:0;top:0;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;background:radial-gradient(circle at 34% 28%, #ffffff 0 16%, #f6f3ee 38%, #ddd7cd 72%, #b4ab9f 100%);box-shadow:0 3px 4px -1px rgba(4, 40, 48, .35);will-change:transform, opacity}
[data-stage="bloom"] .tpz-pl.s{width:7px;height:7px;margin:-3.5px 0 0 -3.5px}
[data-stage="bloom"] .tpz.is-still *, [data-stage="bloom"] .tpz.is-still *::before, [data-stage="bloom"] .tpz.is-still *::after{transition-duration:.01s !important;transition-delay:0s !important}
/* ── stage ─────────────────────────────────────────────────────────── */
[data-stage="bloom"]{background:#eef1f1;color:#0b3f48;font-family:'Cormorant Garamond',Georgia,serif;-webkit-font-smoothing:antialiased}
[data-stage="bloom"] .bl-doc{position:relative;margin:0 auto;width:100%;max-width:520px;container-type:inline-size;box-shadow:0 0 70px rgba(4,40,48,.18)}
[data-stage="bloom"] .bl-sec{position:relative;display:flex;flex-direction:column;align-items:center;padding:clamp(30px,9.615cqw,50px) 0;background-repeat:no-repeat;background-size:100% auto;overflow:hidden}
[data-stage="bloom"] .bl-sec.flowers-top{padding-top:var(--bl-flowers)}
[data-stage="bloom"] .bl-sec.flowers-bottom{padding-bottom:var(--bl-flowers)}
[data-stage="bloom"] .bl-sec > .bl-in{width:100%;padding:0 16px;box-sizing:border-box}
/* the cover drawn in place (builder, gallery) instead of over the page */
[data-stage="bloom"] .tpi.is-inline{position:absolute}
[data-stage="bloom"] .bl-cover-slot{position:relative;height:var(--bl-h,100svh);overflow:hidden}
/* ── Arabic: the script faces become Aref Ruqaa, small caps lose their tracking ── */
[data-stage="bloom"].is-ar .tpi-n1,[data-stage="bloom"].is-ar .tpi-n2{font-family:'Aref Ruqaa',serif;font-size:1.05em;line-height:1.5;padding:0 .1em}
[data-stage="bloom"].is-ar .tpv-n,[data-stage="bloom"].is-ar .tpd-h,[data-stage="bloom"].is-ar .tpc-h,[data-stage="bloom"].is-ar .tpp-h,[data-stage="bloom"].is-ar .tpz-h,[data-stage="bloom"].is-ar .tpz-n,[data-stage="bloom"].is-ar .lb-heading,[data-stage="bloom"].is-ar .tpp-ti{font-family:'Aref Ruqaa',serif;line-height:1.5}
[data-stage="bloom"].is-ar .tpv-n{font-size:40px} [data-stage="bloom"].is-ar .tpd-h,[data-stage="bloom"].is-ar .tpp-h{font-size:38px} [data-stage="bloom"].is-ar .tpc-h{font-size:36px}
[data-stage="bloom"].is-ar .tpz-h{font-size:44px} [data-stage="bloom"].is-ar .tpz-n{font-size:28px} [data-stage="bloom"].is-ar .tpp-ti{font-size:21px} [data-stage="bloom"].is-ar .lb-heading{font-size:38px}
[data-stage="bloom"].is-ar .tpi-k,[data-stage="bloom"].is-ar .tpi-d,[data-stage="bloom"].is-ar .tpi-btn,[data-stage="bloom"].is-ar .tpa-ref,[data-stage="bloom"].is-ar .tpv-k,[data-stage="bloom"].is-ar .tpv-d,[data-stage="bloom"].is-ar .tpv-hint,[data-stage="bloom"].is-ar .tpd-sub,[data-stage="bloom"].is-ar .tpd-mo,[data-stage="bloom"].is-ar .tpd-yr,[data-stage="bloom"].is-ar .tpd-when,[data-stage="bloom"].is-ar .tpd-add,[data-stage="bloom"].is-ar .tpc-k,[data-stage="bloom"].is-ar .tpc-l,[data-stage="bloom"].is-ar .tpp-k,[data-stage="bloom"].is-ar .tpp-time,[data-stage="bloom"].is-ar .tpz-k,[data-stage="bloom"].is-ar .tpz-d,[data-stage="bloom"].is-ar .lb-eyebrow,[data-stage="bloom"].is-ar .lb-venue,[data-stage="bloom"].is-ar .lb-field > span,[data-stage="bloom"].is-ar .lb-btn{font-family:'El Messiri','Amiri',serif;letter-spacing:0;padding-left:0;text-transform:none}
[data-stage="bloom"].is-ar .tpi-k{font-size:.38em} [data-stage="bloom"].is-ar .tpv-k,[data-stage="bloom"].is-ar .tpc-k,[data-stage="bloom"].is-ar .tpp-k,[data-stage="bloom"].is-ar .tpz-k,[data-stage="bloom"].is-ar .lb-eyebrow,[data-stage="bloom"].is-ar .tpa-ref{font-size:15px}
[data-stage="bloom"].is-ar .tpv-p,[data-stage="bloom"].is-ar .tpv-t,[data-stage="bloom"].is-ar .tpc-note,[data-stage="bloom"].is-ar .tpp-de,[data-stage="bloom"].is-ar .tpz-p,[data-stage="bloom"].is-ar .lb-address,[data-stage="bloom"].is-ar .lb-body,[data-stage="bloom"].is-ar .tpa-ayah{font-family:'Amiri',serif;font-style:normal}
[data-stage="bloom"].is-ar .tpa-ayah{font-size:24px;line-height:1.9}
[data-stage="bloom"].is-ar .tpv-txt,[data-stage="bloom"].is-ar .tpa-in,[data-stage="bloom"].is-ar .tpz-ov,[data-stage="bloom"].is-ar .tpp-t,[data-stage="bloom"].is-ar .lb-inner,[data-stage="bloom"].is-ar .tpd,[data-stage="bloom"].is-ar .tpc-note{direction:rtl}
@media (prefers-reduced-motion: reduce){[data-stage="bloom"] *{animation:none!important;transition-duration:.01s!important;transition-delay:0s!important}}
`;
