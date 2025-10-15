/**
 * Tip Card Component
 *
 * Displays a clickable card with an icon and title for crowdfunding tips
 */

import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon } from "lucide-react";

interface TipCardProps {
  icon: LucideIcon;
  title: string;
  href: string;
}

export function TipCard({ icon: Icon, title, href }: TipCardProps) {
  return (
    <Link
      to={href}
      className="flex items-center gap-6 bg-white-500 rounded-2xl p-6 hover:shadow-sm transition-shadow flex-1"
    >
      <div className="flex items-center gap-6 flex-1">
        {/* Icon Circle */}
        <div className="flex items-center justify-center bg-blue-50 rounded-full size-12 shrink-0">
          <Icon className="size-6 text-blue-500" strokeWidth={2} />
        </div>

        {/* Title */}
        <p className="font-semibold text-xl text-black-500 leading-[1.6]">
          {title}
        </p>
      </div>

      {/* Arrow Icon */}
      <ArrowRight className="size-6 text-black-500 shrink-0" strokeWidth={2} />
    </Link>
  );
}
