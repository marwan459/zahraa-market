import { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'fruit-veg',
    name: 'Fruits & Vegetables',
    nameAr: 'خضروات وفواكه',
    icon: 'Apple',
    subcategories: [
      {
        id: 'dates-dried-fruit',
        name: 'Dates & Dried Fruit',
        nameAr: 'تمور وفواكه مجففة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/fruit-veg/dcff5a2e-fd18-46fc-815c-310abff85fd5/dates-dried-fruit/45ae49c4-020e-45b7-898f-0ba099354197?aid=8091'
      }
    ]
  },
  {
    id: 'bakery',
    name: 'Bakery',
    nameAr: 'المخبوزات والمعجنات',
    icon: 'Croissant',
    subcategories: [
      {
        id: 'flatbread',
        name: 'Flatbread',
        nameAr: 'خبز وعيش مسطح',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/bakery/2ff38137-63c0-467f-86db-3f570b0259c6/flatbread/75564f16-02f8-41a2-919a-cb5ed539e33f?aid=8091'
      },
      {
        id: 'fresh-bakes-pastries',
        name: 'Fresh Bakes & Cakes',
        nameAr: 'كيك وحلويات طازجة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/bakery/2ff38137-63c0-467f-86db-3f570b0259c6/fresh-bakes-pastries/65b1326a-6c48-47cd-ad8d-cc019a8aa727?aid=8091'
      },
      {
        id: 'pastries',
        name: 'Pastries & Pies',
        nameAr: 'فطائر وكرواسون وسندوتشات',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/bakery/2ff38137-63c0-467f-86db-3f570b0259c6/pastries/52a0c97b-8305-4918-af36-f7f13db5e0d7?aid=8091'
      },
      {
        id: 'crispbread-rusk',
        name: 'Crispbread & Rusk',
        nameAr: 'بقسماط وتوست ومقرمشات',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/bakery/2ff38137-63c0-467f-86db-3f570b0259c6/crispbread-rusk/87945b42-baff-43b3-80bc-6cf0a7cf3110?aid=8091'
      }
    ]
  },
  {
    id: 'poultry-meat-seafood',
    name: 'Poultry, Meat & Seafood',
    nameAr: 'دواجن ولحوم وأسماك',
    icon: 'Beef',
    subcategories: [
      {
        id: 'chicken-poultry',
        name: 'Chicken & Poultry',
        nameAr: 'دجاج ومصنعات الدواجن',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/poultry-meat-seafood/296dd5a1-1810-471a-87c3-91f313157aca/chicken-poultry/11b107f5-fa34-4941-8fe0-1f42b8b07f72?aid=8091'
      },
      {
        id: 'fish-seafood',
        name: 'Fish & Seafood',
        nameAr: 'أسماك ومأكولات بحرية',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/poultry-meat-seafood/296dd5a1-1810-471a-87c3-91f313157aca/fish-seafood/d2f1c184-23f1-4752-bcac-e478155d89c4?aid=8091'
      }
    ]
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    nameAr: 'ألبان وأجبان وبيض',
    icon: 'Egg',
    subcategories: [
      {
        id: 'cheese',
        name: 'Cheese',
        nameAr: 'أجبان متنوعة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/dairy-eggs/35d23d13-5ca1-43f3-897e-cd06436b847e/cheese/0eeb680a-1c34-4d24-8efd-a97a3d1dfe6e?aid=8091'
      },
      {
        id: 'yoghurts-labneh',
        name: 'Yoghurts & Labneh',
        nameAr: 'زبادي ولبنة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/dairy-eggs/35d23d13-5ca1-43f3-897e-cd06436b847e/yoghurts-labneh/3162ee64-facd-4ea8-99fa-d89981f8774d?aid=8091'
      },
      {
        id: 'butter',
        name: 'Butter & Creams',
        nameAr: 'زبدة وقشطة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/dairy-eggs/35d23d13-5ca1-43f3-897e-cd06436b847e/butter/1b89e702-eb0d-44c2-872e-b5def503ed9f?aid=8091'
      },
      {
        id: 'chilled-desserts',
        name: 'Chilled Desserts',
        nameAr: 'حلويات مبردة ودانيت',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/dairy-eggs/35d23d13-5ca1-43f3-897e-cd06436b847e/chilled-desserts/3ff1cb0d-90fc-47a9-9d63-456df8600d1d?aid=8091'
      }
    ]
  },
  {
    id: 'beverages',
    name: 'Beverages',
    nameAr: 'مشروبات وعصائر',
    icon: 'CupSoda',
    subcategories: [
      {
        id: 'water',
        name: 'Water',
        nameAr: 'مياه معدنية وشرب',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/beverages/be5066af-7eb9-46a9-8ce4-1a158dbe526a/water/8125b0cc-b50a-46ed-b30f-33592bf3457c?aid=8091'
      },
      {
        id: 'soft-drinks',
        name: 'Soft Drinks',
        nameAr: 'مشروبات غازية',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/beverages/be5066af-7eb9-46a9-8ce4-1a158dbe526a/soft-drinks/65f0ca6b-ff7b-474e-b3ab-da34fd5a41cc?aid=8091'
      },
      {
        id: 'sports-energy-drinks',
        name: 'Sports & Energy Drinks',
        nameAr: 'مشروبات طاقة ورياضية',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/beverages/be5066af-7eb9-46a9-8ce4-1a158dbe526a/sports-energy-drinks/8f641f79-5ab4-4e82-86b4-6f0b65877ec5?aid=8091'
      },
      {
        id: 'juices',
        name: 'Juices',
        nameAr: 'عصائر طبيعية ومشروبات فاكهة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/beverages/be5066af-7eb9-46a9-8ce4-1a158dbe526a/juices/5a64bc69-cb19-483c-b59d-d8bdfcd75e5a?aid=8091'
      },
      {
        id: 'specialty-drinks',
        name: 'Specialty Drinks',
        nameAr: 'مشروبات تراثية وخاصة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/beverages/be5066af-7eb9-46a9-8ce4-1a158dbe526a/specialty-drinks/1ef3c71f-861d-4925-9ba8-99053b30e207?aid=8091'
      },
      {
        id: 'powdered-drinks',
        name: 'Powdered Drinks',
        nameAr: 'مشروبات سريعة التحضير وبودرة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/beverages/be5066af-7eb9-46a9-8ce4-1a158dbe526a/powdered-drinks/bd84deb1-280d-464c-b192-41e10c330f5c?aid=8091'
      }
    ]
  },
  {
    id: 'milk',
    name: 'Milk',
    nameAr: 'حليب وألبان',
    icon: 'Milk',
    subcategories: [
      {
        id: 'fresh-milk',
        name: 'Fresh Milk',
        nameAr: 'حليب طازج',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/milk/1759e4df-5d85-4c57-b6dd-a68e2cb00a98/fresh-milk/b5160366-8e66-4f4e-97d5-4ff18bc12606?aid=8091'
      },
      {
        id: 'long-life-milk',
        name: 'Long Life Milk',
        nameAr: 'حليب طويل الأجل معقم',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/milk/1759e4df-5d85-4c57-b6dd-a68e2cb00a98/long-life-milk/5988d27c-51fc-47cb-b1f5-04dc9a8d952e?aid=8091'
      },
      {
        id: 'powdered-milk',
        name: 'Powdered Milk',
        nameAr: 'حليب بودرة مجفف',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/milk/1759e4df-5d85-4c57-b6dd-a68e2cb00a98/powdered-milk/92762733-0131-429c-aec9-1f9062af6b53?aid=8091'
      },
      {
        id: 'condensed-milk',
        name: 'Condensed Milk',
        nameAr: 'حليب مكثف ومبخر',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/milk/1759e4df-5d85-4c57-b6dd-a68e2cb00a98/condensed-milk/a3122906-0318-45ff-b054-7da3eaf71ea0?aid=8091'
      }
    ]
  },
  {
    id: 'snacks-chocolate',
    name: 'Snacks & Chocolate',
    nameAr: 'تسالي وشوكولاتة',
    icon: 'Candy',
    subcategories: [
      {
        id: 'chocolate',
        name: 'Chocolate',
        nameAr: 'شوكولاتة فاخرة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/snacks-chocolate/e6f6463c-023d-4a44-aca2-45775470ff42/chocolate/72a68360-9963-4ac4-928b-fac9767ff00d?aid=8091'
      },
      {
        id: 'biscuits',
        name: 'Biscuits',
        nameAr: 'بسكويت وويفر',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/snacks-chocolate/e6f6463c-023d-4a44-aca2-45775470ff42/biscuits/184967bb-fb17-47d6-806d-fff082ddd686?aid=8091'
      },
      {
        id: 'chips-dips',
        name: 'Chips & Dips',
        nameAr: 'شيبس ومقرمشات',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/snacks-chocolate/e6f6463c-023d-4a44-aca2-45775470ff42/chips-dips/1ea8322b-b6c3-404f-8772-42ae6da71dee?aid=8091'
      },
      {
        id: 'seeds-nuts',
        name: 'Seeds & Nuts',
        nameAr: 'مكسرات وتسالي ولب',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/snacks-chocolate/e6f6463c-023d-4a44-aca2-45775470ff42/seeds-nuts/a12ac67d-b4bb-4fbc-ad7f-353802fdcc20?aid=8091'
      },
      {
        id: 'popcorn',
        name: 'Popcorn',
        nameAr: 'فشار ومسليات ذرة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/snacks-chocolate/e6f6463c-023d-4a44-aca2-45775470ff42/popcorn/45bc2229-44b8-4b02-b725-cae04a4ea408?aid=8091'
      },
      {
        id: 'candy-gums',
        name: 'Candy & Gums',
        nameAr: 'حلوى ولبان',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/snacks-chocolate/e6f6463c-023d-4a44-aca2-45775470ff42/candy-gums/11b480f8-afca-4c52-be2c-bb028f843f8e?aid=8091'
      },
      {
        id: 'crackers-pretzels',
        name: 'Crackers & Pretzels',
        nameAr: 'مقرمشات ومملحات',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/snacks-chocolate/e6f6463c-023d-4a44-aca2-45775470ff42/crackers-pretzels/d812e27c-1a5d-4a5f-bb2c-188b959d9c64?aid=8091'
      }
    ]
  },
  {
    id: 'ice-cream',
    name: 'Ice Cream',
    nameAr: 'أيس كريم ومثلجات',
    icon: 'IceCreamBowl',
    subcategories: [
      {
        id: 'bars-cones-sticks',
        name: 'Bars, Cones & Sticks',
        nameAr: 'ستيك وكونو وبارات',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/ice-cream/633e13eb-1f02-43f8-8ebb-278e2d2bc8f9/bars-cones-sticks/a4a022aa-9ebc-4212-b89a-f324ab65337f?aid=8091'
      },
      {
        id: 'cups-tubs',
        name: 'Cups & Tubs',
        nameAr: 'علب وكاسات عائلية',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/ice-cream/633e13eb-1f02-43f8-8ebb-278e2d2bc8f9/cups-tubs/14d0c614-7717-44a5-8bd1-277fb2d932c2?aid=8091'
      }
    ]
  },
  {
    id: 'frozen-food',
    name: 'Frozen Food',
    nameAr: 'أغذية ومجمدات',
    icon: 'Snowflake',
    subcategories: [
      {
        id: 'ready-meals',
        name: 'Ready Meals',
        nameAr: 'وجبات نصف مطهوة ومجمدة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/frozen-food/924cf796-3524-4c2b-9f35-aa33a52a2955/ready-meals/ae93505f-0fa3-41fe-851e-9a120bdbafb5?aid=8091'
      },
      {
        id: 'fruit-and-veg',
        name: 'Frozen Fruit & Veg',
        nameAr: 'خضروات وفواكه مجمدة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/frozen-food/924cf796-3524-4c2b-9f35-aa33a52a2955/fruit-and-veg/91cea49c-ac90-4b47-95c9-e803cf55c5b1?aid=8091'
      }
    ]
  },
  {
    id: 'coffee-tea',
    name: 'Coffee & Tea',
    nameAr: 'قهوة وشاي ومنبهات',
    icon: 'Coffee',
    subcategories: [
      {
        id: 'coffee',
        name: 'Coffee',
        nameAr: 'بن وقهوة سريعة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/coffee-tea/670276f4-70ca-48c3-9875-c94929908f18/coffee/431abcc9-639d-4bb9-a4f4-3c32fa2454ce?aid=8091'
      },
      {
        id: 'tea',
        name: 'Tea',
        nameAr: 'شاي وأعشاب طبيعية',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/coffee-tea/670276f4-70ca-48c3-9875-c94929908f18/tea/97a36a5b-1b88-417e-83fb-c0e333f0b070?aid=8091'
      },
      {
        id: 'creamers',
        name: 'Creamers',
        nameAr: 'مبيض قهوة وكريمر',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/coffee-tea/670276f4-70ca-48c3-9875-c94929908f18/creamers/9c5a89e0-a7cb-4e10-8c6f-0995fca586bf?aid=8091'
      }
    ]
  },
  {
    id: 'breakfast-food',
    name: 'Breakfast Food',
    nameAr: 'أغذية الإفطار',
    icon: 'UtensilsCrossed',
    subcategories: [
      {
        id: 'cereals',
        name: 'Cereals',
        nameAr: 'كورن فليكس وشوفان',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/breakfast-food/1908e332-76f0-469f-bbc6-1896aefba6e0/cereals/4e5c53f7-1df0-4898-8c0a-1716a0e53f4c?aid=8091'
      },
      {
        id: 'spreads',
        name: 'Spreads',
        nameAr: 'شوكولاتة دهن وزبدة فول',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/breakfast-food/1908e332-76f0-469f-bbc6-1896aefba6e0/spreads/ed2b2d94-992a-4802-bf5e-6242984b36c7?aid=8091'
      },
      {
        id: 'honey-jams',
        name: 'Honey & Jams',
        nameAr: 'عسل نحل ومربى',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/breakfast-food/1908e332-76f0-469f-bbc6-1896aefba6e0/honey-jams/74aadb01-3a5b-4b17-b473-d1db194895af?aid=8091'
      }
    ]
  },
  {
    id: 'condiments',
    name: 'Condiments & Spices',
    nameAr: 'توابل وصوصات',
    icon: 'Salad',
    subcategories: [
      {
        id: 'salad-dressings-vinegar',
        name: 'Salad Dressings & Vinegar',
        nameAr: 'تتبيلات سلطة وخل',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/condiments/cbd0d61f-6ecb-418f-be33-4ed34eb7b126/salad-dressings-vinegar/d4e40698-6e7f-46dc-aec0-51b3fa2a5124?aid=8091'
      },
      {
        id: 'sauces',
        name: 'Sauces',
        nameAr: 'صلصات وكاتشب ومايونيز',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/condiments/cbd0d61f-6ecb-418f-be33-4ed34eb7b126/sauces/273d1e4f-d854-4746-a66e-5ef9a29fa2dc?aid=8091'
      },
      {
        id: 'spices-seasonings',
        name: 'Spices & Seasonings',
        nameAr: 'بهارات وتوابل شرقية',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/condiments/cbd0d61f-6ecb-418f-be33-4ed34eb7b126/spices-seasonings/94a02baf-3e4d-496d-9a92-e2cddfb32af9?aid=8091'
      },
      {
        id: 'salt',
        name: 'Salt',
        nameAr: 'ملح طعام وهيمالايا',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/condiments/cbd0d61f-6ecb-418f-be33-4ed34eb7b126/salt/a17f0487-22a3-4cea-b84e-ae68cc0baef8?aid=8091'
      }
    ]
  },
  {
    id: 'cooking-baking',
    name: 'Cooking & Baking',
    nameAr: 'مستلزمات الطبخ والخبيز',
    icon: 'ChefHat',
    subcategories: [
      {
        id: 'baking-ingredients',
        name: 'Baking Ingredients',
        nameAr: 'مكونات الخبز ودقيق',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cooking-baking/d21323f0-1401-4e28-a6ed-cd67b8566eeb/baking-ingredients/681d22ca-77ec-4f35-a058-dd22df623412?aid=8091'
      },
      {
        id: 'ghee',
        name: 'Ghee & Oils',
        nameAr: 'سمن بلدي وزيوت طهي',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cooking-baking/d21323f0-1401-4e28-a6ed-cd67b8566eeb/ghee/1e08f1f6-e3c0-434b-a7eb-da7280726e50?aid=8091'
      },
      {
        id: 'sugar-sweeteners',
        name: 'Sugar & Sweeteners',
        nameAr: 'سكر ومحليات دايت',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cooking-baking/d21323f0-1401-4e28-a6ed-cd67b8566eeb/sugar-sweeteners/fdb55ebc-f5e3-4b8f-bc3a-a2898a8e0dad?aid=8091'
      },
      {
        id: 'pastas',
        name: 'Pastas',
        nameAr: 'مكرونات متنوعة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cooking-baking/d21323f0-1401-4e28-a6ed-cd67b8566eeb/pastas/b00fbae8-9d8e-4c1f-b8ef-6b7f229c099f?aid=8091'
      },
      {
        id: 'noodles-soups',
        name: 'Noodles & Soups',
        nameAr: 'نودلز وشوربة جاهزة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cooking-baking/d21323f0-1401-4e28-a6ed-cd67b8566eeb/noodles-soups/9ffc3af3-4fe7-4148-a23e-679a9352ce68?aid=8091'
      },
      {
        id: 'rice',
        name: 'Rice',
        nameAr: 'أرز مصري وبسمتي',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cooking-baking/d21323f0-1401-4e28-a6ed-cd67b8566eeb/rice/8cf40f67-33af-445d-b0c8-1829cc0ae2d6?aid=8091'
      },
      {
        id: 'pulses-grains',
        name: 'Pulses & Grains',
        nameAr: 'بقوليات وحبوب كاملة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cooking-baking/d21323f0-1401-4e28-a6ed-cd67b8566eeb/pulses-grains/bf8a6890-1258-4094-a7c4-6a5d3edbc340?aid=8091'
      },
      {
        id: 'pizza-pasta-sauces',
        name: 'Pizza & Pasta Sauces',
        nameAr: 'صلصات بيتزا ومكرونة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cooking-baking/d21323f0-1401-4e28-a6ed-cd67b8566eeb/pizza-pasta-sauces/fbc9d91a-3fdc-4d1d-a27b-36db0dccb496?aid=8091'
      }
    ]
  },
  {
    id: 'canned-jarred',
    name: 'Canned & Jarred',
    nameAr: 'معلبات ومحفوظات',
    icon: 'Package',
    subcategories: [
      {
        id: 'canned-seafood',
        name: 'Canned Seafood',
        nameAr: 'تونة وأسماك معلبة',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/canned-jarred/9eb82f44-e13e-47f8-8286-2c0519983328/canned-seafood/a47d57cb-f200-49c9-a4c2-a79386dd9581?aid=8091'
      },
      {
        id: 'canned-vegetables',
        name: 'Canned Vegetables',
        nameAr: 'خضروات معلبة وذرة وفطر',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/canned-jarred/9eb82f44-e13e-47f8-8286-2c0519983328/canned-vegetables/12680198-1f9d-4b0e-973d-17a59f94845b?aid=8091'
      }
    ]
  },
  {
    id: 'protein-special-diet',
    name: 'Protein & Special Diet',
    nameAr: 'بروتين وأغذية صحية',
    icon: 'Dumbbell',
    subcategories: [
      {
        id: 'protein',
        name: 'Protein & Supplements',
        nameAr: 'مكملات وبروتين بار',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/protein-special-diet/3d88fec7-6ec6-478f-916f-0068d8f53514/protein/e03ffacd-ab01-4ce3-bfd4-725dc1b057c5?aid=8091'
      }
    ]
  },
  {
    id: 'cleaning-laundry',
    name: 'Cleaning & Laundry',
    nameAr: 'منظفات وعناية بالمنزل',
    icon: 'Droplets',
    subcategories: [
      {
        id: 'dishwashing',
        name: 'Dishwashing',
        nameAr: 'غسيل أطباق ومطهرات',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cleaning-laundry/7a0c6c8f-6558-4212-b384-c87a6383f4c1/dishwashing/43c345d0-d743-42e0-a242-be1c079ef5c6?aid=8091'
      },
      {
        id: 'cleaning-supplies',
        name: 'Cleaning Supplies',
        nameAr: 'مطهرات وأدوات تنظيف',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cleaning-laundry/7a0c6c8f-6558-4212-b384-c87a6383f4c1/cleaning-supplies/bd172266-2e7c-417b-b300-70fff67ed8cd?aid=8091'
      },
      {
        id: 'laundry',
        name: 'Laundry',
        nameAr: 'مساحيق غسيل ومنعمات',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/cleaning-laundry/7a0c6c8f-6558-4212-b384-c87a6383f4c1/laundry/44080981-a405-44c3-b879-66b968e5d67e?aid=8091'
      }
    ]
  },
  {
    id: 'disposables',
    name: 'Disposables & Paper',
    nameAr: 'مناديل ومستهلكات ورقية',
    icon: 'Layers',
    subcategories: [
      {
        id: 'tissues-paper-rolls',
        name: 'Tissues & Paper Rolls',
        nameAr: 'مناديل ورقية ومطابخ',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/disposables/695cfa82-c3f1-43a7-b234-652a08f1c13c/tissues-paper-rolls/64fe1312-916a-454e-93b7-80fa41a74b8d?aid=8091'
      }
    ]
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    nameAr: 'عناية شخصية وجمال',
    icon: 'HeartHandshake',
    subcategories: [
      {
        id: 'hair-care',
        name: 'Hair Care',
        nameAr: 'عناية بالشعر وشامبو',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/personal-care/9d702fa2-c44e-495c-a971-13cf6b262aad/hair-care/bb765c2e-e2ae-4af8-9156-9d198a1dee45?aid=8091'
      },
      {
        id: 'face-care',
        name: 'Face Care',
        nameAr: 'عناية بالبشرة والوجه',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/personal-care/9d702fa2-c44e-495c-a971-13cf6b262aad/face-care/8930fd0e-604b-42e3-ac51-3b218d298d05?aid=8091'
      },
      {
        id: 'skin-body-care',
        name: 'Skin & Body Care',
        nameAr: 'شاور جيل وعناية بالجسم',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/personal-care/9d702fa2-c44e-495c-a971-13cf6b262aad/skin-body-care/c9219283-8450-4b22-8d45-a49e0a941359?aid=8091'
      },
      {
        id: 'deodorants',
        name: 'Deodorants',
        nameAr: 'مزيلات عرق ومعطرات',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/personal-care/9d702fa2-c44e-495c-a971-13cf6b262aad/deodorants/0be7426b-b64a-468f-bf0a-aa351a8066d7?aid=8091'
      },
      {
        id: 'oral-care',
        name: 'Oral Care',
        nameAr: 'عناية بالفم والأسنان',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/personal-care/9d702fa2-c44e-495c-a971-13cf6b262aad/oral-care/dd55b516-b651-473c-9a3a-b7c93f54f4cb?aid=8091'
      },
      {
        id: 'shaving-hair-removing',
        name: 'Shaving & Hair Removing',
        nameAr: 'حلاقة وعناية رجالية',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/personal-care/9d702fa2-c44e-495c-a971-13cf6b262aad/shaving-hair-removing/21ebd500-0ab0-4c06-a7d5-fe940ae585b2?aid=8091'
      }
    ]
  },
  {
    id: 'household-essentials',
    name: 'Household Essentials',
    nameAr: 'مستلزمات منزلية ومطبخ',
    icon: 'Home',
    subcategories: [
      {
        id: 'outdoor-travel-gear',
        name: 'Outdoor & Travel Gear',
        nameAr: 'لوازم الرحلات والسفر',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/household-essentials/7e7dbb8b-727a-43ee-8a4e-021d3fc13201/outdoor-travel-gear/932b95e3-9708-48d8-994b-55f47fa2b1e2?aid=8091'
      },
      {
        id: 'home-maintenance',
        name: 'Home Maintenance',
        nameAr: 'صيانة وتصليح منزلي',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/household-essentials/7e7dbb8b-727a-43ee-8a4e-021d3fc13201/home-maintenance/696b683d-f8ff-4a09-8db7-539a138d03d3?aid=8091'
      },
      {
        id: 'home-supplies-accessories',
        name: 'Home Supplies & Accessories',
        nameAr: 'إكسسوارات وتنظيم البيت',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/household-essentials/7e7dbb8b-727a-43ee-8a4e-021d3fc13201/home-supplies-accessories/d320b16d-6ba6-45d5-9faf-d07d40434189?aid=8091'
      },
      {
        id: 'kitchen-dining',
        name: 'Kitchen & Dining',
        nameAr: 'أدوات المطبخ وسفرة الطعام',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/household-essentials/7e7dbb8b-727a-43ee-8a4e-021d3fc13201/kitchen-dining/2f830639-61e9-4a38-beb5-e38dd7c0bc52?aid=8091'
      }
    ]
  },
  {
    id: 'baby-corner',
    name: 'Baby Corner',
    nameAr: 'ركن الطفل والأمومة',
    icon: 'Baby',
    subcategories: [
      {
        id: 'diapers',
        name: 'Diapers',
        nameAr: 'حفاضات ومنتجات الطفل',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/baby-corner/858ddff9-8af5-4795-906c-233fffc7abc3/diapers/f15ed98b-5996-4c55-8c6e-c6145301179d?aid=8091'
      },
      {
        id: 'baby-hygiene',
        name: 'Baby Hygiene',
        nameAr: 'نظافة وعناية بالطفل',
        talabatUrl: 'https://www.talabat.com/egypt/grocery/675641/elzahraa-market/baby-corner/858ddff9-8af5-4795-906c-233fffc7abc3/baby-hygiene/73c84509-f5e7-4821-a305-6119d72bd184?aid=8091'
      }
    ]
  }
];
