import { ImageIcon } from "lucide-react";
import type { getProductPhoto } from "../utils/storefrontPhotos";

type Props = {
  photo: ReturnType<typeof getProductPhoto>;
  eager?: boolean;
};

export default function StorefrontPhoto({ photo, eager }: Props) {
  if (!photo) return <ImageIcon className="size-6 text-stone-400" aria-hidden="true" />;

  return (
    <img key={photo.src} src={photo.src} alt="" loading={eager ? "eager" : "lazy"} decoding="async"
      className={photo.cover ? "store-photo-cover" : undefined}
      onError={event => {
        if (photo.src !== photo.original && event.currentTarget.getAttribute("src") !== photo.original) {
          event.currentTarget.src = photo.original;
        }
      }} />
  );
}
