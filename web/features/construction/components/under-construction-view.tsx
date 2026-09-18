"use client";

type UnderConstructionViewProps = {
  onBackToTasks: () => void;
};

export function UnderConstructionView({ onBackToTasks }: UnderConstructionViewProps) {
  return (
    <section className="constructionSection" aria-label="Under construction">
      <div className="constructionCard">
        <div className="constructionConeWrapper">
          <svg
            className="constructionConeIcon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 20h18" />
            <path d="m7.5 20 3.2-14.2a1 1 0 0 1 .98-.8h.64a1 1 0 0 1 .98.8L16.5 20" />
            <path d="m9 15h6" />
            <path d="m10 10h4" />
          </svg>
        </div>

        <span className="constructionBadge">Work in progress</span>
        <h2 className="constructionTitle">Under Construction</h2>
        <p className="constructionDescription">
          This section is currently being built. Check back soon for new features and updates!
        </p>

        <button
          type="button"
          className="constructionButton"
          onClick={onBackToTasks}
        >
          Back to Tasks
        </button>
      </div>
    </section>
  );
}
