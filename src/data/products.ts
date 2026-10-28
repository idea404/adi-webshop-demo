export interface Product {
  id: string;
  name: string;
  origin: string;
  process: string;
  notes: string[];
  weight: string;
  price: number; // USD cents
  art: string; // CSS background for the label plate
  ink: string; // text colour that reads on `art`
}

/**
 * The catalogue is deliberately static: the point of the demo is the payment
 * step, not a CMS. Prices are integer cents so nothing rounding-sensitive ever
 * touches a float.
 */
export const PRODUCTS: Product[] = [
  {
    id: "yirgacheffe",
    name: "Yirgacheffe",
    origin: "Ethiopia",
    process: "Washed",
    notes: ["Jasmine", "Bergamot", "White peach"],
    weight: "250 g",
    price: 1800,
    art: "linear-gradient(155deg, #0b1438 0%, #013cff 58%, #3f67ed 100%)",
    ink: "#fffdFA",
  },
  {
    id: "guji",
    name: "Guji Highlands",
    origin: "Ethiopia",
    process: "Natural",
    notes: ["Blueberry", "Cocoa nib", "Molasses"],
    weight: "250 g",
    price: 1900,
    art: "linear-gradient(155deg, #3e000d 0%, #7a1a12 55%, #ff710a 100%)",
    ink: "#fff9e1",
  },
  {
    id: "huila",
    name: "Huila",
    origin: "Colombia",
    process: "Washed",
    notes: ["Red apple", "Caramel", "Citrus zest"],
    weight: "250 g",
    price: 1700,
    art: "linear-gradient(155deg, #1b2450 0%, #3e000d 60%, #b3452a 100%)",
    ink: "#fffdFA",
  },
  {
    id: "antigua",
    name: "Antigua",
    origin: "Guatemala",
    process: "Washed",
    notes: ["Dark chocolate", "Orange peel", "Almond"],
    weight: "250 g",
    price: 1650,
    art: "linear-gradient(155deg, #030712 0%, #1b2450 55%, #3f67ed 100%)",
    ink: "#fff9e1",
  },
];

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}
