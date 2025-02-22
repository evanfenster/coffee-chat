import { z } from 'zod';
import { COFFEE_OPTIONS } from './options';
import { getCoffeeFiltersByChatId } from '@/lib/db/queries';

const STOREFRONT_ACCESS_TOKEN = 'cb22191c12785bc8a2dec70a02efc2fb';
const GRAPHQL_ENDPOINT = 'https://drinktrade.myshopify.com/api/2023-07/graphql.json';

export interface Product {
  name: string;
  vendor: string;
  handle: string;
  roastLevel?: string;
  type?: string;
  tasteType?: string;
  process?: string;
  origin?: string;
  region?: string;
  certifications?: string[];
  tastingNotes?: string[];
  price: string;
  available: boolean;
  imageUrl?: string;
}

export const coffeeFilterSchema = z.object({
  roastLevels: z.array(z.enum(COFFEE_OPTIONS.roastLevels)).optional(),
  tastingNotes: z.array(z.enum(COFFEE_OPTIONS.tastingNotes)).optional(),
  regions: z.array(z.enum(COFFEE_OPTIONS.regions)).optional(),
  origins: z.array(z.enum(COFFEE_OPTIONS.origins)).optional(),
  roasters: z.array(z.enum(COFFEE_OPTIONS.roasters)).optional(),
  processes: z.array(z.enum(COFFEE_OPTIONS.processes)).optional(),
  certifications: z.array(z.enum(COFFEE_OPTIONS.certifications)).optional(),
  tasteTypes: z.array(z.enum(COFFEE_OPTIONS.tasteTypes)).optional(),
});

export type CoffeeFilters = z.infer<typeof coffeeFilterSchema>;

const buildGraphQLQuery = (filters?: Record<string, string[]>) => {
  const filterMappings = {
    roastLevels: { key: 'roast_level' },
    tasteTypes: { key: 'taste_type' },
    regions: { key: 'region_of_origin' },
    origins: { key: 'origin' },
    roasters: { key: 'roaster' },
    processes: { key: 'process' },
    certifications: { key: 'certification' },
    tastingNotes: { key: 'flavor_wheel_primary' },
  };

  const filterStrings = Object.entries(filters || {}).map(([category, values]) => {
    const mapping = filterMappings[category as keyof typeof filterMappings];
    if (!mapping || !values?.length) return '';

    return values.map((value: string) => `{
      productMetafield: {
        key: "${mapping.key}",
        value: "${value}",
        namespace: "custom"
      }
    }`).join(',');
  }).filter(Boolean);

  return `
    query getProductsOfProductTypeInCollection($handle: String!) {
      collection(handle: $handle) {
        products(
          filters: [
            ${filterStrings.join(',\n')}
          ],
          sortKey: MANUAL,
          first: 30
        ) {
          nodes {
            title
            handle
            vendor
            productType
            variants(first: 1) {
              nodes {
                availableForSale
                price {
                  amount
                  currencyCode
                }
              }
            }
            taste_type: metafield(namespace: "custom", key: "taste_type") {
              value
            }
            roast_level: metafield(namespace: "custom", key: "roast_level") {
              value
            }
            process: metafield(namespace: "custom", key: "process") {
              value
            }
            origin: metafield(namespace: "custom", key: "origin") {
              value
            }
            region: metafield(namespace: "custom", key: "region_of_origin") {
              value
            }
            certifications: metafield(namespace: "custom", key: "certification") {
              value
            }
            tasting_notes: metafield(namespace: "custom", key: "flavor_wheel_primary") {
              value
            }
            media(first: 1) {
              nodes {
                previewImage {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;
};

export interface CoffeeResponse {
  products: Product[];
  appliedFilters: Record<string, unknown>;
  error?: string;
}

export async function getCoffeeProducts(chatId: string): Promise<CoffeeResponse> {
  try {
    const filters = await getCoffeeFiltersByChatId({ chatId }) || {};
    const query = buildGraphQLQuery(filters);
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN
      },
      body: JSON.stringify({
        query,
        variables: { handle: "all" }
      })
    });

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    const products: Product[] = data.data.collection.products.nodes.map((product: any) => ({
      name: product.title,
      handle: product.handle,
      vendor: product.vendor,
      roastLevel: product.roast_level?.value,
      type: product.productType,
      tasteType: product.taste_type?.value,
      process: product.process?.value,
      origin: product.origin?.value,
      region: product.region?.value,
      certifications: product.certifications?.value?.split(','),
      tastingNotes: product.tasting_notes?.value?.split(','),
      price: product.variants.nodes[0]?.price.amount,
      available: product.variants.nodes[0]?.availableForSale,
      imageUrl: product.media.nodes[0]?.previewImage.url
    }));

    return {
      products,
      appliedFilters: filters,
    };
  } catch (error) {
    return {
      products: [],
      appliedFilters: {},
      error: error instanceof Error ? error.message : 'Failed to fetch coffee options'
    };
  }
} 