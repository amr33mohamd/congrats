import React from "react";
import { Composition } from "remotion";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { ReelAd } from "./ads/ReelAd";
import { BumperAd } from "./ads/BumperAd";
import { HeroSpot } from "./ads/HeroSpot";
import { AR, EN } from "./copy";

// Make the brand fonts available to the renderer (matches app/globals.css intent).
loadFredoka();
loadPoppins();
loadCairo();

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Vertical Reels / Stories / TikTok — 15s ── */}
      <Composition
        id="ReelAd-EN"
        component={ReelAd}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ copy: EN }}
      />
      <Composition
        id="ReelAd-AR"
        component={ReelAd}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ copy: AR }}
      />

      {/* ── 6s bumper ── */}
      <Composition
        id="Bumper-EN"
        component={BumperAd}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ copy: EN }}
      />
      <Composition
        id="Bumper-AR"
        component={BumperAd}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ copy: AR }}
      />

      {/* ── 30s landscape hero spot (YouTube / web) ── */}
      <Composition
        id="HeroSpot-EN"
        component={HeroSpot}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ copy: EN }}
      />
      <Composition
        id="HeroSpot-AR"
        component={HeroSpot}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ copy: AR }}
      />
    </>
  );
};
