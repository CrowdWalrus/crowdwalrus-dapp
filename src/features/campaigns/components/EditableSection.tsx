import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { WalrusReuploadWarningModal } from "./modals/WalrusReuploadWarningModal";

interface EditableSectionProps {
  label: string;
  description?: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  requiresWalrusWarning?: boolean;
  onWalrusWarningAccepted?: () => void;
  disabled?: boolean;
  lockedMessage?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function EditableSection({
  label,
  description,
  isEditing,
  onToggleEdit,
  requiresWalrusWarning = false,
  onWalrusWarningAccepted,
  disabled = false,
  lockedMessage,
  status,
  actions,
  children,
  className,
}: EditableSectionProps) {
  const [showWalrusWarning, setShowWalrusWarning] = useState(false);

  const handleEditClick = () => {
    if (disabled) {
      return;
    }
    if (!isEditing && requiresWalrusWarning) {
      setShowWalrusWarning(true);
      return;
    }
    onToggleEdit();
  };

  const handleWalrusConfirm = () => {
    if (requiresWalrusWarning) {
      onWalrusWarningAccepted?.();
    } else {
      onToggleEdit();
    }
    setShowWalrusWarning(false);
  };

  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold leading-6">{label}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
          {lockedMessage ? (
            <p className="text-sm font-medium text-muted-foreground">
              {lockedMessage}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {status ? (
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {status}
            </span>
          ) : null}
          {!disabled && !isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEditClick}>
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-6 rounded-lg border border-dashed border-border/60 p-4 transition",
          !isEditing && "pointer-events-none opacity-70",
        )}
        aria-disabled={!isEditing}
      >
        {children}
      </div>

      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}

      {requiresWalrusWarning ? (
        <WalrusReuploadWarningModal
          open={showWalrusWarning}
          onConfirm={handleWalrusConfirm}
          onClose={() => setShowWalrusWarning(false)}
        />
      ) : null}
    </section>
  );
}
