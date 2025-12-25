import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";

import { EffectComposer, Bloom } from "@react-three/postprocessing";

import { ConcentricRings } from "../components/concentric-rings";
import { useAppStore } from "../store/use-app-store";

export default function ConcetricRingsDesign() {
  const { amps } = useAppStore();

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0a0a]">

      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[15, 12, 15]} fov={40} />
          <OrbitControls
            enablePan={false}
            maxDistance={30}
            minDistance={10}
            autoRotate
            autoRotateSpeed={0.5}
          />

          <color attach="background" args={["#050505"]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />

          <Suspense fallback={null}>
            <ConcentricRings amps={amps} />
            
            <gridHelper args={[50, 50, "#222", "#111"]} position={[0, -0.1, 0]} />
          </Suspense>

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              mipmapBlur
              intensity={1.2}
              radius={0.3}
            />
          </EffectComposer>
        </Canvas>
      </div>
    </div>
  );
}