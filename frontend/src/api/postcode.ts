import client from "./client";

export interface PostcodeLookupResult {
  valid: boolean;
  postcode: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
}

export async function lookupPostcode(postcode: string): Promise<PostcodeLookupResult> {
  const { data } = await client.get<PostcodeLookupResult>("/postcode-lookup/", {
    params: { postcode },
  });
  return data;
}
