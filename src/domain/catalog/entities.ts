// Shared shapes for the catalog domain core. Kept to exactly the fields the domain rules need:
// callers (the db layer) may know more about a Category or Product, but the domain core doesn't.

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
}
