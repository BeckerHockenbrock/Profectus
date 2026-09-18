import Image from "next/image";

type AppHeaderProps = {
  userInitial: string;
  onOpenNewQuest: () => void;
  onSignOut: () => void;
  onNavigateTasks?: () => void;
};

export function AppHeader({
  userInitial,
  onOpenNewQuest,
  onSignOut,
  onNavigateTasks,
}: AppHeaderProps) {
  return (
    <header className="topBar">
      <a
        className="brand"
        href="#top"
        aria-label="Todo Quest home"
        onClick={(event) => {
          if (onNavigateTasks) {
            event.preventDefault();
            onNavigateTasks();
          }
        }}
      >
        <Image
          className="brandLogo"
          src="/icon-192.png"
          alt=""
          width={40}
          height={40}
          preload
          unoptimized
        />
        <span className="brandName">Todo Quest</span>
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
        <button className="profileButton" type="button" onClick={onSignOut} title="Sign out" aria-label="Sign out">
          {userInitial}
        </button>
      </div>
    </header>
  );
}
