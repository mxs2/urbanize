import { api } from "./api";
import { DemandCategory, ImageTriage } from "@/types/demand";

export const uploadService = {
  image: (photo: { uri: string; name: string; type: string }, categoria?: DemandCategory): Promise<ImageTriage> =>
    api.uploadImage(photo, categoria),
};
