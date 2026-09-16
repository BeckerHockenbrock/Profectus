import Image from "next/image";
import { HomeScreenHint } from "@/components/shared/home-screen-hint";

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
    return <main className="authShell">Loading your quests…</main>;
  }

  return (
    <main className="authShell">
      <section className="authCard" aria-labelledby="sign-in-heading">
        <Image src="/sisyphus.png" alt="Sisyphus carrying a boulder" width={120} height={142} priority unoptimized />
        <p className="heroTitle">Todo Quest</p>
        <h1 id="sign-in-heading">Your quests, wherever you are.</h1>
        <p>Sign in with Google to keep this account&apos;s quests synced across your devices.</p>
        {authError ? <p className="formError" role="alert">{authError}</p> : null}
        <button className="signInButton" type="button" onClick={onSignIn}>
          Continue with Google
        </button>
        {showHomeScreenHint && onDismissHomeScreenHint ? (
          <HomeScreenHint onDismiss={onDismissHomeScreenHint} />
        ) : null}
      </section>
    </main>
  );
}
