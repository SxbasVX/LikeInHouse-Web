"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    value: string;
    onChange: (url: string, publicId: string) => void;
    onRemove: () => void;
    disabled?: boolean;
}

export function ImageUpload({ value, onChange, onRemove, disabled }: ImageUploadProps) {
    const onUpload = (result: any) => {
        // Cloudinary returns the secure_url and public_id
        onChange(result.info.secure_url, result.info.public_id);
    };

    return (
        <div className="space-y-4 w-full flex flex-col items-center sm:items-start justify-center">
            {value && (
                <div className="relative w-[200px] h-[200px] rounded-md overflow-hidden border">
                    <div className="z-10 absolute top-2 right-2">
                        <Button type="button" onClick={onRemove} variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <Image
                        fill
                        className="object-cover"
                        alt="Image Preview"
                        src={value}
                    />
                </div>
            )}

            {!value && (
                <CldUploadWidget
                    onSuccess={onUpload}
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "agencia_tours_dev"}
                    options={{
                        maxFiles: 1,
                        sources: ["local", "url", "camera"],
                        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
                        maxImageFileSize: 10000000,
                        folder: "likesinhouse",
                    }}
                >
                    {({ open }) => {
                        const onClick = (e: React.MouseEvent) => {
                            e.preventDefault();
                            open();
                        };

                        return (
                            <Button
                                type="button"
                                disabled={disabled}
                                variant="secondary"
                                onClick={onClick}
                                className="w-full sm:w-[200px] h-[100px] border-dashed border-2 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-muted-foreground"
                            >
                                <ImagePlus className="h-8 w-8 mb-2" />
                                Subir Imagen
                            </Button>
                        );
                    }}
                </CldUploadWidget>
            )}
        </div>
    );
}
