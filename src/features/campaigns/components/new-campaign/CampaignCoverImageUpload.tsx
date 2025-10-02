import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { FormLabel, FormMessage } from "@/shared/components/ui/form";

export function CampaignCoverImageUpload() {
  const { control } = useFormContext();
  const [isDragging, setIsDragging] = useState(false);

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
    onChange: (value: string) => void,
  ) => {
    const error = await validateImage(file);
    if (error) {
      toast.error(error);
      return false;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    return true;
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void,
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      onChange("");
      return;
    }

    const success = await processFile(file, onChange);
    if (!success) {
      onChange("");
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    onChange: (value: string) => void,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const success = await processFile(file, onChange);
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

  const handleRemoveImage = (onChange: (value: string) => void) => {
    onChange("");
    const fileInput = document.getElementById(
      "cover-image",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <Controller
      control={control}
      name="coverImage"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <div>
          <FormLabel htmlFor="cover-image" className="block pb-4">
            Cover image <span className="text-red-300">*</span>
          </FormLabel>
          <Input
            id="cover-image"
            type="file"
            accept="image/jpeg,image/png"
            className="py-1.5"
            onChange={(e) => handleImageChange(e, onChange)}
          />
          <p className="text-sm text-muted-foreground pt-2 pb-3">
            Upload an image minimum 946x432px resolution. JPEG and PNG format.
            Max up to 5MB.
          </p>
          <div
            className={`relative w-full h-[360px] rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/30"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, onChange)}
          >
            {value ? (
              <>
                <img
                  src={value}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-5 right-5"
                  onClick={() => handleRemoveImage(onChange)}
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
