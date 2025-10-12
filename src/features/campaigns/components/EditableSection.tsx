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
    <section
      className={cn(
        "rounded-xl border border-border bg-white p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">{label}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
          {lockedMessage ? (
            <p className="text-sm font-medium text-muted-foreground">
              {lockedMessage}
            </p>
          ) : null}
        </div>
        {!disabled && !isEditing ? (
          <Button variant="outline" size="sm" onClick={handleEditClick}>
            Edit
          </Button>
        ) : null}
        {status ? (
          <span className="text-sm font-medium text-muted-foreground">
            {status}
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-6 flex flex-col gap-6 transition",
          !isEditing && "pointer-events-none opacity-60",
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
