"use client";

import { useState, useEffect, useCallback } from "react";

interface CardData {
  id: number;
  emoji: string;
  tag: string;
  line1: string;
  line2: string;
  highlight: string;
  bg: string[];
  accent: string;
  accentGlow: string;
  shape: string;
}

const cards: CardData[] = [
  {
    id: 1,
    emoji: "\uD83C\uDFAF",
    tag: "WELCOME",
    line1: "투자가 필요한 시점이라고",
    line2: "맘먹은 거야?",
    highlight: "그래, 그럼 잘 찾아왔어.",
    bg: ["#0a0015", "#1a0033", "#2d004d"],
    accent: "#c084fc",
    accentGlow: "#a855f7",
    shape: "circle",
  },
  {
    id: 2,
    emoji: "\uD83C\uDFB0",
    tag: "WARNING",
    line1: "요즘 장이 잘 간다고",
    line2: "있는 돈 다 때려부을 려고?",
    highlight: "한탕주의는 금물이야.",
    bg: ["#1a0005", "#2d000d", "#45001a"],
    accent: "#fb7185",
    accentGlow: "#f43f5e",
    shape: "diamond",
  },
  {
    id: 3,
    emoji: "\uD83D\uDC22",
    tag: "SLOW & STEADY",
    line1: "토끼가 낮잠 잘 때",
    line2: "거북이는 걸었어.",
    highlight: "장기투자는 걷기야, 달리기가 아니라.",
    bg: ["#001a0a", "#00331a", "#004d2d"],
    accent: "#34d399",
    accentGlow: "#10b981",
    shape: "triangle",
  },
  {
    id: 4,
    emoji: "\uD83E\uDDFA",
    tag: "DIVERSIFY",
    line1: "엄마가 뭐라고 했어?",
    line2: "계란 한 바구니에 담지 말래잖아.",
    highlight: "분산투자, 엄마 말이 맞아.",
    bg: ["#0a0a1a", "#0d1a33", "#102a4d"],
    accent: "#60a5fa",
    accentGlow: "#3b82f6",
    shape: "square",
  },
  {
    id: 5,
    emoji: "\uD83D\uDE80",
    tag: "LET'S GO",
    line1: "여기까지 읽었으면",
    line2: "마음의 준비는 된 거야.",
    highlight: "천천히, 꾸준히. 같이 가보자.",
    bg: ["#1a1200", "#332400", "#4d3600"],
    accent: "#fbbf24",
    accentGlow: "#f59e0b",
    shape: "star",
  },
];

function FloatingShape({
  shape,
  accent,
  visible,
}: {
  shape: string;
  accent: string;
  visible: boolean;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
    opacity: visible ? 0.12 : 0,
    transform: visible ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-30deg)",
    pointerEvents: "none",
  };

  if (shape === "circle")
    return (
      <div
        style={{
          ...base,
          width: 200,
          height: 200,
          borderRadius: "50%",
          border: `2px solid ${accent}`,
          top: -30,
          right: -40,
        }}
      />
    );
  if (shape === "diamond")
    return (
      <div
        style={{
          ...base,
          width: 140,
          height: 140,
          border: `2px solid ${accent}`,
          top: -20,
          right: -20,
          transform: visible
            ? "scale(1) rotate(45deg)"
            : "scale(0.5) rotate(15deg)",
        }}
      />
    );
  if (shape === "triangle")
    return (
      <div
        style={{
          ...base,
          width: 0,
          height: 0,
          borderLeft: "80px solid transparent",
          borderRight: "80px solid transparent",
          borderBottom: `140px solid ${accent}18`,
          top: -20,
          right: -30,
        }}
      />
    );
  if (shape === "square")
    return (
      <div
        style={{
          ...base,
          width: 160,
          height: 160,
          border: `2px solid ${accent}`,
          borderRadius: 20,
          top: -30,
          right: -30,
          transform: visible
            ? "scale(1) rotate(15deg)"
            : "scale(0.5) rotate(-15deg)",
        }}
      />
    );
  return (
    <div
      style={{
        ...base,
        fontSize: 160,
        top: -50,
        right: -40,
        lineHeight: 1,
        color: accent,
        filter: "blur(1px)",
      }}
    >
      ✦
    </div>
  );
}

export default function InvestmentCards() {
  const [current, setCurrent] = useState(0);
  const [anim, setAnim] = useState<"idle" | "exit" | "enter">("idle");
  const [displayIdx, setDisplayIdx] = useState(0);
  const [hlVisible, setHlVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  useEffect(() => {
    setHlVisible(false);
    const t = setTimeout(() => setHlVisible(true), 700);
    return () => clearTimeout(t);
  }, [displayIdx]);

  const navigate = useCallback(
    (dir: number) => {
      if (anim !== "idle") return;
      let next = current + dir;
      if (next >= cards.length) next = 0;
      if (next < 0) next = cards.length - 1;
      setDirection(dir);
      setAnim("exit");
      setTimeout(() => {
        setCurrent(next);
        setDisplayIdx(next);
        setAnim("enter");
        setTimeout(() => setAnim("idle"), 500);
      }, 350);
    },
    [current, anim]
  );

  // Auto-advance: 3초 간격
  useEffect(() => {
    if (anim !== "idle" || paused) return;
    const timer = setTimeout(() => {
      navigate(1);
    }, 3000);
    return () => clearTimeout(timer);
  }, [anim, navigate, paused]);

  const card = cards[displayIdx];

  const getCardTransform = () => {
    if (!mounted) return "translateY(60px) scale(0.9) rotate(-2deg)";
    if (anim === "exit")
      return `translateX(${direction * -130}%) rotate(${direction * -12}deg) scale(0.85)`;
    return "translateX(0) rotate(0deg) scale(1)";
  };

  const getCardOpacity = () => {
    if (!mounted) return 0;
    if (anim === "exit") return 0;
    return 1;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#050508",
        fontFamily: "'Noto Sans KR', sans-serif",
        padding: "24px 20px 20px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ambient glow */}
      <div
        style={{
          position: "absolute",
          width: "80vw",
          height: "80vw",
          maxWidth: 600,
          maxHeight: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${card.accentGlow}12, ${card.accentGlow}05 40%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "background 1s ease",
          pointerEvents: "none",
        }}
      />

      {/* pulse ring */}
      <div
        className="animate-[intro-pulse_3s_ease-in-out_infinite]"
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          border: `1px solid ${card.accent}08`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      {/* progress chips */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          position: "relative",
          zIndex: 10,
        }}
      >
        {cards.map((c, i) => (
          <div
            key={c.id}
            style={{
              height: 6,
              borderRadius: 3,
              width: i === current ? 40 : 6,
              background:
                i === current
                  ? `linear-gradient(90deg, ${c.accent}, ${c.accentGlow})`
                  : i < current
                    ? `${card.accent}50`
                    : "rgba(255,255,255,0.08)",
              transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
              boxShadow:
                i === current ? `0 0 12px ${c.accentGlow}40` : "none",
            }}
          />
        ))}
      </div>

      {/* CARD */}
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          minHeight: 420,
          borderRadius: 32,
          background: `linear-gradient(150deg, ${card.bg[0]}, ${card.bg[1]}, ${card.bg[2]})`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "36px 28px 32px",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px ${card.accentGlow}12, 0 30px 80px rgba(0,0,0,0.6)`,
          transform: getCardTransform(),
          opacity: getCardOpacity(),
          transition:
            "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease, background 0.8s ease",
          overflow: "hidden",
        }}
      >
        {/* grain overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 32,
            opacity: 0.035,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px",
            pointerEvents: "none",
          }}
        />

        <FloatingShape
          shape={card.shape}
          accent={card.accent}
          visible={anim === "idle" && mounted}
        />

        {/* top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${card.accent}60, transparent)`,
            borderRadius: 1,
          }}
        />

        {/* tag pill */}
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 100,
            background: `${card.accent}12`,
            border: `1px solid ${card.accent}25`,
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 20 }}>{card.emoji}</span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              letterSpacing: 2.5,
              color: card.accent,
            }}
          >
            {card.tag}
          </span>
        </div>

        {/* text */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.75,
              margin: 0,
              letterSpacing: -0.3,
            }}
          >
            {card.line1}
            <br />
            {card.line2}
          </p>

          <div style={{ marginTop: 28, position: "relative" }}>
            <p
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.5,
                margin: 0,
                letterSpacing: -0.8,
                opacity: hlVisible ? 1 : 0,
                transform: hlVisible ? "translateY(0)" : "translateY(20px)",
                transition:
                  "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {card.highlight}
            </p>
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${card.accent}, transparent)`,
                marginTop: 14,
                width: hlVisible ? "60%" : "0%",
                transition:
                  "width 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.3s",
                boxShadow: `0 0 16px ${card.accentGlow}30`,
              }}
            />
          </div>
        </div>

        {/* big ghost number */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 28,
            fontFamily: "'Space Mono', monospace",
            fontSize: 64,
            fontWeight: 700,
            color: `${card.accent}08`,
            lineHeight: 1,
            pointerEvents: "none",
          }}
        >
          {String(displayIdx + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 24,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          disabled={anim !== "idle"}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            border: `1.5px solid ${card.accent}30`,
            background: `${card.accent}08`,
            color: card.accent,
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            fontWeight: 300,
          }}
        >
          ←
        </button>

        <button
          onClick={() => setPaused((p) => !p)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            border: `1.5px solid ${paused ? `${card.accent}60` : `${card.accent}30`}`,
            background: paused ? `${card.accent}18` : `${card.accent}08`,
            color: card.accent,
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            fontWeight: 300,
          }}
        >
          {paused ? "▶" : "❚❚"}
        </button>

        <button
          onClick={() => navigate(1)}
          disabled={anim !== "idle"}
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            border: "none",
            background: `linear-gradient(135deg, ${card.accent}, ${card.accentGlow})`,
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            boxShadow: `0 4px 24px ${card.accentGlow}35`,
            fontWeight: 300,
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
