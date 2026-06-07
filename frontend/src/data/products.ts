import prod1 from "../assets/prod-1.png";
import prod2 from "../assets/prod-2.png";
import prod3 from "../assets/prod-3.png";
import prod4 from "../assets/prod-4.png";
import prod5 from "../assets/prod-5.png";
import prod6 from "../assets/prod-6.png";
import prod7 from "../assets/prod-7.png";
import prod8 from "../assets/prod-8.png";
import prod9 from "../assets/prod-9.png";
import prod10 from "../assets/prod-10.png";
import prod11 from "../assets/prod-11.png";
import prod12 from "../assets/prod-12.png";
import prod13 from "../assets/prod-13.png";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  badge: string | null;
  bestSeller: boolean;
  bestColor: string;
}

export const allProducts: Product[] = [
  { id: 1,  name: "Black Oversized Tee",         price: 299,  image: prod1,  category: "T-Shirts",    badge: "NEW",  bestSeller: true,  bestColor: "Black"  },
  { id: 2,  name: "Cargo Pants",                  price: 599,  image: prod2,  category: "Pants",        badge: null,   bestSeller: false, bestColor: "Khaki"  },
  { id: 3,  name: "Neon Accent Hoodie",            price: 749,  image: prod3,  category: "Hoodies",      badge: "SALE", bestSeller: true,  bestColor: "Green"  },
  { id: 4,  name: "Classic White Tee",             price: 199,  image: prod4,  category: "T-Shirts",    badge: null,   bestSeller: true,  bestColor: "White"  },
  { id: 5,  name: "Slim Fit Jeans",                price: 549,  image: prod5,  category: "Pants",        badge: "NEW",  bestSeller: false, bestColor: "Blue"   },
  { id: 6,  name: "Urban Zip Hoodie",              price: 699,  image: prod6,  category: "Hoodies",      badge: null,   bestSeller: false, bestColor: "Grey"   },
  { id: 7,  name: "Jogger Pants",                  price: 449,  image: prod7,  category: "Pants",        badge: "SALE", bestSeller: false, bestColor: "Black"  },
  { id: 8,  name: "Accessories Cap",               price: 249,  image: prod8,  category: "Accessories",  badge: null,   bestSeller: true,  bestColor: "Black"  },
  { id: 9,  name: "Techwear Utility Jacket",       price: 899,  image: prod9,  category: "Hoodies",      badge: "NEW",  bestSeller: false, bestColor: "Olive"  },
  { id: 10, name: "Vintage Wash Graphic Tee",      price: 349,  image: prod10, category: "T-Shirts",    badge: null,   bestSeller: false, bestColor: "Beige"  },
  { id: 11, name: "Chunky Streetwear Sneakers",    price: 1299, image: prod11, category: "Accessories",  badge: "SALE", bestSeller: true,  bestColor: "White"  },
  { id: 12, name: "Crossbody Utility Bag",         price: 399,  image: prod12, category: "Accessories",  badge: null,   bestSeller: false, bestColor: "Black"  },
  { id: 13, name: "Beanie Hat Embroidered Logo",   price: 199,  image: prod13, category: "Accessories",  badge: "NEW",  bestSeller: false, bestColor: "Navy"   },
  { id: 14, name: "Essential Grey Hoodie",         price: 649,  image: prod8,  category: "Hoodies",      badge: null,   bestSeller: false, bestColor: "Grey"   },
  { id: 15, name: "Distressed Denim",              price: 699,  image: prod5,  category: "Pants",        badge: "SALE", bestSeller: false, bestColor: "Blue"   },
  { id: 16, name: "Logo Print Tee",                price: 259,  image: prod1,  category: "T-Shirts",    badge: null,   bestSeller: false, bestColor: "Black"  },
];
