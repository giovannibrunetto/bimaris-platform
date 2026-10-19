export default function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <style>{`
        body:has(.cinema) > .site-header,
        body:has(.cinema) > .footer {
          display: none !important;
        }

        body:has(.cinema) {
          margin: 0;
          background: #090a0c;
          overflow: hidden;
        }

        body:has(.cinema) > main {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: none !important;
          min-height: 100dvh;
        }

        body:has(.cinema) .cinema {
          width: 100vw;
          height: 100dvh;
          min-height: 100dvh;
        }

        body:has(.cinema) .scene {
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;
        }

        @media (max-width: 700px) {
          body:has(.cinema) .hero {
            justify-content: center;
            padding: 28px 22px;
          }

          body:has(.cinema) .hero .kicker {
            margin-top: auto;
          }

          body:has(.cinema) .hero .controls {
            margin-bottom: auto;
          }

          body:has(.cinema) .hero h1 {
            max-width: 92%;
          }

          body:has(.cinema) .hero .intro {
            max-width: 94%;
          }

          body:has(.cinema) .hero .controls,
          body:has(.cinema) .hero .next {
            width: 100%;
          }

          body:has(.cinema) .hero .next {
            min-height: 52px;
          }
        }
      `}</style>
      {children}
    </>
  );
}
