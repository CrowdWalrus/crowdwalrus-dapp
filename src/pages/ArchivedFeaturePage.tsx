import { Link } from "react-router-dom";
import { Archive } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { ROUTES } from "@/shared/config/routes";
import { SUNSET_DATE_LABEL, hasSunset } from "@/shared/config/sunset";

export function ArchivedFeaturePage() {
  useDocumentTitle("Feature retired");
  const isSunset = hasSunset();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-2xl border-black-50 bg-white">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-white-500 text-black-400">
            <Archive className="size-7" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-black-500">
              This feature has been retired
            </h1>
            <p className="text-base text-black-400">
              {isSunset
                ? `CrowdWalrus closed on ${SUNSET_DATE_LABEL}.`
                : `CrowdWalrus will close on ${SUNSET_DATE_LABEL}.`}{" "}
              Campaigns, contributions, profiles, and other platform features
              are no longer available on this website, which now serves as a
              read-only archive of the project.
            </p>
            <p className="text-sm text-black-300">
              Retiring this website does not delete on-chain records or smart
              contracts.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-xl px-8">
              <Link to={ROUTES.HOME}>Return home</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl px-8">
              <Link to={ROUTES.CONTACT}>Contact Us</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
