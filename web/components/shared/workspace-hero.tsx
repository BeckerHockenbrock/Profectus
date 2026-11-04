import type { ReactNode } from "react";

type WorkspaceHeroProps = {
  index: string;
  title: string;
  children?: ReactNode;
};

export function WorkspaceHero({ index, title, children }: WorkspaceHeroProps) {
  return (
    <section className="workspaceHero" aria-labelledby={`workspace-${index}`}>
      <div className="sheetCaption"><span>{index}</span><span>{title}</span><span className="sheetCaptionRule" /><span aria-hidden="true">↗</span></div>
      <div className="workspaceHeroCopy">
        <h1 id={`workspace-${index}`}>{title}<span aria-hidden="true">.</span></h1>
        {children ? <div className="workspaceHeroDetail">{children}</div> : null}
      </div>
    </section>
  );
}
