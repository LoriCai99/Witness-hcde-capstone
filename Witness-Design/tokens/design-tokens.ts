export const colors = {
  brand: {
    primaryOrange: {
      glare: "#FFF5F1",
      touch: "#FFE8DF",
      peach: "#FFB299",
      theOrange: "#FF5C1B"
    },
    primaryYellow: {
      beach: "#FFFCE9",
      sun: "#FFEB80",
      theYellow: "#FFD000"
    },
    primaryBlue: {
      sky: "#E7F4FF",
      theBlue: "#155DFC"
    }
  },
  neutral: {
    grey: "#F4F4F4",
    lotion: "#E9E9E9",
    darkGrey: "#ADADAD",
    coolGrey: "#45556C",
    black: "#120B0B",
    white: "#FFFFFF"
  },
  semantic: {
    success: { 100: "#DCFCE7", 500: "#16A34A", 1000: "#15803D" },
    waiting: { 100: "#FDF2D4", 500: "#E9B44C", 1000: "#B17728" },
    pending: { 100: "#FFE0CA", 500: "#FF6900", 1000: "#D95B03" },
    error: { 100: "#FEE2E2", 500: "#DC2626", 1000: "#B91C1C" }
  }
} as const;

export const spacing = {
  gap1: "8px",
  gap2: "8px",
  gap3: "12px",
  gap4: "16px",
  gap5: "18px",
  gap6: "24px",
  gap7: "32px",
  gap8: "40px",
  gap9: "52px"
} as const;

export const radius = {
  sm: "6px",
  md: "8px",
  lg: "10px",
  xl: "12px",
  full: "9999px"
} as const;

export const typography = {
  headingH1Sb32: { fontFamily: "Inter", fontWeight: 600, fontSize: "32px", lineHeight: "32px" },
  headingH2Pdr28: { fontFamily: "Playfair Display", fontWeight: 400, fontSize: "28px", lineHeight: "140%" },
  headingH3R22: { fontFamily: "Inter", fontWeight: 400, fontSize: "22px", lineHeight: "32px" },
  headingH3Sb22: { fontFamily: "Inter", fontWeight: 600, fontSize: "22px", lineHeight: "32px" },
  headingH4Sb20: { fontFamily: "Inter", fontWeight: 600, fontSize: "20px", lineHeight: "28px" },
  subHeadingSb12: { fontFamily: "Inter", fontWeight: 600, fontSize: "12px", lineHeight: "16px" },
  bodyB1M14: { fontFamily: "Inter", fontWeight: 500, fontSize: "14px", lineHeight: "20px" },
  bodyB2R14: { fontFamily: "Inter", fontWeight: 400, fontSize: "14px", lineHeight: "20px" },
  bodyB3M12: { fontFamily: "Inter", fontWeight: 500, fontSize: "12px", lineHeight: "16px" },
  bodyB4B12: { fontFamily: "Inter", fontWeight: 700, fontSize: "12px", lineHeight: "16px" }
} as const;
