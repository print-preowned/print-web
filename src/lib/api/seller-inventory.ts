import { generateUrl } from ".";

export type PublicationLookup = {
  id: string;
  work_id: string;
  isbn13: string | null;
  title: string | null;
  image: string | null;
  language: string | null;
  productForm?: string | null;
  binding?: string | null;
  volume_number: number | null;
  edition: string | null;
  page_count: number | null;
  weight_grams: number | null;
  is_verified: boolean;
  status: string;
};

export type SellerInventoryCreatePayload = {
  publication_id?: string;
  isbn?: string;
  work_id?: string;
  title?: string;
  language?: string;
  product_form?: string;
  description?: string;
  offer: {
    price: string;
    stock: number;
    condition?: string;
    signed?: boolean;
    currency?: string;
    description?: string;
    image?: string;
  };
};

export function readPublicationByIsbn(isbn: string) {
  return generateUrl("/publications", { isbn });
}

export function readWorkPublications(workId: string) {
  return generateUrl(`/works/${workId}/publications`);
}

export function readPublicationOffers(publicationId: string) {
  return generateUrl(`/publications/${publicationId}/offers`);
}

export function createSellerInventory(payload: SellerInventoryCreatePayload) {
  return {
    endpoint: "/seller-inventory",
    method: "POST" as const,
    body: payload,
  };
}
