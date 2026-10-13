"use client";

/* HangUp — the marketing landing page.
 *
 * A day-and-night surface: the sky tracks the visitor's local time across four
 * modes (dawn · day · dusk · night), with an animated sun/moon, clouds/stars
 * and an accent glow. Every colour comes from the `--m-*` mode tokens
 * (hangup-design-system.css) resolved off `data-mode`, so this component never
 * hardcodes a palette — it just lays out the page and lets the tokens dress it.
 *
 * Real product flows are preserved: the privacy-policy-gated Google sign-in,
 * the authenticated "Get started" CTA, and the missing-scopes prompt. */

import { useEffect, useState, type ReactNode } from "react";
import { YouTubeEmbed } from "@next/third-parties/google";
import GoogleLoginButton from "../GoogleLoginButton";
import UserMenu from "../UserMenu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { START_MEETING_PATH } from "@hangup/shared";
import { useUserInfo } from "../_auth/AuthProvider";
import { MODES, phaseFromMinutes } from "./theme";
import Sky from "./Sky";

const HORIZONTAL_PAD = "clamp(24px, 5vw, 60px)";

function Wordmark() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
      <span
        style={{
          font: "700 20px/1 var(--font-display-mode)",
          color: "var(--m-heading)",
          letterSpacing: "-.02em",
        }}
      >
        HangUp
      </span>
      <span
        style={{
          font: "700 20px/1 var(--font-display-mode)",
          color: "var(--m-accent)",
        }}
      >
        .
      </span>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      style={{
        font: "var(--type-ui)",
        color: "var(--m-nav)",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </a>
  );
}

/** Solid accent pill — used for "Get started" / "Start the call" / nav "Sign in". */
function AccentPill({
  href,
  children,
  large = false,
}: {
  href: string;
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "var(--m-accent)",
        color: "var(--m-ink)",
        font: large ? "600 16px/1 var(--font-body)" : "var(--type-label)",
        padding: large ? "15px 24px" : "11px 18px",
        borderRadius: "var(--radius-pill)",
        textDecoration: "none",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {children}
    </a>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div
        style={{
          font: "var(--type-step)",
          color: "var(--m-step)",
          marginBottom: 14,
        }}
      >
        {n}
      </div>
      <div
        style={{
          font: "600 17px/1.3 var(--font-body)",
          color: "var(--m-heading)",
          marginBottom: 7,
        }}
      >
        {title}
      </div>
      <div style={{ font: "var(--type-small)", color: "var(--m-body)" }}>
        {body}
      </div>
    </div>
  );
}

/** The floating product-preview card — the "Soft" treatment (32px radius). */
function ProductCard({
  badge,
  startHref,
}: {
  badge: string;
  startHref: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 366,
        background: "var(--m-card)",
        border: "1px solid var(--m-card-border)",
        borderRadius: "var(--radius-card-soft)",
        padding: 28,
        boxShadow: "var(--m-card-shadow)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <span
          style={{
            font: "500 14px/1 var(--font-body)",
            color: "var(--m-muted)",
          }}
        >
          Hang up at
        </span>
        <span
          style={{
            font: "600 12px/1 var(--font-body)",
            color: "var(--m-accent)",
            border: "1px solid rgba(var(--m-accent-rgb), .4)",
            padding: "6px 10px",
            borderRadius: "var(--radius-pill)",
          }}
        >
          {badge}
        </span>
      </div>
      <div
        style={{
          font: "700 52px/1 var(--font-display-mode)",
          color: "var(--m-heading)",
          letterSpacing: "-.03em",
          marginBottom: 6,
        }}
      >
        11:15 <span style={{ fontSize: 21, color: "var(--m-muted)" }}>PM</span>
      </div>
      <div
        style={{
          font: "var(--type-small)",
          color: "var(--m-muted)",
          marginBottom: 22,
        }}
      >
        We close the call at this time, so you don&apos;t have to watch the
        clock.
      </div>
      <a
        href={startHref}
        style={{
          display: "block",
          textAlign: "center",
          font: "600 15px/1 var(--font-body)",
          color: "var(--m-ink)",
          background: "var(--m-accent)",
          padding: "15px 0",
          borderRadius: "var(--radius-pill)",
          textDecoration: "none",
        }}
      >
        Start the call
      </a>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details
      style={{
        borderBottom: "1px solid var(--m-card-border)",
        padding: "16px 0",
      }}
    >
      <summary
        style={{
          font: "600 16px/1.4 var(--font-body)",
          color: "var(--m-heading)",
          cursor: "pointer",
          listStyle: "none",
        }}
      >
        {q}
      </summary>
      <p
        style={{
          font: "var(--type-small)",
          color: "var(--m-body)",
          margin: "12px 0 0",
        }}
      >
        {a}
      </p>
    </details>
  );
}

export default function HangUpLanding({
  initialMinutes,
}: {
  initialMinutes: number;
}) {
  // The server resolved the visitor's local time (Cloudflare edge timezone, or
  // server time in dev), so the first paint is already in the right mode — no
  // flicker. We keep refreshing on the client so the sky tracks time as it
  // passes and corrects to the browser's real local time.
  const [minutes, setMinutes] = useState<number>(initialMinutes);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setMinutes(d.getHours() * 60 + d.getMinutes());
    };
    update();
    const id = setInterval(update, 60_000);
    return () => {
      clearInterval(id);
    };
  }, []);

  const { userInfo } = useUserInfo();
  const mode = phaseFromMinutes(minutes);
  const cfg = MODES[mode];

  const missingScopes = userInfo.authenticated ? userInfo.missingScopes : [];
  const ready = userInfo.authenticated && missingScopes.length === 0;
  const startHref = ready ? START_MEETING_PATH : "#get-started";

  return (
    <div
      className="hangup"
      data-mode={mode}
      style={{
        background: "var(--m-sky)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        color: "var(--m-body)",
        fontFamily: "var(--font-body)",
        transition: "background .6s ease",
      }}
    >
      {/* ---- header ---- */}
      <header
        style={{
          position: "relative",
          zIndex: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: `24px ${HORIZONTAL_PAD}`,
          borderBottom: "1px solid var(--m-header-border)",
          background: "var(--m-header-bg)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Wordmark />
        <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <NavLink href="#how-it-works">How it works</NavLink>
          <NavLink href="#questions">Questions</NavLink>
          {userInfo.authenticated ? (
            <UserMenu userinfo={userInfo} />
          ) : (
            <AccentPill href="#get-started">Sign in</AccentPill>
          )}
        </nav>
      </header>

      {/* ---- hero + steps, over the animated sky ---- */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <Sky mode={mode} minutes={minutes} />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {/* hero */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 56,
              alignItems: "center",
              padding: `clamp(56px, 9vw, 108px) ${HORIZONTAL_PAD} 76px`,
            }}
          >
            <div style={{ flex: "1 1 440px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  font: "var(--type-eyebrow)",
                  letterSpacing: "var(--track-eyebrow)",
                  textTransform: "uppercase",
                  color: "var(--m-accent)",
                  marginBottom: 26,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--m-accent)",
                  }}
                />
                {cfg.eyebrow}
              </div>
              <h1
                style={{
                  font: "700 clamp(40px, 6vw, 64px)/1.02 var(--font-display-mode)",
                  color: "var(--m-heading)",
                  letterSpacing: "-.03em",
                  margin: "0 0 22px",
                }}
              >
                It hangs up, so you don&apos;t have to.
              </h1>
              <p
                style={{
                  font: "var(--type-lead)",
                  color: "var(--m-body)",
                  margin: "0 0 36px",
                  maxWidth: 470,
                }}
              >
                Pick the time your Google Meet call should end. When you reach
                it, HangUp closes the call for you — so a good conversation
                doesn&apos;t quietly take your morning with it.
              </p>

              <div id="get-started" style={{ scrollMarginTop: 90 }}>
                {ready ? (
                  <AccentPill href={START_MEETING_PATH} large>
                    Get started
                    <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
                      →
                    </span>
                  </AccentPill>
                ) : (
                  <>
                    {userInfo.authenticated && missingScopes.length > 0 && (
                      <Alert style={{ marginBottom: 16 }}>
                        <AlertTitle>Missing permission</AlertTitle>
                        <AlertDescription>
                          This app is missing the permission to create new
                          Google Meet meetings. This permission is required for
                          the app to work. Please sign in with Google again and
                          grant it.
                        </AlertDescription>
                      </Alert>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <GoogleLoginButton
                        hasAcceptedPrivacyPolicyInSession={
                          userInfo.hasAcceptedPrivacyPolicy
                        }
                        theme={cfg.googleTheme}
                      />
                      <span
                        style={{
                          font: "var(--type-ui)",
                          color: "var(--m-muted)",
                        }}
                      >
                        Works with Google Meet
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                flex: "1 1 320px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <ProductCard badge={cfg.badge} startHref={startHref} />
            </div>
          </div>

          {/* how it works */}
          <div
            id="how-it-works"
            style={{
              display: "flex",
              flexWrap: "wrap",
              padding: `24px ${HORIZONTAL_PAD} 80px`,
              gap: 44,
              scrollMarginTop: 80,
            }}
          >
            <Step
              n="01"
              title="Sign in with Google"
              body="Connect the account you start Meet calls from."
            />
            <Step
              n="02"
              title="Pick a hang-up time"
              body="Choose it before the call, while it’s easy to decide."
            />
            <Step
              n="03"
              title="It hangs up on time"
              body="The call closes itself at the time you set. Free, non-profit, no ads."
            />
          </div>
        </div>
      </div>

      {/* ---- see how it works (video) ---- */}
      <section
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: `64px ${HORIZONTAL_PAD} 24px`,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            font: "700 clamp(26px, 4vw, 32px)/1.15 var(--font-display-mode)",
            color: "var(--m-heading)",
            letterSpacing: "-.02em",
            margin: "0 0 28px",
          }}
        >
          See how it works
        </h2>
        <div
          style={{
            borderRadius: "var(--radius-card-soft)",
            overflow: "hidden",
          }}
        >
          <YouTubeEmbed
            videoid="If6fpgfMNls"
            params="rel=0"
            style="margin: auto"
          />
        </div>
      </section>

      {/* ---- questions (FAQ) ---- */}
      <section
        id="questions"
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: `48px ${HORIZONTAL_PAD} 16px`,
          scrollMarginTop: 80,
        }}
      >
        <h2
          style={{
            font: "700 clamp(26px, 4vw, 32px)/1.15 var(--font-display-mode)",
            color: "var(--m-heading)",
            letterSpacing: "-.02em",
            margin: "0 0 24px",
            textAlign: "center",
          }}
        >
          Questions
        </h2>
        <Faq
          q="How does it work on a technical level?"
          a="HangUp integrates with the Google Meet API to create and end meetings. When you start a meeting, it asks the Google Meet API to create a new meeting. At your chosen end time, it sends another request to end the meeting — which only works while the meeting is active."
        />
        <Faq
          q="Why can it not end meetings I created myself?"
          a="HangUp can only end meetings it created itself, due to limitations in the Google Meet API. This ensures apps can’t interfere with meetings created by other means."
        />
      </section>

      <div
        style={{
          font: "400 13px/1 var(--font-body)",
          color: "var(--m-muted)",
          textAlign: "center",
          padding: "32px 0 56px",
        }}
      >
        Free, non-profit, no ads.
      </div>
    </div>
  );
}
