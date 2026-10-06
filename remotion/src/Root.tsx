import React from "react";
import { Composition } from "remotion";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { ReelAd } from "./ads/ReelAd";
import { BumperAd } from "./ads/BumperAd";
import { HeroSpot } from "./ads/HeroSpot";
import { WhatsappStory, WHATSAPP_STORY_FRAMES } from "./ads/WhatsappStory";
import { STORIES } from "./ads/stories";
import { PurchaseFlow, PURCHASE_FLOW_FRAMES } from "./ads/PurchaseFlow";
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

      {/* ── Vertical chat stories, one per Arabic design — 37s ── */}
      {Object.entries(STORIES).map(([slug, copy]) => (
        <Composition
          key={slug}
          id={`Story-${slug}`}
          component={WhatsappStory}
          durationInFrames={WHATSAPP_STORY_FRAMES}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{ copy }}
        />
      ))}

      {/* ── Real purchase walkthrough on a phone, then the friend opens it ── */}
      <Composition
        id="PurchaseFlow-AR"
        component={PurchaseFlow}
        durationInFrames={PURCHASE_FLOW_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
