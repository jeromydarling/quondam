// *** SWAP POINT ***
//
// This is the only file that needs to change when Lovable.app takes over the
// catalog database. In v1 we statically import the JSON committed in
// /catalog/catalog.json. To switch to a hosted DB, replace the body of
// loadCatalog() with a fetch() call. The rest of the app consumes
// useCatalog() and never knows the difference.

import type { Catalog } from "./types";
import catalogJson from "../../catalog/catalog.json";

export async function loadCatalog(): Promise<Catalog> {
  // Static import — instant, no network. Cast is safe because the JSON file
  // is validated against catalog/schema.json in CI.
  return catalogJson as Catalog;
}
