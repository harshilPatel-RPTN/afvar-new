import Image from "next/image";

const art = "/afvar-signature/golden-reveal";

/** The same registered lettering layers are used for entry, standby and handoff. */
export function SignatureCaption() {
  return (
    <div className="afvar-flight-caption" data-signature-caption="">
      <div className="afvar-flight-lettering">
        <Image unoptimized loading="eager" src={art + "/afvar-wordmark-matched.webp"} width={1009} height={150} alt="" />
        <Image unoptimized loading="eager" className="afvar-flight-dock-ink" src={art + "/afvar-wordmark-dock.webp"} width={1009} height={150} alt="" />
        <span className="afvar-flight-sheen" />
      </div>
      <div className="afvar-flight-reflection"><div className="afvar-flight-mirror">
        <Image unoptimized loading="eager" src={art + "/afvar-wordmark-matched.webp"} width={1009} height={150} alt="" />
        <span className="afvar-flight-sheen" />
      </div></div>
    </div>
  );
}
