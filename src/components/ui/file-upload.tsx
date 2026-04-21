"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { FileUp, X, FileText, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
    value: string;
    onChange: (url: string) => void;
    onRemove: () => void;
    disabled?: boolean;
    /** Tipos aceptados. Default: PDF + imágenes comunes */
    accept?: string[];
}

export function FileUpload({
    value,
    onChange,
    onRemove,
    disabled,
    accept = ["pdf", "jpg", "jpeg", "png", "webp"],
}: FileUploadProps) {
    const onUpload = (result: any) => {
        onChange(result.info.secure_url);
    };

    const isImage = /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(value);
    const filename = value ? value.split("/").pop()?.split("?")[0] : "";

    return (
        <div className="space-y-2">
            {value ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <div className="shrink-0">
                        {isImage ? (
                            <ImageIcon className="h-5 w-5 text-brand-orange" />
                        ) : (
                            <FileText className="h-5 w-5 text-brand-orange" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{filename}</p>
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-brand-orange truncate block"
                        >
                            {value}
                        </a>
                    </div>
                    <Button
                        type="button"
                        onClick={onRemove}
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className="shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <CldUploadWidget
                    onSuccess={onUpload}
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "agencia_tours_dev"}
                    options={{
                        maxFiles: 1,
                        sources: ["local", "url"],
                        clientAllowedFormats: accept,
                        maxFileSize: 20_000_000, // 20 MB
                        resourceType: "auto",    // PDF → raw, imagen → image
                        folder: "likesinhouse/documentos",
                    }}
                >
                    {({ open }) => (
                        <Button
                            type="button"
                            disabled={disabled}
                            variant="outline"
                            onClick={(e) => {
                                e.preventDefault();
                                open();
                            }}
                            className="w-full h-24 border-dashed border-2 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-brand-orange hover:text-brand-orange"
                        >
                            <FileUp className="h-6 w-6" />
                            <span className="text-sm font-medium">Subir archivo</span>
                            <span className="text-xs opacity-75">
                                PDF o imagen · max 20 MB
                            </span>
                        </Button>
                    )}
                </CldUploadWidget>
            )}
        </div>
    );
}
