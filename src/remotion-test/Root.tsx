import React from "react";
import { ThreeCube } from "./ThreeCube";
import { Composition, AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const TestScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, fps], [0.6, 1], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020", justifyContent: "center", alignItems: "center", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ transform: `scale(${scale})`, opacity, fontSize: 120, fontWeight: 700 }}>
        Remotion test
      </div>
      <div style={{ opacity, marginTop: 20, fontSize: 40 }}>frame {frame} / {durationInFrames}</div>
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="TestScene" component={TestScene} durationInFrames={90} fps={30} width={1920} height={1080} />
    <Composition id="ThreeCube" component={ThreeCube} durationInFrames={120} fps={30} width={1920} height={1080} />
  </>
);
