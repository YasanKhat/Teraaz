"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { Group, Mesh } from "three";

/* رنگ‌ها از همان پالتِ ماسکوتِ اس‌وی‌جیِ برنامه («قلمی» در خط‌زمان) گرفته
   شده‌اند تا شخصیتِ سه‌بعدی با نسخه‌یِ تخت یکی به‌نظر برسد. */
const CREAM = "#f1c98d";
const BAND = "#008687";
const NIB = "#3a3150";
const INK = "#2b2440";

/** «قلمی» در سه‌بعد — یک قلمِ نی با صورت، ساخته از شکل‌هایِ سادهٔ سه‌بعدی.
 *
 *  چرا شکل‌هایِ ساده و نه یک فایلِ مدل؟ چون از سایت فقط بوم و اندازه‌یِ
 *  ماسکوت به‌دست می‌آید و خودِ مدل در بسته‌هایی است که ضبط نشده؛ با این
 *  کار دست‌کم *رفتار* (راه‌رفتن، تاب‌خوردن، پلک‌زدن، جهشِ رسیدن به لنگر)
 *  همان است و شخصیت هم با ماسکوتِ اس‌وی‌جیِ برنامه هم‌خوان است. */
function Pen({ walking, cue }: { walking: boolean; cue: number }) {
  const root = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const armL = useRef<Mesh>(null);
  const hopAt = useRef(0);

  /* هر بار که `cue` زیاد می‌شود (رسیدن به یک لنگر) یک جهشِ کوتاه ثبت
     می‌شود؛ زمان از ساعتِ داخلیِ fiber خوانده می‌شود. */
  useEffect(() => {
    if (cue > 0) hopAt.current = performance.now() / 1000;
  }, [cue]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const speed = walking ? 7 : 1.8;

    if (root.current) {
      const hopAge = performance.now() / 1000 - hopAt.current;
      const hop = hopAt.current ? Math.max(0, 1 - hopAge * 2.4) : 0;
      root.current.position.y = -0.1 + Math.sin(t * speed) * (walking ? 0.09 : 0.04) + hop * 0.3;
      root.current.rotation.y = Math.sin(t * 0.55) * 0.32;
      root.current.rotation.z = Math.sin(t * speed) * (walking ? 0.05 : 0.02);
    }

    if (eyes.current) {
      /* پلک: بیشترِ زمان باز است و هر ۴.۶ ثانیه یک چفت‌شدنِ کوتاه دارد. */
      const open = (t % 4.6) / 4.6 > 0.96 ? 0.12 : 1;
      eyes.current.scale.y += (open - eyes.current.scale.y) * 0.35;
    }

    if (armL.current) {
      armL.current.rotation.z = -0.5 + Math.sin(t * speed) * (walking ? 0.5 : 0.18);
    }
  });

  return (
    <group ref={root} position={[0, -0.1, 0]}>
      {/* بدنه —— نیِ قلم */}
      <mesh castShadow>
        <capsuleGeometry args={[0.46, 1.15, 6, 24]} />
        <meshStandardMaterial color={CREAM} roughness={0.55} metalness={0.05} />
      </mesh>

      {/* نوارِ رنگیِ میانِ نی */}
      <mesh position={[0, -0.34, 0]}>
        <cylinderGeometry args={[0.475, 0.475, 0.22, 24]} />
        <meshStandardMaterial color={BAND} roughness={0.4} />
      </mesh>

      {/* سرتراش (نوکِ قلم) */}
      <mesh position={[0, -1.02, 0]}>
        <coneGeometry args={[0.4, 0.52, 24]} />
        <meshStandardMaterial color={NIB} roughness={0.5} />
      </mesh>
      <mesh position={[0, -1.3, 0]}>
        <coneGeometry args={[0.12, 0.22, 16]} />
        <meshStandardMaterial color={INK} roughness={0.6} />
      </mesh>

      {/* کلاهکِ بالا */}
      <mesh position={[0, 0.86, 0]}>
        <sphereGeometry args={[0.46, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={CREAM} roughness={0.55} />
      </mesh>

      {/* چشم‌ها */}
      <group ref={eyes} position={[0, 0.34, 0.4]}>
        <mesh position={[-0.17, 0, 0.06]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color={INK} roughness={0.3} />
        </mesh>
        <mesh position={[0.17, 0, 0.06]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshStandardMaterial color={INK} roughness={0.3} />
        </mesh>
        <mesh position={[-0.145, 0.03, 0.13]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0.195, 0.03, 0.13]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* لبخند */}
      <mesh position={[0, 0.1, 0.42]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.1, 0.018, 8, 20, Math.PI]} />
        <meshStandardMaterial color={INK} roughness={0.4} />
      </mesh>

      {/* دست‌ها */}
      <mesh ref={armL} position={[-0.5, 0.05, 0.1]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.06, 0.5, 4, 12]} />
        <meshStandardMaterial color={CREAM} roughness={0.55} />
      </mesh>
      <mesh position={[0.5, 0.05, 0.1]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.06, 0.5, 4, 12]} />
        <meshStandardMaterial color={CREAM} roughness={0.55} />
      </mesh>
      <mesh position={[-0.62, -0.24, 0.1]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#f6dcae" roughness={0.5} />
      </mesh>
      <mesh position={[0.62, -0.24, 0.1]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#f6dcae" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** بومِ سه‌بعدیِ ماسکوت. `walking` گام‌ها را تند و تاب را بیشتر می‌کند و
 *  `cue` با زیادشدنش یک جهشِ کوتاه می‌سازد. */
export default function MascotCharacter({ walking = false, cue = 0 }: { walking?: boolean; cue?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.4], fov: 34 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[2.5, 3.5, 3]} intensity={1.15} />
      <directionalLight position={[-2.5, 1, -2]} intensity={0.35} color="#9fd8d9" />
      <Pen walking={walking} cue={cue} />
    </Canvas>
  );
}
