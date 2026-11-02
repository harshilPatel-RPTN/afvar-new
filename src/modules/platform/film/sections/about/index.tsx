"use client";

// /about after the hero: six OS sections, one file each (see docs/PLATFORM-MOTION-LOG.md for owners).
import { Purpose } from "./Purpose";
import { OneDesk } from "./OneDesk";
import { WhoItServes } from "./WhoItServes";
import { Principles } from "./Principles";
import { Company } from "./Company";
import { BuildStatus } from "./BuildStatus";

export function AboutSections() {
  return (
    <>
      <Purpose />
      <OneDesk />
      <WhoItServes />
      <Principles />
      <Company />
      <BuildStatus />
    </>
  );
}
