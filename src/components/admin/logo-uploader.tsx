"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateLogoUrlAction } from "@/lib/actions/settings";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

export function LogoUploader({ initialLogoUrl }: { initialLogoUrl: string | null }) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Format non supporté (PNG, JPEG, SVG ou WebP).");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Fichier trop volumineux (2 Mo maximum).");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const path = `logo-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("org-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("org-assets").getPublicUrl(path);

      const result = await updateLogoUrlAction(publicUrl);
      if (result.status === "error") {
        toast.error(result.message ?? "Échec de l'enregistrement.");
        return;
      }

      setLogoUrl(publicUrl);
      toast.success("Logo mis à jour.");
    } catch {
      toast.error("Échec du téléversement.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    const result = await updateLogoUrlAction(null);
    if (result.status === "error") {
      toast.error(result.message ?? "Échec de la suppression.");
      return;
    }
    setLogoUrl(null);
    toast.success("Logo supprimé.");
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Storage URL
          <img src={logoUrl} alt="Logo de l'organisation" className="size-full object-contain" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
        <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => inputRef.current?.click()}>
          {isUploading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}
          {logoUrl ? "Remplacer" : "Téléverser"}
        </Button>
        {logoUrl ? (
          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => void handleRemove()}>
            <Trash2 className="size-3.5" aria-hidden />
            Supprimer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
