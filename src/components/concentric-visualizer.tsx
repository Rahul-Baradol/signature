import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ConcentricVisualizer({ amps }: { amps: number[] }) {
  const groupRef = useRef<THREE.Group>(null);

  // We'll create 32 concentric rings, each using a portion of the 256 amps
  const RING_COUNT = 32;
  const SEGMENTS = 64; // Smoothness of the circle

  useFrame(() => {
    if (!groupRef.current || !amps.length) return;

    groupRef.current.children.forEach((child, ringIndex) => {
      const mesh = child as THREE.Mesh;
      // const geo = mesh.geometry as THREE.TorusGeometry;
      
      // Get the amplitude for this specific ring (mapping 256 to 32)
      const ampIdx = Math.floor((ringIndex / RING_COUNT) * 256);
      const intensity = amps[ampIdx] / 255;

      // Pulse the scale and "waviness"
      const scale = 1 + intensity * 0.5;
      mesh.scale.set(scale, scale, 1 + intensity * 2);
      
      // Rotate rings slightly differently for a dynamic look
      mesh.rotation.z += 0.005 * (ringIndex % 2 === 0 ? 1 : -1);
      
      // Update color intensity based on audio
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity * 3;
    });
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2.5, 0, 0]}>
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <mesh key={i} position={[0, 0, 0]}>
          {/* Each ring gets slightly larger */}
          <torusGeometry args={[i * 0.15 + 0.5, 0.02, 16, SEGMENTS]} />
          <meshStandardMaterial
            color={new THREE.Color().setHSL(i / RING_COUNT, 0.8, 0.5)}
            emissive={new THREE.Color().setHSL(i / RING_COUNT, 0.8, 0.5)}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}