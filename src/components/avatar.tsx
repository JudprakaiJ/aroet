const TONES: Record<string, { bg: string; fg: string; border: string }> = {
  JKH: { bg: "#FFE0E4", fg: "#A50D27", border: "#FFC1C9" },
  PSU: { bg: "#DBEAFE", fg: "#1E40AF", border: "#BFDBFE" },
  RKO: { bg: "#DCFCE7", fg: "#166534", border: "#BBF7D0" },
  TCH: { bg: "#FEF3C7", fg: "#92400E", border: "#FDE68A" },
  RMA: { bg: "#EDE9FE", fg: "#5B21B6", border: "#DDD6FE" },
  IRO: { bg: "#FCE7F3", fg: "#9D174D", border: "#FBCFE8" },
  KBU: { bg: "#CCFBF1", fg: "#0F766E", border: "#99F6E4" },
  JYE: { bg: "#FFEDD5", fg: "#9A3412", border: "#FED7AA" },
  SSU: { bg: "#E0E7FF", fg: "#3730A3", border: "#C7D2FE" },
  UKA: { bg: "#FAE8FF", fg: "#86198F", border: "#F5D0FE" },
  PPI: { bg: "#FEE2E2", fg: "#991B1B", border: "#FECACA" },
  SPE: { bg: "#E0F2FE", fg: "#075985", border: "#BAE6FD" },
  CCH: { bg: "#FEF9C3", fg: "#854D0E", border: "#FEF08A" },
  LRO: { bg: "#F1F5F9", fg: "#334155", border: "#E2E8F0" },
};

const FALLBACK = { bg: "#F1F5F9", fg: "#334155", border: "#E2E8F0" };

export function Avatar({ code, size = 28 }: { code: string; size?: number }) {
  const tone = TONES[code.toUpperCase()] ?? FALLBACK;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: tone.bg,
        color: tone.fg,
        borderColor: tone.border,
        fontSize: size * 0.4,
      }}
      className="inline-flex items-center justify-center font-mono font-semibold border shrink-0"
    >
      {code}
    </span>
  );
}
