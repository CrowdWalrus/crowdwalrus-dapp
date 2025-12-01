import { Link } from "react-router-dom";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { ROUTES } from "@/shared/config/routes";

export function NotFoundPage() {
  useDocumentTitle("Page not found");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-2xl border-black-50 bg-white">
        <CardContent className="flex flex-col items-center gap-6 px-6 py-12 text-center sm:px-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-white-500 text-2xl font-semibold text-black-400">
            404
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-black-500">
              Page not found
            </h1>
            <p className="text-base text-black-400">
              The page you are looking for doesn't exist or may have moved.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-xl px-8">
            <Link to={ROUTES.HOME}>Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
