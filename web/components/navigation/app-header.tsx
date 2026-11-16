import { BrandMark } from "@/components/shared/brand-mark";

type AppHeaderProps = {
  userInitial: string;
  avatarDataUrl?: string | null;
  onOpenNewQuest: () => void;
  onOpenAccount: () => void;
  onNavigateTasks?: () => void;
};

export function AppHeader({
  userInitial,
  avatarDataUrl,
  onOpenNewQuest,
  onOpenAccount,
  onNavigateTasks,
}: AppHeaderProps) {
  return (
    <header className="topBar">
      <a
        className="brand"
        href="#top"
        aria-label="Profectus home"
        onClick={(event) => {
          if (onNavigateTasks) {
            event.preventDefault();
            onNavigateTasks();
          }
        }}
      >
        <BrandMark />
        <span className="railBrand">
          <span className="brandName">Profectus</span>
          <span className="railBrandCaption">{"// Workspace"}</span>
        </span>
      </a>
      <div className="topBarActions">
        <button
          className="topAddButton"
          type="button"
          onClick={onOpenNewQuest}
          aria-label="Create new quest"
          title="New quest"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New quest</span>
        </button>
        <button
          className="profileButton"
          type="button"
          onClick={onOpenAccount}
          title="Account"
          aria-label="Open account"
        >
          {avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarDataUrl} alt="" className="profileButtonImage" />
          ) : (
            userInitial
          )}
        </button>
      </div>
    </header>
  );
}
