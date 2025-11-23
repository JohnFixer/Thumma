import React from 'react';
import type { Product, Language } from '../types';
import { getCategoryByKey } from '../categories';
import { useTranslations } from '../translations';

interface ProductTooltipProps {
  product: Product;
  position: { x: number; y: number };
  language: Language;
}

const ProductTooltip: React.FC<ProductTooltipProps> = ({ product, position, language }) => {
  const t = useTranslations(language);

  // Add a small offset to avoid the tooltip covering the cursor
  const style = {
    left: `${position.x + 15}px`,
    top: `${position.y + 15}px`,
  };

  return (
    <div
      style={style}
      className="fixed z-50 w-64 p-3 bg-gray-800 text-white rounded-lg shadow-2xl pointer-events-none animate-fade-in"
      role="tooltip"
    >
      <h4 className="font-bold">{product.name[language]}</h4>
      {product.description && product.description[language] && (
        <p className="text-xs text-gray-300 mt-1">
         {product.description[language]}
        </p>
      )}
    </div>
  );
};

export default ProductTooltip;