"use client";

import Image from "next/image";
import Link from "next/link";
import "./signature-home-link.css";

// The signature can land once the real navigation has hydrated.
function markHeaderReady(node: HTMLPictureElement | null) {
  if (node) node.dataset.afvarBrandReady = "true";
}

export function SignatureHomeLink({
  label, onClick, landing = false, className = "",
}: {
  label: string;
  onClick?: () => void;
  landing?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" aria-label={label} onClick={onClick} className={`afvar-header-brand rounded-sm ${className}`}>
      <picture className="afvar-header-symbol" data-afvar-brand-mark={landing ? "" : undefined} ref={landing ? markHeaderReady : undefined}>
        <source media="(max-width: 600px)" srcSet="/afvar-signature/assets/approved-lite.webp" />
        <img src="/afvar-signature/assets/approved.webp" alt="" width="46" height="46" />
      </picture>
      <Image
        className="afvar-header-name"
        data-afvar-brand-name={landing ? "" : undefined}
        src="/afvar-signature/golden-reveal/afvar-wordmark-dock.webp"
        alt=""
        width={1009}
        height={150}
        unoptimized
        loading="eager"
      />
    </Link>
  );
}
