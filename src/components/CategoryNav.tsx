import React from 'react';
import { 
  Apple, 
  Croissant, 
  Beef, 
  Egg, 
  CupSoda, 
  Milk, 
  Candy, 
  IceCream, 
  Snowflake, 
  Coffee, 
  UtensilsCrossed, 
  Salad, 
  ChefHat, 
  Package, 
  Dumbbell, 
  Droplets, 
  Layers, 
  HeartHandshake, 
  Home, 
  Baby,
  Grid
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { Category, Product } from '../types';

interface CategoryNavProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  selectedSubcategory: string | null;
  onSelectSubcategory: (subcategoryId: string | null) => void;
  products?: Product[];
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategoryId,
  onSelectCategory,
  selectedSubcategory,
  onSelectSubcategory
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'fruit-veg': return <Apple className="w-4 h-4" />;
      case 'bakery': return <Croissant className="w-4 h-4" />;
      case 'poultry-meat-seafood': return <Beef className="w-4 h-4" />;
      case 'dairy-eggs': return <Egg className="w-4 h-4" />;
      case 'beverages': return <CupSoda className="w-4 h-4" />;
      case 'milk': return <Milk className="w-4 h-4" />;
      case 'snacks-chocolate': return <Candy className="w-4 h-4" />;
      case 'ice-cream': return <IceCream className="w-4 h-4" />;
      case 'frozen-food': return <Snowflake className="w-4 h-4" />;
      case 'coffee-tea': return <Coffee className="w-4 h-4" />;
      case 'breakfast-food': return <UtensilsCrossed className="w-4 h-4" />;
      case 'condiments': return <Salad className="w-4 h-4" />;
      case 'cooking-baking': return <ChefHat className="w-4 h-4" />;
      case 'canned-jarred': return <Package className="w-4 h-4" />;
      case 'protein-special-diet': return <Dumbbell className="w-4 h-4" />;
      case 'cleaning-laundry': return <Droplets className="w-4 h-4" />;
      case 'disposables': return <Layers className="w-4 h-4" />;
      case 'personal-care': return <HeartHandshake className="w-4 h-4" />;
      case 'household-essentials': return <Home className="w-4 h-4" />;
      case 'baby-corner': return <Baby className="w-4 h-4" />;
      default: return <Grid className="w-4 h-4" />;
    }
  };

  const currentCategory = CATEGORIES.find(c => c.id === selectedCategoryId);

  return (
    <div className="bg-[#edf2ee]/95 backdrop-blur-md border-b border-emerald-900/10 sticky top-[82px] sm:top-[94px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5">
        
        {/* All Departments Displayed Together */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 py-1 w-full">
          {/* All Categories Button */}
          <button
            onClick={() => {
              onSelectCategory(null);
              onSelectSubcategory(null);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategoryId === null
                ? 'bg-[#0d47a1] text-white shadow-md shadow-blue-900/30 ring-2 ring-blue-400'
                : 'bg-white text-slate-800 hover:bg-blue-50 hover:text-[#0d47a1] border border-blue-200'
            }`}
          >
            <Grid className={`w-4 h-4 ${selectedCategoryId === null ? 'text-yellow-300' : 'text-[#1565c0]'}`} />
            <span className="font-sans font-black tracking-tight text-xs sm:text-[13px]">كل الأقسام</span>
          </button>

          {/* Category Buttons - Pure Arabic */}
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onSelectSubcategory(null);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0d47a1] text-white shadow-md shadow-blue-900/30 ring-2 ring-blue-400'
                    : 'bg-white text-slate-800 hover:bg-blue-50 hover:text-[#0d47a1] border border-blue-200'
                }`}
              >
                <span className={isActive ? 'text-yellow-300' : 'text-[#1565c0]'}>
                  {getCategoryIcon(cat.id)}
                </span>
                <span className="font-bold tracking-tight text-xs sm:text-[13px]">{cat.nameAr}</span>
              </button>
            );
          })}
        </div>

        {/* Subcategories Filter Chips */}
        {currentCategory && currentCategory.subcategories.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-2 pb-1 border-t border-blue-200/60 mt-1.5 no-scrollbar">
            <span className="text-xs font-bold text-[#0d47a1] shrink-0 font-sans">
              أقسام {currentCategory.nameAr}:
            </span>
            
            <button
              onClick={() => onSelectSubcategory(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedSubcategory === null
                  ? 'border-[#0d47a1] bg-[#0d47a1] text-white font-bold shadow-xs'
                  : 'border-blue-200 bg-white text-[#0d47a1] hover:bg-blue-50'
              }`}
            >
              <span>الكل</span>
            </button>

            {currentCategory.subcategories.map((sub) => {
              const isSubActive = selectedSubcategory === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubcategory(sub.id)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    isSubActive
                      ? 'border-[#0d47a1] bg-[#0d47a1] text-white font-bold shadow-xs'
                      : 'border-blue-200 bg-white text-[#0d47a1] hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className="font-bold">{sub.nameAr}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
