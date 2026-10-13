/* The animated day-and-night backdrop: a sun or moon arcing across the sky,
 * with drifting clouds (dawn/day) or a twinkling starfield (dusk/night) and an
 * accent glow tracking the celestial body. Every colour is a `--m-*` token, so
 * the same markup restyles itself purely from the `data-mode` on its ancestor. */

import { bodyPos, CLOUDS, type Mode, MODES, starfield } from "./theme";

const BODY_PX = 300;

// The moon's own palette is a single fixed visual (not a per-mode token).
const CRATERS: [number, number, number][] = [
  [28, 26, 26],
  [58, 50, 18],
  [40, 64, 13],
  [65, 30, 10],
  [21, 53, 9],
  [50, 19, 8],
  [72, 62, 7],
  [33, 44, 6],
  [15, 33, 5],
];

function Moon() {
  const sc = BODY_PX / 150;
  return (
    <div
      style={{
        width: BODY_PX,
        height: BODY_PX,
        borderRadius: "50%",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 36% 32%, #f6f7fc 0%, #dde0ec 52%, #b7bbcd 100%)",
        boxShadow: `0 0 ${90 * sc}px ${10 * sc}px rgba(214,221,255,.32), inset ${-17 * sc}px ${-13 * sc}px ${28 * sc}px rgba(36,40,66,.42)`,
      }}
    >
      {CRATERS.map(([l, t, s], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${l}%`,
            top: `${t}%`,
            width: s * sc,
            height: s * sc,
            borderRadius: "50%",
            background: "rgba(150,156,182,.55)",
            boxShadow:
              "inset 1.5px 2px 2.5px rgba(54,58,86,.5), inset -1px -1px 1.5px rgba(255,255,255,.4)",
          }}
        />
      ))}
    </div>
  );
}

function Sun() {
  const sc = BODY_PX / 150;
  return (
    <div
      style={{
        width: BODY_PX,
        height: BODY_PX,
        borderRadius: "50%",
        position: "relative",
        background:
          "radial-gradient(circle at 40% 38%, var(--m-sun-core) 0%, var(--m-sun-mid) 46%, var(--m-sun-e1) 78%, var(--m-sun-e2) 100%)",
        boxShadow: `0 0 ${120 * sc}px ${34 * sc}px var(--m-sun-glow), 0 0 ${44 * sc}px ${10 * sc}px var(--m-sun-glow2)`,
      }}
    />
  );
}

const PUFFS: [number, number, number][] = [
  [14, 6, 44],
  [48, -10, 60],
  [86, 2, 46],
  [112, 14, 34],
];

function Clouds() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {CLOUDS.map((c) => (
        <div
          key={`${c.left}-${c.top}`}
          data-hu-animate
          style={{
            position: "absolute",
            left: `${c.left}%`,
            top: c.top,
            width: 150 * c.scale,
            height: 60 * c.scale,
            transform: `scale(${c.scale})`,
            transformOrigin: "left top",
            opacity: 0.92,
            filter: "blur(2px)",
            animation: `hu-cloud-drift ${c.dur}s ease-in-out ${c.delay}s infinite alternate`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 8,
              bottom: 0,
              width: 140,
              height: 34,
              borderRadius: 24,
              background: "var(--m-cloud)",
            }}
          />
          {PUFFS.map(([l, tp, d], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: l,
                top: tp,
                width: d,
                height: d,
                borderRadius: "50%",
                background: "var(--m-cloud)",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Stars({ seed, bright }: { seed: number; bright: number }) {
  const count = bright > 0.8 ? 64 : 28;
  const stars = starfield(count, seed, bright);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((st, i) => (
        <div
          key={i}
          data-hu-animate={st.twinkle ? "" : undefined}
          style={{
            position: "absolute",
            left: `${st.left}%`,
            top: `${st.top}%`,
            width: st.size,
            height: st.size,
            borderRadius: "50%",
            background: "#eef2ff",
            opacity: st.opacity,
            boxShadow: st.glow
              ? `0 0 ${st.size * 2.6}px ${st.size * 0.5}px rgba(223,230,255,.9)`
              : "none",
            animation: st.twinkle
              ? `hu-star-twinkle ${st.twinkle}s ease-in-out infinite`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function Sky({
  mode,
  minutes,
}: {
  mode: Mode;
  minutes: number;
}) {
  const cfg = MODES[mode];
  const pos = bodyPos(minutes);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* atmosphere */}
      {cfg.atmo === "clouds" ? (
        <Clouds />
      ) : (
        <Stars seed={cfg.seed} bright={cfg.atmo === "starsDim" ? 0.55 : 1} />
      )}

      {/* sun / moon, bobbing gently along its arc */}
      <div
        style={{
          position: "absolute",
          left: `${pos.x}%`,
          top: pos.top,
          width: BODY_PX,
          height: BODY_PX,
          transform: "translateX(-50%)",
          zIndex: 1,
        }}
      >
        <div
          data-hu-animate
          style={{
            width: BODY_PX,
            height: BODY_PX,
            animation: "hu-float-bob 8s ease-in-out infinite",
          }}
        >
          {pos.type === "moon" ? <Moon /> : <Sun />}
        </div>
      </div>

      {/* accent glow tracking the body */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(46% 60% at ${pos.x}% 16%, rgba(var(--m-accent-rgb), .20), transparent 62%)`,
        }}
      />
    </div>
  );
}
