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
      setCopyStatus("Could not copy. Select and copy the token manually.");
    }
  };

  return (
    <section className="accountView" aria-labelledby="workspace-03">
      <WorkspaceHero index="03" title="Account">
        <p className="accountLead">Profile, theme, and a quick look at your quests.</p>
      </WorkspaceHero>

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
          <dt>Open</dt>
          <dd>{openQuestCount}</dd>
        </div>
        <div>
          <dt>Done</dt>
          <dd>{completedQuestCount}</dd>
        </div>
      </dl>

      <div className="accountThemeBlock">
        <h3 className="accountSectionLabel">Theme</h3>
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
            </button>
          ))}
        </div>
      </div>

      <div className="accountAssistantBlock">
        <h3 className="accountSectionLabel">Assistant access</h3>
        <p className="accountAssistantCopy">
          Grok connects as you — no shared API key. Copy your refresh token, then run{" "}
          <code>node mcp/src/login.js &lt;token&gt;</code> so the MCP can write only to your brief and
          quests.
        </p>
        <p className="accountAssistantMeta">Signed in as <code>{userId}</code></p>
        <div className="accountAssistantActions">
          <button type="button" className="accountTextButton" onClick={() => void copyRefreshToken()}>
            Copy refresh token
          </button>
        </div>
        {copyStatus ? <p className="accountAssistantStatus">{copyStatus}</p> : null}
      </div>

      <button type="button" className="accountSignOut" onClick={onSignOut}>
        Sign out
      </button>
    </section>
  );
}
