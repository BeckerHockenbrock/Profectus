type HomeScreenHintProps = {
  onDismiss: () => void;
};

export function HomeScreenHint({ onDismiss }: HomeScreenHintProps) {
  return (
    <aside className="homeScreenHint" aria-label="Add Todo Quest to your home screen">
      <div>
        <strong>Use Todo Quest like an app</strong>
        <p>Open your browser menu, then choose <b>Share</b> and <b>Add to Home Screen</b>.</p>
      </div>
      <button className="hintDismissButton" type="button" onClick={onDismiss} aria-label="Dismiss home screen hint">
        Not now
      </button>
    </aside>
  );
}
