import Image from "next/image";
import type { ReactNode } from "react";

type WorkspaceHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  children?: ReactNode;
};

export function WorkspaceHero({ eyebrow, title, description, image, children }: WorkspaceHeroProps) {
  return (
    <section className="workspaceHero" aria-label={title}>
      <div className="workspaceHeroCopy">
        <p className="workspaceEyebrow"><span aria-hidden="true" />{eyebrow}</p>
        <h1>{title}</h1>
        <p className="workspaceDescription">{description}</p>
        {children ? <div className="workspaceHeroDetail">{children}</div> : null}
      </div>
      <div className="workspaceArtwork" aria-hidden="true">
        <Image src={image} alt="" width={384} height={456} sizes="(max-width: 40rem) 32vw, 270px" preload unoptimized />
        <span className="artworkCaption">A LITTLE HIGHER, EVERY DAY.</span>
      </div>
    </section>
  );
}
