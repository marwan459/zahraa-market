export interface Product {
  id: string;
  name: string;
  nameAr: string;
  categoryId: string;
  subcategory: string;
  subcategoryId?: string;
  subcategoryAr: string;
  price: number;
  originalPrice?: number;
  unit: string;
  unitAr: string;
  image: string;
  inStock: boolean;
  stockCount?: number;
  isPopular?: boolean;
  isOffer?: boolean;
  talabatUrl: string;
  descriptionAr: string;
  rating?: number;
  barcode?: string;
}

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  subcategories: {
    id: string;
    name: string;
    nameAr: string;
    talabatUrl: string;
  }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerOrderInfo {
  fullName: string;
  phoneNumber: string;
  address: string;
  buildingNo?: string;
  floorNo?: string;
  apartmentNo?: string;
  landmark?: string;
  notes?: string;
  paymentMethod: 'cash' | 'instapay' | 'vodafone_cash' | 'card_on_delivery';
  transferProofImage?: string;
  transferRefNumber?: string;
  isSmsReceiptConfirmed?: boolean;
}

export interface OrderRecord {
  id: string;
  orderId?: string;
  createdAt: string;
  date?: string;
  customer: CustomerOrderInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  grandTotal: number;
  total?: number;
  status: 'pending' | 'preparing' | 'on_the_way' | 'delivered';
}
