import { useState, useEffect, type ReactNode } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { FormLabel, FormMessage } from "@/shared/components/ui/form";

export interface CampaignCoverImageUploadProps {
  disabled?: boolean;
  initialPreviewUrl?: string | null;
  labelAction?: ReactNode;
  labelStatus?: ReactNode;
}

export function CampaignCoverImageUpload({
  disabled = false,
  initialPreviewUrl = null,
  labelAction,
  labelStatus,
}: CampaignCoverImageUploadProps) {
  const { control, watch } = useFormContext();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isObjectUrl, setIsObjectUrl] = useState(false);
  const [hasLocalPreview, setHasLocalPreview] = useState(false);
  const coverImageValue = watch("coverImage");

  useEffect(() => {
    if (hasLocalPreview) {
      return;
    }
    if (initialPreviewUrl) {
      setPreviewUrl(initialPreviewUrl);
      setIsObjectUrl(false);
    } else {
      setPreviewUrl(null);
      setIsObjectUrl(false);
    }
  }, [initialPreviewUrl, hasLocalPreview]);

  useEffect(() => {
    if (!coverImageValue && hasLocalPreview) {
      if (previewUrl && isObjectUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(initialPreviewUrl);
      setHasLocalPreview(false);
      setIsObjectUrl(false);
    }
  }, [
    coverImageValue,
    hasLocalPreview,
    previewUrl,
    isObjectUrl,
    initialPreviewUrl,
  ]);

  const validateImage = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      // Check file type
      if (!file.type.match(/^image\/(jpeg|png)$/)) {
        resolve("Please upload a JPEG or PNG image.");
        return;
      }

      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        resolve("Image size must be less than 5MB.");
        return;
      }

      // Check dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width < 946 || img.height < 432) {
          resolve("Image must be at least 946x432px.");
        } else {
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve("Failed to load image.");
      };

      img.src = objectUrl;
    });
  };

  const processFile = async (
    file: File,
    onChange: (value: File) => void,
  ) => {
    const error = await validateImage(file);
    if (error) {
      toast.error(error);
      return false;
    }

    // Clean up old preview URL
    if (previewUrl) {
      if (isObjectUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }

    // Create new preview URL
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setIsObjectUrl(true);
    setHasLocalPreview(true);

    // Set the File object in the form
    onChange(file);
    return true;
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && isObjectUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, isObjectUrl]);

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: File | null) => void,
  ) => {
    if (disabled) {
      if (e.target) {
        e.target.value = "";
      }
      return;
    }

    const file = e.target.files?.[0];

    if (!file) {
      onChange(null);
      setPreviewUrl(null);
      setHasLocalPreview(false);
      setIsObjectUrl(false);
      return;
    }

    const success = await processFile(file, onChange as (value: File) => void);
    if (!success) {
      onChange(null);
      setPreviewUrl(null);
      setHasLocalPreview(false);
      setIsObjectUrl(false);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) {
      setIsDragging(false);
      return;
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    onChange: (value: File | null) => void,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const success = await processFile(file, onChange as (value: File) => void);
    if (success) {
      const fileInput = document.getElementById(
        "cover-image",
      ) as HTMLInputElement;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
      }
    }
  };

  const handleRemoveImage = (onChange: (value: File | null) => void) => {
    if (disabled) {
      return;
    }
    // Clean up preview URL
    if (previewUrl) {
      if (isObjectUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    }

    onChange(null);
    setHasLocalPreview(false);
    setIsObjectUrl(false);
    const fileInput = document.getElementById(
      "cover-image",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  useEffect(() => {
    if (disabled) {
      setIsDragging(false);
    }
  }, [disabled]);

  return (
    <Controller
      control={control}
      name="coverImage"
      render={({ field: { onChange }, fieldState: { error } }) => (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <FormLabel
              htmlFor="cover-image"
              className="font-medium text-base leading-[1.6]"
            >
              Cover image <span className="text-red-300">*</span>
            </FormLabel>
            {(labelAction || labelStatus) && (
              <div className="flex items-center gap-3">
                {labelStatus}
                {labelAction}
              </div>
            )}
          </div>
          <Input
            id="cover-image"
            type="file"
            accept="image/jpeg,image/png"
            className="py-1.5"
            disabled={disabled}
            onChange={(e) => handleImageChange(e, onChange)}
          />
          <p className="text-sm text-muted-foreground pt-2 pb-3">
            Upload an image (min 946×432 px, JPEG or PNG, up to 5 MB).
          </p>
          <div
            className={`relative w-full h-[360px] rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/30"
            } ${disabled ? "opacity-70 pointer-events-none" : ""}`.trim()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, onChange)}
          >
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-5 right-5"
                  onClick={() => handleRemoveImage(onChange)}
                  disabled={disabled}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-12 w-12" />
                <p className="text-sm">
                  {isDragging
                    ? "Drop image here"
                    : 'Drag and drop or click "Choose File" to upload'}
                </p>
              </div>
            )}
          </div>
          {error && <FormMessage>{error.message}</FormMessage>}
        </div>
      )}
    />
  );
}
