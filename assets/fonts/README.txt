Amiri-Bold-noGSUB.ttf — Amiri Bold (https://github.com/aliftype/amiri, SIL OFL 1.1,
see Amiri-OFL.txt) with its GSUB table removed.

Used only by the shared-card link-preview image (components/marketing/card-og.tsx).
next/og (Satori) cannot run Amiri's contextual substitution lookups and throws on
them; the text is shaped beforehand into Arabic presentation forms
(lib/arabic-shape.ts), which the font's cmap maps directly, so GSUB is not needed.

Made with fontTools:  f = TTFont('Amiri-Bold.ttf'); del f['GSUB']; f.save(...)
