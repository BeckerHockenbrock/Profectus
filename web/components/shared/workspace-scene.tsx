import Image from "next/image";

export function WorkspaceScene() {
  return (
    <div className="workspaceScene" aria-hidden="true">
      <Image
        src="/art/marble-portrait.png"
        alt=""
        fill
        sizes="100vw"
        preload
        unoptimized
      />
      <span className="sceneWordmark">Profectus</span>
      <div className="sceneShade" />
    </div>
  );
}
