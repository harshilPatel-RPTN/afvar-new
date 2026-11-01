"use client";

import Image from "next/image";
import Link from "next/link";
import { SignatureMark } from "./SignatureMark";
import "./signature-home-link.css";

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
      <SignatureMark landing={landing} />
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
