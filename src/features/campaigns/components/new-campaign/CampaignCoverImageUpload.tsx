import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Upload, X, Crop as CropIcon, Loader2 } from "lucide-react";
import ReactCrop, {
  centerCrop,
  convertToPercentCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { FormLabel, FormMessage } from "@/shared/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";

export interface CampaignCoverImageUploadProps {
  disabled?: boolean;
  initialPreviewUrl?: string | null;
  labelAction?: ReactNode;
  labelStatus?: ReactNode;
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const COVER_ASPECT_RATIO = 946 / 432;
const JPEG_QUALITY = 0.92;

type CropSource = "new" | "existing" | null;

interface LocalImageSource {
  file: File;
  url: string;
  mimeType: "image/jpeg" | "image/png";
}

const normalizePreviewUrl = (value?: string | null) =>
  value && value.trim().length > 0 ? value : null;

const normaliseMimeType = (
  value: string | undefined,
): "image/jpeg" | "image/png" =>
  value === "image/png" ? "image/png" : "image/jpeg";

const buildInitialCrop = (
  mediaWidth: number,
  mediaHeight: number,
): PercentCrop =>
  centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 100,
      },
      COVER_ASPECT_RATIO,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );

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

const getFileValidationError = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPEG or PNG image.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Image size must be less than 5MB.";
  }

  return null;
};

const buildFileNameWithSuffix = (
  base: string,
  suffix: string,
  extension: string,
) => `${base.replace(/\.[^/.]+$/, "")}${suffix}.${extension}`;

export function CampaignCoverImageUpload({
  disabled = false,
  initialPreviewUrl = null,
  labelAction,
  labelStatus,
}: CampaignCoverImageUploadProps) {
  const { control, watch } = useFormContext();
  const coverImageValue = watch("coverImage");

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    normalizePreviewUrl(initialPreviewUrl),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<CropSource>(null);
  const [percentCrop, setPercentCrop] = useState<PercentCrop>();
  const [pixelCrop, setPixelCrop] = useState<PixelCrop | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [isPreparingExistingCrop, setIsPreparingExistingCrop] =
    useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef<(value: File | null) => void>();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const activeSourceRef = useRef<LocalImageSource | null>(null);
  const pendingSourceRef = useRef<LocalImageSource | null>(null);
  const savedPercentCropRef = useRef<PercentCrop | null>(null);
  const hasClearedInitialPreviewRef = useRef(false);
  const lastInitialUrlRef = useRef<string | null>(
    normalizePreviewUrl(initialPreviewUrl),
  );

  const updatePreview = useCallback(
    (url: string | null, isObjectUrl: boolean) => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }

      if (isObjectUrl && url) {
        previewObjectUrlRef.current = url;
      }

      setPreviewUrl(url);
    },
    [],
  );

  const clearPendingSource = useCallback(() => {
    if (pendingSourceRef.current) {
      URL.revokeObjectURL(pendingSourceRef.current.url);
      pendingSourceRef.current = null;
    }
  }, []);

  const clearActiveSource = useCallback(() => {
    if (activeSourceRef.current) {
      URL.revokeObjectURL(activeSourceRef.current.url);
      activeSourceRef.current = null;
    }
    savedPercentCropRef.current = null;
  }, []);

  const ensureExistingSource = useCallback(async () => {
    if (activeSourceRef.current) {
      return activeSourceRef.current;
    }

    const sourceUrl =
      normalizePreviewUrl(previewUrl) ??
      normalizePreviewUrl(initialPreviewUrl);
    if (!sourceUrl) {
      return null;
    }

    setIsPreparingExistingCrop(true);
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      const mimeType = normaliseMimeType(blob.type);
      const extension = mimeType === "image/png" ? "png" : "jpg";
      const file = new File(
        [blob],
        `cover-image-original.${extension}`,
        {
          type: mimeType,
          lastModified: Date.now(),
        },
      );
      const url = URL.createObjectURL(file);
      const source: LocalImageSource = { file, url, mimeType };
      activeSourceRef.current = source;
      return source;
    } catch (error) {
      console.error(error);
      toast.error(
        "We couldn't load the existing image for cropping. Please re-upload it.",
      );
      return null;
    } finally {
      setIsPreparingExistingCrop(false);
    }
  }, [initialPreviewUrl, previewUrl]);

  const openCropperForFile = useCallback((file: File) => {
    const validationError = getFileValidationError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const mimeType = normaliseMimeType(file.type);

    clearPendingSource();

    pendingSourceRef.current = {
      file,
      url: objectUrl,
      mimeType,
    };

    setCropSource("new");
    setCropImageUrl(objectUrl);
    setIsCropDialogOpen(true);
    setPercentCrop(undefined);
    setPixelCrop(null);
    imageRef.current = null;
    savedPercentCropRef.current = null;
  }, [clearPendingSource]);

  const handleAdjustCrop = useCallback(async () => {
    if (disabled) {
      return;
    }

    const source =
      cropSource === "new"
        ? pendingSourceRef.current
        : await ensureExistingSource();

    if (!source) {
      return;
    }

    setCropSource("existing");
    setCropImageUrl(source.url);
    setIsCropDialogOpen(true);
    setPercentCrop(savedPercentCropRef.current ?? undefined);
    setPixelCrop(null);
    imageRef.current = null;
  }, [cropSource, disabled, ensureExistingSource]);

  const handleImageLoaded = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;
      imageRef.current = image;

      const { naturalWidth, naturalHeight } = image;

      let nextPercentCrop: PercentCrop;
      if (cropSource === "existing" && savedPercentCropRef.current) {
        nextPercentCrop = savedPercentCropRef.current;
      } else {
        nextPercentCrop = buildInitialCrop(naturalWidth, naturalHeight);
      }

      setPercentCrop(nextPercentCrop);
      setPixelCrop(
        convertToPixelCrop(nextPercentCrop, naturalWidth, naturalHeight),
      );
    },
    [cropSource],
  );

  const applyCroppedImage = useCallback(
    async (baseSource: LocalImageSource) => {
      if (!onChangeRef.current || !imageRef.current || !pixelCrop) {
        toast.error("Draw a crop before saving.");
        return;
      }

      setIsApplyingCrop(true);
      try {
        const blob = await getCroppedBlob(
          imageRef.current,
          pixelCrop,
          baseSource.mimeType,
        );

        if (blob.size > MAX_IMAGE_BYTES) {
          toast.error(
            "Cropped image must be less than 5MB. Try a tighter crop or a smaller file.",
          );
          return;
        }

        const extension = baseSource.mimeType === "image/png" ? "png" : "jpg";
        const croppedFile = new File(
          [blob],
          buildFileNameWithSuffix(baseSource.file.name, "-cropped", extension),
          {
            type: baseSource.mimeType,
            lastModified: Date.now(),
          },
        );

        onChangeRef.current(croppedFile);

        const previewObjectUrl = URL.createObjectURL(croppedFile);
        updatePreview(previewObjectUrl, true);
        hasClearedInitialPreviewRef.current = true;

        const percent = convertToPercentCrop(
          pixelCrop,
          imageRef.current.naturalWidth,
          imageRef.current.naturalHeight,
        );
        savedPercentCropRef.current = percent;

        if (cropSource === "new" && pendingSourceRef.current) {
          clearActiveSource();
          activeSourceRef.current = pendingSourceRef.current;
          pendingSourceRef.current = null;
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setIsCropDialogOpen(false);
        setCropSource(null);
        setCropImageUrl(null);
        setPercentCrop(undefined);
        setPixelCrop(null);
        imageRef.current = null;
      } catch (error) {
        console.error(error);
        toast.error("Failed to crop image. Please try again.");
      } finally {
        setIsApplyingCrop(false);
      }
    },
    [clearActiveSource, cropSource, pixelCrop, updatePreview],
  );

  const handleCropDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        const source = cropSource;
        setIsCropDialogOpen(false);
        setCropImageUrl(null);
        setCropSource(null);
        setPercentCrop(undefined);
        setPixelCrop(null);
        imageRef.current = null;

        if (source === "new") {
          clearPendingSource();
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
        return;
      }

      if (cropImageUrl) {
        setIsCropDialogOpen(true);
      }
    },
    [clearPendingSource, cropImageUrl, cropSource],
  );

  const handleImageChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      onChange: (value: File | null) => void,
    ) => {
      if (disabled) {
        if (event.target) {
          event.target.value = "";
        }
        return;
      }

      const file = event.target.files?.[0];

      if (!file) {
        onChange(null);
        if (!hasClearedInitialPreviewRef.current) {
          const resetUrl = normalizePreviewUrl(initialPreviewUrl);
          updatePreview(
            resetUrl,
            Boolean(resetUrl && resetUrl.startsWith("blob:")),
          );
        }
        clearActiveSource();
        clearPendingSource();
        savedPercentCropRef.current = null;
        return;
      }

      onChangeRef.current = onChange;
      openCropperForFile(file);
    },
    [
      clearActiveSource,
      clearPendingSource,
      disabled,
      initialPreviewUrl,
      openCropperForFile,
      updatePreview,
    ],
  );

  const handleDrop = useCallback(
    async (
      event: React.DragEvent<HTMLDivElement>,
      onChange: (value: File | null) => void,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      if (disabled) {
        return;
      }

      const file = event.dataTransfer.files?.[0];
      if (!file) {
        return;
      }

      onChangeRef.current = onChange;
      openCropperForFile(file);

      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    },
    [disabled, openCropperForFile],
  );

  const handleRemoveImage = useCallback(
    (onChange: (value: File | null) => void) => {
      if (disabled) {
        return;
      }

      onChange(null);
      updatePreview(null, false);
      hasClearedInitialPreviewRef.current = true;
      clearActiveSource();
      clearPendingSource();
      savedPercentCropRef.current = null;
      setCropSource(null);
      setPercentCrop(undefined);
      setPixelCrop(null);
      imageRef.current = null;

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [clearActiveSource, clearPendingSource, disabled, updatePreview],
  );

  useEffect(() => {
    const normalizedInitial = normalizePreviewUrl(initialPreviewUrl);

    if (normalizedInitial !== lastInitialUrlRef.current) {
      lastInitialUrlRef.current = normalizedInitial;
      hasClearedInitialPreviewRef.current = false;
    }

    if (
      !coverImageValue &&
      !pendingSourceRef.current &&
      !activeSourceRef.current &&
      !hasClearedInitialPreviewRef.current
    ) {
      updatePreview(
        normalizedInitial,
        Boolean(normalizedInitial && normalizedInitial.startsWith("blob:")),
      );
    }
  }, [coverImageValue, initialPreviewUrl, updatePreview]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      if (pendingSourceRef.current) {
        URL.revokeObjectURL(pendingSourceRef.current.url);
      }
      if (activeSourceRef.current) {
        URL.revokeObjectURL(activeSourceRef.current.url);
      }
    };
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) {
      setIsDragging(false);
      return;
    }
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (disabled) {
      setIsDragging(false);
    }
  }, [disabled]);

  const canAdjustCrop = Boolean(
    normalizePreviewUrl(previewUrl) || normalizePreviewUrl(initialPreviewUrl),
  );

  return (
    <Controller
      control={control}
      name="coverImage"
      render={({ field: { onChange }, fieldState: { error } }) => {
        onChangeRef.current = onChange;

        return (
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
              ref={fileInputRef}
              id="cover-image"
              type="file"
              accept="image/jpeg,image/png"
              className="py-1.5"
              disabled={disabled}
              onChange={(event) => handleImageChange(event, onChange)}
            />
            <p className="text-sm text-muted-foreground pt-2 pb-3">
              Upload an image (JPEG or PNG, up to 5 MB). You can fine-tune the
              crop before saving.
            </p>
            <div
              className={`relative w-full h-[360px] rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/30"
              } ${disabled ? "opacity-70 pointer-events-none" : ""}`.trim()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(event) => handleDrop(event, onChange)}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-5 right-5 flex flex-wrap gap-2">
                    {canAdjustCrop && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleAdjustCrop}
                        disabled={disabled || isPreparingExistingCrop}
                        type="button"
                        className="gap-2"
                      >
                        {isPreparingExistingCrop ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CropIcon className="h-4 w-4" />
                        )}
                        Adjust crop
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleRemoveImage(onChange)}
                      disabled={disabled}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
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

            <Dialog
              open={isCropDialogOpen}
              onOpenChange={handleCropDialogOpenChange}
            >
              {cropImageUrl && (
                <DialogContent className="max-w-[760px] w-[95vw] sm:w-[720px] max-h-[95vh] overflow-hidden p-0">
                  <div className="flex h-full flex-col">
                    <div className="px-6 pt-6">
                      <DialogHeader>
                        <DialogTitle>Adjust cover image</DialogTitle>
                        <DialogDescription>
                          Use the widescreen crop to decide how your cover image
                          appears on campaign pages.
                        </DialogDescription>
                      </DialogHeader>
                    </div>
                    <div className="flex-1 overflow-auto px-6 py-4">
                      <div className="mx-auto w-full max-w-[640px]">
                        <div className="max-h-[70vh] overflow-auto rounded-xl border border-border/60 bg-muted/30 p-2">
                          <ReactCrop
                            crop={percentCrop}
                            onChange={(nextPixelCrop, nextPercentCrop) => {
                              setPercentCrop(nextPercentCrop);
                              setPixelCrop(nextPixelCrop);
                            }}
                            onComplete={(nextPixelCrop) => {
                              setPixelCrop(nextPixelCrop);
                            }}
                            aspect={COVER_ASPECT_RATIO}
                            keepSelection
                            ruleOfThirds
                            className="w-full"
                          >
                            <img
                              src={cropImageUrl}
                              alt="Crop preview"
                              onLoad={handleImageLoaded}
                              className="block max-h-[66vh] w-auto max-w-full"
                            />
                          </ReactCrop>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground text-center">
                          Drag the corners or move the crop to get the framing you
                          want.
                        </p>
                      </div>
                    </div>
                    <DialogFooter className="flex flex-row justify-end gap-3 border-t px-6 py-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleCropDialogOpenChange(false)}
                        disabled={isApplyingCrop}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          const source =
                            cropSource === "existing"
                              ? activeSourceRef.current
                              : pendingSourceRef.current;
                          if (source) {
                            applyCroppedImage(source);
                          } else {
                            toast.error("Select an image to crop first.");
                          }
                        }}
                        disabled={isApplyingCrop || !pixelCrop}
                        className="min-w-[120px]"
                      >
                        {isApplyingCrop ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
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
  );
}
