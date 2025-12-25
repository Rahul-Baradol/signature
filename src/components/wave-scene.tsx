import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function WaveScene({ amps }: { amps: number[] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // We create a plane with 255 segments (256 vertices) along the width
  const SEGMENTS = 255;
  
  useFrame(() => {
    if (!meshRef.current || !amps || amps.length === 0) return;

    const geometry = meshRef.current.geometry as THREE.PlaneGeometry;
    const positions = geometry.attributes.position;

    // Loop through the 256 vertices
    for (let i = 0; i <= SEGMENTS; i++) {
      // Normalize amplitude (0 to 1)
      const amplitude = (amps[i] || 0) / 255;
      
      // We modify the Z-axis (height) of the vertices 
      // The vertices are laid out in rows. Since our height segments are 1, 
      // index i is the top row, and i + 256 is the bottom row.
      const height = amplitude * 3; // Scale height for visual impact
      
      positions.setZ(i, height);
      positions.setZ(i + (SEGMENTS + 1), height); 
    }

    positions.needsUpdate = true;
  });

  return (
    <group rotation={[-Math.PI / 3, 0, 0]} position={[0, -1, 0]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[10, 2, SEGMENTS, 1]} />
        <meshStandardMaterial 
          wireframe 
          color="#6366f1" 
          emissive="#4338ca"
          emissiveIntensity={2}
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Visual Floor/Grid for perspective */}
      <gridHelper args={[20, 20, 0x444444, 0x222222]} position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}