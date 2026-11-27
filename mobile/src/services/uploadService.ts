import { api, PhotoUpload } from "./api";
import { DemandCategory, ImageTriage } from "@/types/demand";

export const uploadService = {
  image: (photo: PhotoUpload, categoria?: DemandCategory): Promise<ImageTriage> =>
    api.uploadImage(photo, categoria),
};
