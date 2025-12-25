import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ConcentricRings({ amps }: { amps: number[] }) {
  const groupRef = useRef<THREE.Group>(null);

  // We create 256 rings to match your amps array 1:1
  const count = 64;
  
  // Pre-calculate radii so we don't do it on every frame
  const rings = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      radius: 2 + i * 0.05, // Starting radius plus spacing
      color: new THREE.Color().setHSL(i / count, 0.7, 0.5),
    }));
  }, [count]);

  useFrame(() => {
    if (!groupRef.current || !amps.length) return;

    // Map each amp value to a ring's Y position
    groupRef.current.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh;
      const amplitude = amps[i] || 0;
      
      // Normalize 0-255 to a height (e.g., 0 to 4 units high)
      const targetY = (amplitude / 255) * 4;
      
      // Smooth interpolation so it doesn't "flicker" too harshly
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.2);
      
      // Optional: Pulse the glow intensity with the music
      (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = (amplitude / 255) * 2;
    });
  });

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Very thin Torus acts as a 3D ring/ribbon */}
          <torusGeometry args={[ring.radius, 0.015, 8, 128]} />
          <meshStandardMaterial
            color={ring.color}
            emissive={ring.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}