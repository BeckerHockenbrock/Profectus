import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { HomeScreenHint } from "@/components/shared/home-screen-hint";
import { StoicQuote } from "@/features/quests/components/stoic-quote";

type AuthShellProps = {
  isLoading?: boolean;
  authError?: string;
  showHomeScreenHint?: boolean;
  onSignIn?: () => void;
  onDismissHomeScreenHint?: () => void;
};

export function AuthShell({
  isLoading = false,
  authError = "",
  showHomeScreenHint = false,
  onSignIn,
  onDismissHomeScreenHint,
}: AuthShellProps) {
  if (isLoading) {
    return <main className="authShell"><p className="workspaceEyebrow" role="status">Opening your workspace…</p></main>;
  }

  return (
    <main className="authShell">
      <Link className="brand authBrand" href="/" aria-label="Profectus home"><BrandMark /><span className="brandLockup"><span className="brandName">Profectus</span><span className="brandCaption">THE EVERYDAY ASCENT</span></span></Link>
      <section className="authCard" aria-labelledby="sign-in-heading">
        <div className="authArtwork" aria-hidden="true"><Image src="/sisyphus.png" alt="" width={384} height={456} sizes="(max-width: 40rem) 60vw, 384px" preload unoptimized /></div>
        <div className="authCardCopy">
        <p className="workspaceEyebrow"><span aria-hidden="true" />A SPACE FOR WHAT MATTERS</p>
        <h1 id="sign-in-heading">Small steps.<br /><em>Higher ground.</em></h1>
        <p className="authDescription">Bring intention to your everyday. A quiet place for your quests, your schedule, and your next moment of focus.</p>
        {authError ? <p className="formError" role="alert">{authError}</p> : null}
        <button className="signInButton" type="button" onClick={onSignIn}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.61 0-4.82-1.76-5.61-4.13H3.05v2.59A10 10 0 0 0 12 22ZM6.39 13.92A6 6 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.49H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.51l3.34-2.59ZM12 5.95c1.47 0 2.79.5 3.82 1.49l2.87-2.88A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.34 2.59C7.18 7.71 9.39 5.95 12 5.95Z" /></svg>
          Continue with Google <span aria-hidden="true">↗</span>
        </button>
        <p className="authSyncNote">Your workspace, in sync across your devices.</p>
        <StoicQuote />
        {showHomeScreenHint && onDismissHomeScreenHint ? (
          <HomeScreenHint onDismiss={onDismissHomeScreenHint} />
        ) : null}
        </div>
      </section>
      <p className="authFooter">FOCUS CLEARLY. <span>PROGRESS QUIETLY.</span></p>
    </main>
  );
}
