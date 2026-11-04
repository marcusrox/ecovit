import type {
  Project,
  ReferenceImage,
  CustomImageAsset,
} from "../domain/project";
import { withoutResult } from "../domain/project";

export type RemoteProject = Omit<Project, "model"> & {
  model: Omit<Project["model"], "referenceImages" | "customImageAssets"> & {
    referenceImages: (Omit<ReferenceImage, "data"> & { resourceId: string })[];
    customImageAssets: (Omit<CustomImageAsset, "data"> & {
      resourceId: string;
    })[];
  };
};
export function images(doc: Project) {
  return [
    ...doc.model.referenceImages.map((image) => ({
      key: `reference:${image.floorId}`,
      image,
    })),
    ...doc.model.customImageAssets.map((image) => ({
      key: `custom:${image.id}`,
      image,
    })),
  ];
}
export function dehydrate(
  doc: Project,
  resources: Record<string, string>,
): RemoteProject {
  const clean = withoutResult(doc);
  const strip = <T extends { data: string }>(image: T): Omit<T, "data"> => {
    const { data, ...rest } = image;
    void data;
    return rest;
  };
  return {
    ...clean,
    model: {
      ...clean.model,
      referenceImages: clean.model.referenceImages.map((image) => ({
        ...strip(image),
        resourceId: resources[`reference:${image.floorId}`],
      })),
      customImageAssets: clean.model.customImageAssets.map((image) => ({
        ...strip(image),
        resourceId: resources[`custom:${image.id}`],
      })),
    },
  };
}
export function hydrate(
  doc: RemoteProject,
  resources: Record<string, string>,
): Project {
  return {
    ...doc,
    model: {
      ...doc.model,
      referenceImages: doc.model.referenceImages.map(
        ({ resourceId, ...image }) => ({
          ...image,
          data: resources[resourceId],
        }),
      ),
      customImageAssets: doc.model.customImageAssets.map(
        ({ resourceId, ...image }) => ({
          ...image,
          data: resources[resourceId],
        }),
      ),
    },
  };
}
export function resourceIds(doc: RemoteProject): string[] {
  return [
    ...new Set(
      [...doc.model.referenceImages, ...doc.model.customImageAssets].map(
        (image) => image.resourceId,
      ),
    ),
  ];
}
export function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
    .join(",")}}`;
}
