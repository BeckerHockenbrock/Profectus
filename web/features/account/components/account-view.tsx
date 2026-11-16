"use client";

import { useRef, useState } from "react";
import { WorkspaceHero } from "@/components/shared/workspace-hero";
import { useAccountPreferences } from "../hooks/use-account-preferences";
import { THEME_OPTIONS } from "../types/account";

type AccountViewProps = {
  userId: string;
  displayName: string;
  email: string | null;
  userInitial: string;
  refreshToken: string | null;
  openQuestCount: number;
  completedQuestCount: number;
  onSignOut: () => void;
};

export function AccountView({
  userId,
  displayName,
  email,
  userInitial,
  refreshToken,
  openQuestCount,
  completedQuestCount,
  onSignOut,
}: AccountViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const { prefs, error, setTheme, setAvatarFromFile, clearAvatar } =
    useAccountPreferences(userId);

  const copyRefreshToken = async () => {
    if (!refreshToken) {
      setCopyStatus("Sign in again to refresh assistant access.");
      return;
    }
    try {
      await navigator.clipboard.writeText(refreshToken);
      setCopyStatus("Refresh token copied. Use it only on your own machine.");
    } catch {
      setCopyStatus("Could not copy. Check clipboard permissions and try again.");
    }
  };

  return (
    <section className="accountView" aria-labelledby="workspace-03">
      <WorkspaceHero index="03" title="Account">
        <p className="accountLead">Your profile and preferences.</p>
      </WorkspaceHero>

      <div className="accountPanel">
        <div className="accountProfile">
          <button
            type="button"
            className="accountAvatarButton"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile picture"
          >
            {prefs.avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prefs.avatarDataUrl} alt="" className="accountAvatarImage" />
            ) : (
              <span className="accountAvatarInitial">{userInitial}</span>
            )}
            <span className="accountAvatarEdit" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 5 4 4M5 19l4-1L20 7a2.8 2.8 0 0 0-4-4L5 14l-1 6Z" /></svg>
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void setAvatarFromFile(file);
              event.target.value = "";
            }}
          />
          <div className="accountIdentity">
            <h2 className="accountName">{displayName}</h2>
            {email ? <p className="accountEmail">{email}</p> : null}
            <div className="accountAvatarActions">
              <button type="button" className="accountTextButton" onClick={() => fileInputRef.current?.click()}>
                Change photo
              </button>
              {prefs.avatarDataUrl ? (
                <button type="button" className="accountTextButton" onClick={clearAvatar}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <p className="formError" role="alert">
            {error}
          </p>
        ) : null}

        <dl className="accountStatsRow" aria-label="Quest totals">
          <div>
            <dt>Open quests</dt>
            <dd>{openQuestCount}</dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd>{completedQuestCount}</dd>
          </div>
        </dl>

        <div className="accountThemeBlock">
          <div className="accountSectionHeading">
            <h3 className="accountSectionLabel">Appearance</h3>
          </div>
          <div className="accountThemeGrid" role="group" aria-label="Theme">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`accountThemeOption ${prefs.theme === option.id ? "isActive" : ""}`}
                onClick={() => setTheme(option.id)}
                aria-pressed={prefs.theme === option.id}
              >
                <span className="accountThemeSwatch" style={{ background: option.swatch }} aria-hidden="true" />
                <span>{option.label}</span>
                <svg className="accountThemeCheck" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            ))}
          </div>
        </div>

        <details className="accountAssistantBlock">
          <summary>
            <span className="accountAssistantIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /></svg>
            </span>
            <span className="accountAssistantLabel">Assistant access<span>Connect your personal assistant</span></span>
            <svg className="accountDisclosureChevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </summary>
          <div className="accountAssistantContent">
            <p className="accountAssistantCopy">
              Connect Grok to your brief and quests using your account.
            </p>
            <ol className="accountAssistantSteps">
              <li>Copy your refresh token below.</li>
              <li>On your own machine, run <code>node mcp/src/login.js &lt;token&gt;</code></li>
            </ol>
            <p className="accountAssistantMeta">Signed in as <code>{userId}</code></p>
            <div className="accountAssistantActions">
              <button type="button" className="accountCopyButton" disabled={!refreshToken} onClick={() => void copyRefreshToken()}>
                Copy refresh token
              </button>
            </div>
            {!refreshToken ? <p className="accountAssistantStatus">Sign in again to refresh assistant access.</p> : null}
            <p className="accountAssistantStatus" role="status">{copyStatus}</p>
          </div>
        </details>

        <footer className="accountFooter">
          <button type="button" className="accountSignOut" onClick={onSignOut}>
            Sign out
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 3H4v14h4m3-11 4 4-4 4m-4-4h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </footer>
      </div>
    </section>
  );
}
