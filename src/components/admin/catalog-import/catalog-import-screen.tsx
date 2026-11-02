"use client";

import { CatalogAccessGate } from "./catalog-access-gate";
import { CatalogInbox } from "./catalog-inbox";
import { CatalogReview } from "./catalog-review";

export function CatalogImportScreen() {
  return <CatalogAccessGate>{(status) => <CatalogInbox status={status} />}</CatalogAccessGate>;
}

export function CatalogReviewScreen({ importTourId }: { importTourId: string }) {
  return <CatalogAccessGate>{() => <CatalogReview importTourId={importTourId} />}</CatalogAccessGate>;
}
