import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Controller, useFormContext } from "react-hook-form";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import { Upload, Crop as CropIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { FormMessage } from "@/shared/components/ui/form";
import { WalrusReuploadWarningModal } from "@/features/campaigns/components/modals/WalrusReuploadWarningModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { CreateProfileFormData } from "@/features/profiles/schemas/createProfileSchema";

import "react-image-crop/dist/ReactCrop.css";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const AVATAR_ASPECT_RATIO = 1;
const JPEG_QUALITY = 0.92;

const normalizePreviewUrl = (value?: string | null) =>
  value && value.trim().length > 0 ? value : null;

const normaliseMimeType = (
  value: string | undefined,
): "image/jpeg" | "image/png" =>
  value === "image/png" ? "image/png" : "image/jpeg";

const buildCenteredSquareCrop = (
  mediaWidth: number,
  mediaHeight: number,
): PercentCrop =>
  centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 100,
      },
      AVATAR_ASPECT_RATIO,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );

const buildFileNameWithSuffix = (
  base: string,
  suffix: string,
  extension: string,
) => `${base.replace(/\.[^/.]+$/, "")}${suffix}.${extension}`;

const getFileValidationError = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPEG or PNG image.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Image size must be less than 5MB.";
  }

  return null;
};

const getCroppedBlob = async (
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: "image/jpeg" | "image/png",
): Promise<Blob> => {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to obtain canvas context.");
  }

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to produce cropped image blob."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      mimeType === "image/jpeg" ? JPEG_QUALITY : undefined,
    );
  });
};

export interface ProfileAvatarUploadProps {
  disabled?: boolean;
  initialPreviewUrl?: string | null;
  warnOnReupload?: boolean;
  onAvatarRemove?: () => void;
  isMarkedForRemoval?: boolean;
}

export function ProfileAvatarUpload({
  disabled = false,
  initialPreviewUrl = null,
  warnOnReupload = false,
  onAvatarRemove,
  isMarkedForRemoval = false,
}: ProfileAvatarUploadProps) {
  const form = useFormContext<CreateProfileFormData>();
  const { control, watch } = form;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pendingFileRef = useRef<File | null>(null);
  const cropImageObjectUrlRef = useRef<string | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const profileImageValue = watch("profileImage");

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    normalizePreviewUrl(initialPreviewUrl),
  );
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [percentCrop, setPercentCrop] = useState<PercentCrop>();
  const [pixelCrop, setPixelCrop] = useState<PixelCrop | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [isPreparingExistingCrop, setIsPreparingExistingCrop] = useState(false);
  const [showWalrusWarning, setShowWalrusWarning] = useState(false);

  const clearCropImageUrl = useCallback(() => {
    if (cropImageObjectUrlRef.current) {
      URL.revokeObjectURL(cropImageObjectUrlRef.current);
      cropImageObjectUrlRef.current = null;
    }
    setCropImageUrl(null);
  }, []);

  const updatePreviewUrl = useCallback(
    (next: string | null, isObjectUrl: boolean) => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }

      if (isObjectUrl && next) {
        previewObjectUrlRef.current = next;
      }

      setPreviewUrl(next);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      if (cropImageObjectUrlRef.current) {
        URL.revokeObjectURL(cropImageObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMarkedForRemoval) {
      return;
    }

    pendingFileRef.current = null;
    imageRef.current = null;
    setIsCropDialogOpen(false);
    setPercentCrop(undefined);
    setPixelCrop(null);
    clearCropImageUrl();
    updatePreviewUrl(null, false);
  }, [clearCropImageUrl, isMarkedForRemoval, updatePreviewUrl]);

  useEffect(() => {
    const imageFile =
      profileImageValue instanceof File ? profileImageValue : null;

    if (imageFile) {
      updatePreviewUrl(URL.createObjectURL(imageFile), true);
      return;
    }

    updatePreviewUrl(normalizePreviewUrl(initialPreviewUrl), false);
  }, [initialPreviewUrl, profileImageValue, updatePreviewUrl]);

  const openCropperWithFile = useCallback(
    async (file: File) => {
      const errorMessage = getFileValidationError(file);
      if (errorMessage) {
        toast.error(errorMessage);
        form.setError("profileImage", {
          type: "manual",
          message: errorMessage,
        });
        return;
      }

      pendingFileRef.current = file;
      const objectUrl = URL.createObjectURL(file);
      cropImageObjectUrlRef.current = objectUrl;
      setPercentCrop(undefined);
      setPixelCrop(null);
      setCropImageUrl(objectUrl);
      setIsCropDialogOpen(true);
    },
    [form],
  );

  const handleFileInputChange = useCallback(
    async (
      event: ChangeEvent<HTMLInputElement>,
      onChange: (file: File | null) => void,
    ) => {
      if (disabled) {
        event.target.value = "";
        return;
      }

      const file = event.target.files?.[0];
      if (!file) {
        onChange(null);
        updatePreviewUrl(normalizePreviewUrl(initialPreviewUrl), false);
        pendingFileRef.current = null;
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      await openCropperWithFile(file);
      event.target.value = "";
    },
    [disabled, initialPreviewUrl, openCropperWithFile, updatePreviewUrl],
  );

  const handleBrowseClick = useCallback(() => {
    if (disabled) {
      return;
    }
    if (warnOnReupload) {
      setShowWalrusWarning(true);
      return;
    }
    fileInputRef.current?.click();
  }, [disabled, warnOnReupload]);

  const handleConfirmWalrusWarning = useCallback(() => {
    if (disabled) {
      setShowWalrusWarning(false);
      return;
    }
    setShowWalrusWarning(false);
    fileInputRef.current?.click();
  }, [disabled]);

  const handleImageLoaded = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget;
      imageRef.current = target;
      const initialCrop = buildCenteredSquareCrop(
        target.naturalWidth,
        target.naturalHeight,
      );
      setPercentCrop(initialCrop);
      setPixelCrop(
        convertToPixelCrop(
          initialCrop,
          target.naturalWidth,
          target.naturalHeight,
        ),
      );
    },
    [],
  );

  const handleApplyCrop = useCallback(
    async (onChange: (file: File | null) => void) => {
      const sourceFile = pendingFileRef.current;
      const crop = pixelCrop;
      const image = imageRef.current;

      if (!sourceFile || !crop || !image) {
        toast.error("Select an image and adjust the crop first.");
        return;
      }

      try {
        setIsApplyingCrop(true);
        const mimeType = normaliseMimeType(sourceFile.type);
        const blob = await getCroppedBlob(image, crop, mimeType);
        const extension = mimeType === "image/png" ? "png" : "jpg";
        const croppedFile = new File(
          [blob],
          buildFileNameWithSuffix(sourceFile.name, "-avatar", extension),
          {
            type: mimeType,
            lastModified: Date.now(),
          },
        );
        onChange(croppedFile);
        form.clearErrors("profileImage");
        updatePreviewUrl(URL.createObjectURL(croppedFile), true);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "We couldn't crop this image. Please try another one.",
        );
      } finally {
        setIsApplyingCrop(false);
        setIsCropDialogOpen(false);
        clearCropImageUrl();
        pendingFileRef.current = null;
        imageRef.current = null;
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [clearCropImageUrl, form, pixelCrop, updatePreviewUrl],
  );

  const handleAdjustExisting = useCallback(
    async (currentFile: File | null | undefined) => {
      if (!currentFile) {
        return;
      }

      setIsPreparingExistingCrop(true);
      try {
        await openCropperWithFile(currentFile);
      } finally {
        setIsPreparingExistingCrop(false);
      }
    },
    [openCropperWithFile],
  );

  const handleRemoveAvatar = useCallback(() => {
    if (disabled) {
      return;
    }
    pendingFileRef.current = null;
    imageRef.current = null;
    setIsCropDialogOpen(false);
    setPercentCrop(undefined);
    setPixelCrop(null);
    clearCropImageUrl();
    updatePreviewUrl(null, false);
    form.setValue("profileImage", null, { shouldDirty: true });
    setShowWalrusWarning(false);
    onAvatarRemove?.();
  }, [clearCropImageUrl, disabled, form, onAvatarRemove, updatePreviewUrl]);

  return (
    <>
      <Controller
        control={control}
        name="profileImage"
        render={({ field: { value, onChange }, fieldState: { error } }) => {
          const currentFile = value instanceof File ? (value as File) : null;

          return (
            <div className="flex flex-col gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                onChange={(event) =>
                  void handleFileInputChange(event, onChange)
                }
                disabled={disabled}
              />
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative size-[120px] shrink-0 overflow-hidden rounded-3xl bg-black-50">
                    {previewUrl ? (
                      <>
                        <img
                          src={previewUrl}
                          alt="Profile preview"
                          className="size-full object-cover"
                        />
                        {!disabled && !isMarkedForRemoval ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={handleRemoveAvatar}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex max-w-sm size-full items-center justify-center text-[42px] font-medium text-black-400">
                        0x.
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit gap-2 border-black-50"
                      onClick={handleBrowseClick}
                      disabled={disabled}
                    >
                      <Upload className="size-[13.25px]" />
                      Upload new image
                    </Button>
                    <p className="text-xs text-black-300">
                      Upload JPG or PNG, max up to 5MB.
                    </p>
                    <p className="text-xs text-black-300">
                      The profile image incurs storage costs, which will be
                      detailed below. Please ensure the transaction is completed
                      before saving any changes.
                    </p>
                    {currentFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit gap-2"
                        onClick={() => handleAdjustExisting(currentFile)}
                        disabled={disabled || isPreparingExistingCrop}
                      >
                        {isPreparingExistingCrop ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CropIcon className="size-4" />
                        )}
                        Adjust crop
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {error && <FormMessage>{error.message}</FormMessage>}

              <Dialog
                open={isCropDialogOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    setIsCropDialogOpen(false);
                    clearCropImageUrl();
                    pendingFileRef.current = null;
                    imageRef.current = null;
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  } else {
                    setIsCropDialogOpen(true);
                  }
                }}
              >
                {cropImageUrl && (
                  <DialogContent className="max-w-[520px] w-[95vw] sm:w-[480px] overflow-hidden p-0">
                    <div className="flex h-full flex-col">
                      <div className="px-6 pt-6">
                        <DialogHeader>
                          <DialogTitle>Adjust profile image</DialogTitle>
                          <DialogDescription>
                            Use the square crop to frame your avatar exactly the
                            way you want.
                          </DialogDescription>
                        </DialogHeader>
                      </div>
                      <div className="flex-1 overflow-auto px-6 py-4">
                        <div className="mx-auto flex max-w-[360px] flex-col items-center gap-4">
                          <ReactCrop
                            crop={percentCrop}
                            onChange={(nextPixelCrop, nextPercentCrop) => {
                              setPercentCrop(nextPercentCrop);
                              setPixelCrop(nextPixelCrop);
                            }}
                            onComplete={(nextPixelCrop) => {
                              setPixelCrop(nextPixelCrop);
                            }}
                            aspect={AVATAR_ASPECT_RATIO}
                            keepSelection
                            ruleOfThirds
                            className="w-full rounded-xl border border-black-50 bg-white"
                          >
                            <img
                              src={cropImageUrl}
                              alt="Crop preview"
                              onLoad={handleImageLoaded}
                              className="block max-h-[360px] w-full object-contain"
                            />
                          </ReactCrop>
                          <p className="text-center text-xs text-muted-foreground">
                            Drag the handles or move the crop to adjust your
                            avatar.
                          </p>
                        </div>
                      </div>
                      <DialogFooter className="flex flex-row justify-end gap-3 border-t px-6 py-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCropDialogOpen(false);
                            clearCropImageUrl();
                            pendingFileRef.current = null;
                            imageRef.current = null;
                          }}
                          disabled={isApplyingCrop}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="min-w-[120px]"
                          onClick={() => void handleApplyCrop(onChange)}
                          disabled={isApplyingCrop || !pixelCrop}
                        >
                          {isApplyingCrop ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="size-4 animate-spin" />
                              Applying…
                            </span>
                          ) : (
                            "Save crop"
                          )}
                        </Button>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                )}
              </Dialog>
            </div>
          );
        }}
      />

      <WalrusReuploadWarningModal
        open={showWalrusWarning}
        onConfirm={handleConfirmWalrusWarning}
        onClose={() => setShowWalrusWarning(false)}
      />
    </>
  );
}
