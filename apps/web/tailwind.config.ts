import type { Config } from "tailwindcss";

/**
 * Theme: Fintech Trust (theme-factory)
 * Source of truth: .claude/skills/theme-factory/themes/fintech-trust.md
 *
 * Tokens are dual-exposed:
 *   - Direct hex values (build-time)
 *   - CSS custom properties via `var(--token)` (runtime themable)
 * If you only need one, drop the other column.
 */
const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Surfaces
        ink: "var(--color-ink, #0B1220)",
        slate: {
          900: "var(--color-slate-900, #0F172A)",
          800: "var(--color-slate-800, #1E293B)",
          700: "var(--color-slate-700, #334155)",
        },

        // Text
        cloud: "var(--color-cloud, #F8FAFC)",
        mist: "var(--color-mist, #CBD5E1)",
        ash: "var(--color-ash, #94A3B8)",
        steel: "var(--color-steel, #475569)",

        // Accent
        trust: {
          DEFAULT: "var(--color-trust, #3B82F6)",
          hover: "var(--color-trust-hover, #2563EB)",
          soft: "var(--color-trust-soft, #1D4ED8)",
        },

        // Semantic
        gain: "var(--color-gain, #10B981)",
        loss: "var(--color-loss, #EF4444)",
        caution: "var(--color-caution, #F59E0B)",
        info: "var(--color-info, #38BDF8)",

        // shadcn-style aliases (optional — wire if you use shadcn/ui)
        background: "var(--color-ink, #0B1220)",
        foreground: "var(--color-cloud, #F8FAFC)",
        card: "var(--color-slate-900, #0F172A)",
        "card-foreground": "var(--color-cloud, #F8FAFC)",
        border: "var(--color-slate-700, #334155)",
        ring: "var(--color-trust, #3B82F6)",
        muted: "var(--color-slate-800, #1E293B)",
        "muted-foreground": "var(--color-ash, #94A3B8)",
        primary: "var(--color-trust, #3B82F6)",
        "primary-foreground": "var(--color-cloud, #F8FAFC)",
        destructive: "var(--color-loss, #EF4444)",
        "destructive-foreground": "var(--color-cloud, #F8FAFC)",
      },

      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },

      fontFeatureSettings: {
        tabular: '"tnum", "lnum"',
      },

      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        pill: "999px",
      },

      ringWidth: {
        DEFAULT: "2px",
      },
      ringOffsetWidth: {
        DEFAULT: "2px",
      },
      ringOffsetColor: {
        DEFAULT: "var(--color-ink, #0B1220)",
      },
    },
  },
  plugins: [],
};

export default config;
