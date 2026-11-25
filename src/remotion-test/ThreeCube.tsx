import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";

const RotatingCube: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const rotY = interpolate(frame, [0, durationInFrames], [0, Math.PI * 2]);
  const rotX = interpolate(frame, [0, durationInFrames], [0, Math.PI]);
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <mesh rotation={[rotX, rotY, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#ff6b35" />
      </mesh>
    </>
  );
};

export const ThreeCube: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
    <ThreeCanvas width={1920} height={1080} camera={{ position: [0, 0, 6], fov: 50 }}>
      <RotatingCube />
    </ThreeCanvas>
  </AbsoluteFill>
);
