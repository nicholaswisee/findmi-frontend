import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminStore } from "@/store/adminStore";
import type { UploadedFile } from "@/types/types";

type ImageUploadPoolProps = {
  values?: string[];
  onChange?: (urls: string[]) => void;
  label?: string;
  description?: string;
};

export function ImageUploadPool({
  values,
  onChange,
  label = "Images",
  description = "Upload new media or reuse the latest uploads. You can also paste public URLs manually.",
}: ImageUploadPoolProps) {
  const uploadMedia = useAdminStore((state) => state.uploadMedia);
  const recentUploads = useAdminStore((state) => state.recentUploads);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");

  const selectedImages = values ?? [];

  const pushUrls = (urls: string[]) => {
    if (!urls.length) return;
    const current = values ?? [];
    const unique = [...current, ...urls].filter(Boolean);
    onChange?.(unique);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const uploaded = await uploadMedia(file);
        uploadedUrls.push(uploaded.url);
      }
      pushUrls(uploadedUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah berkas.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const next = selectedImages.filter((_, idx) => idx !== index);
    onChange?.(next);
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleManualAdd = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    pushUrls([trimmed]);
    setManualUrl("");
  };

  const handleUseRecent = (file: UploadedFile) => {
    pushUrls([file.url]);
  };

  const handleClearAll = () => {
    onChange?.([]);
  };

  return (
    <div className="space-y-4 md:col-span-2">
      <div className="space-y-1">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedImages.length > 0
              ? `Selected images (${selectedImages.length})`
              : "No images selected"}
          </p>
          {selectedImages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          )}
        </div>
        {selectedImages.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedImages.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="space-y-2 rounded-md border p-2"
              >
                <img
                  src={url}
                  alt={`Selected ${index + 1}`}
                  className="h-32 w-full rounded-md border object-cover"
                />
                <p className="text-xs text-muted-foreground break-all">
                  {url}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(url)}
                  >
                    Copy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada gambar dipilih.
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-md border p-3">
        <p className="text-sm font-medium">Tambah dari URL</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            placeholder="https://cdn.example.com/image.png"
            value={manualUrl}
            onChange={(event) => setManualUrl(event.target.value)}
          />
          <Button type="button" onClick={handleManualAdd} disabled={!manualUrl}>
            Tambahkan
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-md border p-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Upload baru</p>
          <p className="text-xs text-muted-foreground">
            Pilih satu atau beberapa gambar. URL akan dibuat otomatis.
          </p>
        </div>
        <Input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleFileSelect}
        />
        {uploading && (
          <p className="text-xs text-muted-foreground">Mengunggah...</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {recentUploads.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Unggahan terbaru</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {recentUploads.map((file) => (
              <button
                key={file.url}
                type="button"
                className="flex items-center gap-3 rounded-md border p-2 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                onClick={() => handleUseRecent(file)}
              >
                <img
                  src={file.url}
                  alt={file.filename}
                  className="h-16 w-16 rounded-md border object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">
                    {file.filename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
