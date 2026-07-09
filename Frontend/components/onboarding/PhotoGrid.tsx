import { View } from "react-native";
import { PhotoUploadCell } from "./PhotoUploadCell";

export type PhotoEntry = { path: string; url: string };

export type PhotoGridProps = {
  photos: PhotoEntry[];
  maxPhotos?: number;
  /** Index currently uploading (spinner on the next empty cell), or null. */
  uploading?: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

/** 3×3 photo grid (Figma 1288:5160): filled thumbnails, one active upload cell, dashed placeholders. */
export function PhotoGrid({ photos, maxPhotos = 9, uploading, onAdd, onRemove }: PhotoGridProps) {
  const emptyCount = Math.max(0, maxPhotos - photos.length);

  return (
    <View className="flex-row flex-wrap justify-between gap-y-3">
      {photos.map((photo, i) => (
        <PhotoUploadCell key={photo.path} uri={photo.url} onAdd={onAdd} onRemove={() => onRemove(i)} />
      ))}
      {Array.from({ length: emptyCount }).map((_, i) => (
        <PhotoUploadCell key={`empty-${i}`} uploading={uploading && i === 0} onAdd={onAdd} />
      ))}
    </View>
  );
}
