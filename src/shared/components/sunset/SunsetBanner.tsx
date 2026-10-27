import { Link } from "react-router-dom";
import { Info } from "lucide-react";

import { ROUTES } from "@/shared/config/routes";
import { SUNSET_DATE_LABEL, hasSunset } from "@/shared/config/sunset";

export function SunsetBanner() {
  const isSunset = hasSunset();

  return (
    <div role="region" aria-label="Sunset announcement" className="bg-blue-600 text-white-50">
      <div className="container px-4">
        <div className="flex items-start gap-3 py-3 sm:items-center sm:justify-center">
          <Info className="mt-0.5 size-5 shrink-0 sm:mt-0" aria-hidden="true" />
          <p className="text-sm leading-relaxed sm:text-center sm:text-base">
            <strong className="font-semibold">
              {isSunset ? "CrowdWalrus Has Sunset." : "CrowdWalrus is Sunsetting."}
            </strong>{" "}
            {isSunset ? (
              <>
                CrowdWalrus closed on <strong>{SUNSET_DATE_LABEL}</strong>.
                Thank you for being part of our journey! This website remains
                available as an archive.
              </>
            ) : (
              <>
                CrowdWalrus will close on <strong>{SUNSET_DATE_LABEL}</strong>.
                Thank you for being part of our journey exploring on-chain
                crowdfunding! Questions or want to stay in touch?
              </>
            )}{" "}
            <Link
              to={ROUTES.CONTACT}
              className="font-semibold underline underline-offset-2 hover:text-sky-300"
            >
              Contact Us
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
