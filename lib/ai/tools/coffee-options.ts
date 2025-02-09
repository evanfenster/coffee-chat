import { tool } from 'ai';
import { z } from 'zod';
import { COFFEE_OPTIONS } from '@/lib/coffee/options';

interface CoffeeProduct {
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

const STOREFRONT_ACCESS_TOKEN = 'cb22191c12785bc8a2dec70a02efc2fb';
const GRAPHQL_ENDPOINT = 'https://drinktrade.myshopify.com/api/2023-07/graphql.json';

const buildGraphQLQuery = (filters?: z.infer<typeof toolParameters>['filters']) => {
  return `
    query getProductsOfProductTypeInCollection($handle: String!) {
      collection(handle: $handle) {
        products(
          filters: [
            ${filters?.roastLevels?.map((level: string) => `{
              productMetafield: {
                key: "roast_level",
                value: "${level}",
                namespace: "custom"
              }
            }`).join(',') || ''}
            ${filters?.tasteTypes?.map((type: string) => `{
              productMetafield: {
                key: "taste_type",
                value: "${type}",
                namespace: "custom"
              }
            }`).join(',') || ''}
            ${filters?.regions?.map((region: string) => `{
              productMetafield: {
                key: "region_of_origin",
                value: "${region}",
                namespace: "custom"
              }
            }`).join(',') || ''}
            ${filters?.origins?.map((origin: string) => `{
              productMetafield: {
                key: "origin",
                value: "${origin}",
                namespace: "custom"
              }
            }`).join(',') || ''}
            ${filters?.roasters?.map((roaster: string) => `{
              productMetafield: {
                key: "roaster",
                value: "${roaster}",
                namespace: "custom"
              }
            }`).join(',') || ''}
            ${filters?.processes?.map((process: string) => `{
              productMetafield: {
                key: "process",
                value: "${process}",
                namespace: "custom"
              }
            }`).join(',') || ''}
            ${filters?.certifications?.map((cert: string) => `{
              productMetafield: {
                key: "certification",
                value: "${cert}",
                namespace: "custom"
              }
            }`).join(',') || ''}
            ${filters?.tastingNotes?.map((note: string) => `{
              productMetafield: {
                key: "flavor_wheel_primary",
                value: "${note}",
                namespace: "custom"
              }
            }`).join(',') || ''}
          ],
          sortKey: MANUAL,
          first: 1
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

const toolParameters = z.object({
  filters: z.object({
    roastLevels: z.array(z.enum(COFFEE_OPTIONS.roastLevels)).optional(),
    tastingNotes: z.array(z.enum(COFFEE_OPTIONS.tastingNotes)).optional(),
    regions: z.array(z.enum(COFFEE_OPTIONS.regions)).optional(),
    origins: z.array(z.enum(COFFEE_OPTIONS.origins)).optional(),
    roasters: z.array(z.enum(COFFEE_OPTIONS.roasters)).optional(),
    processes: z.array(z.enum(COFFEE_OPTIONS.processes)).optional(),
    certifications: z.array(z.enum(COFFEE_OPTIONS.certifications)).optional(),
    tasteTypes: z.array(z.enum(COFFEE_OPTIONS.tasteTypes)).optional(),
  }).optional(),
});

export const getCoffeeOptions = tool({
  description: 'Get information about available coffee options and filtered results from Trade Coffee',
  parameters: toolParameters,
  execute: async ({ filters }) => {
    try {
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

      const products: CoffeeProduct[] = data.data.collection.products.nodes.map((product: any) => ({
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
        totalResults: products.length,
        products,
        appliedFilters: filters || {},
        availableOptions: {
          roastLevels: { count: COFFEE_OPTIONS.roastLevels.length, options: COFFEE_OPTIONS.roastLevels },
          tastingNotes: { count: COFFEE_OPTIONS.tastingNotes.length, options: COFFEE_OPTIONS.tastingNotes },
          regions: { count: COFFEE_OPTIONS.regions.length, options: COFFEE_OPTIONS.regions },
          origins: { count: COFFEE_OPTIONS.origins.length, options: COFFEE_OPTIONS.origins },
          roasters: { count: COFFEE_OPTIONS.roasters.length, options: COFFEE_OPTIONS.roasters },
          processes: { count: COFFEE_OPTIONS.processes.length, options: COFFEE_OPTIONS.processes },
          certifications: { count: COFFEE_OPTIONS.certifications.length, options: COFFEE_OPTIONS.certifications },
          tasteTypes: { count: COFFEE_OPTIONS.tasteTypes.length, options: COFFEE_OPTIONS.tasteTypes },
        }
      };
    } catch (error) {
      return {
        error: 'Failed to fetch coffee options',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        appliedFilters: filters || {},
        availableOptions: {
          roastLevels: { count: COFFEE_OPTIONS.roastLevels.length, options: COFFEE_OPTIONS.roastLevels },
          tastingNotes: { count: COFFEE_OPTIONS.tastingNotes.length, options: COFFEE_OPTIONS.tastingNotes },
          regions: { count: COFFEE_OPTIONS.regions.length, options: COFFEE_OPTIONS.regions },
          origins: { count: COFFEE_OPTIONS.origins.length, options: COFFEE_OPTIONS.origins },
          roasters: { count: COFFEE_OPTIONS.roasters.length, options: COFFEE_OPTIONS.roasters },
          processes: { count: COFFEE_OPTIONS.processes.length, options: COFFEE_OPTIONS.processes },
          certifications: { count: COFFEE_OPTIONS.certifications.length, options: COFFEE_OPTIONS.certifications },
          tasteTypes: { count: COFFEE_OPTIONS.tasteTypes.length, options: COFFEE_OPTIONS.tasteTypes },
        }
      };
    }
  },
}); 