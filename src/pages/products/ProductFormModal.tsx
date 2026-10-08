import React, { useState, useEffect } from 'react';
import { GlassModal } from '../../components/ui/GlassModal';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassInput } from '../../components/ui/GlassInput';
import { GlassSelect } from '../../components/ui/GlassSelect';
import { Product } from '../../types';
import { useData } from '../../context/DataContext';
import { generateSKU, compressImage } from '../../lib/utils';
import { Camera, Image as ImageIcon, Sparkles, X, Plus } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, categories, units, suppliers } = useData();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState(categories[0] || 'General');
  const [unit, setUnit] = useState(units[0] || 'pcs');
  const [costPrice, setCostPrice] = useState('0');
  const [defaultSellingPrice, setDefaultSellingPrice] = useState('0');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [optimalStock, setOptimalStock] = useState('100');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode || '');
      setCategory(productToEdit.category);
      setUnit(productToEdit.unit);
      setCostPrice(String(productToEdit.cost_price));
      setDefaultSellingPrice(String(productToEdit.default_selling_price));
      setReorderLevel(String(productToEdit.reorder_level));
      setOptimalStock(String(productToEdit.optimal_stock));
      setSupplierId(productToEdit.supplier_id || '');
      setDescription(productToEdit.description || '');
      setImages(productToEdit.images || []);
    } else {
      resetForm();
    }
  }, [productToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    setSku('');
    setBarcode('');
    setCategory(categories[0] || 'General');
    setUnit(units[0] || 'pcs');
    setCostPrice('0');
    setDefaultSellingPrice('0');
    setReorderLevel('10');
    setOptimalStock('100');
    setSupplierId('');
    setDescription('');
    setImages([]);
  };

  const handleGenerateSKU = () => {
    if (name) {
      setSku(generateSKU(name, category));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        setImages((prev) => [...prev, compressed]);
      } catch (err) {
        console.error('Image upload failed', err);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    setIsLoading(true);
    try {
      const payload = {
        name,
        sku,
        barcode: barcode || undefined,
        category,
        unit,
        cost_price: parseFloat(costPrice) || 0,
        default_selling_price: parseFloat(defaultSellingPrice) || 0,
        reorder_level: parseInt(reorderLevel) || 10,
        optimal_stock: parseInt(optimalStock) || 100,
        supplier_id: supplierId || undefined,
        description: description || undefined,
        images,
        is_archived: false,
      };

      if (productToEdit) {
        await updateProduct(productToEdit.id, payload);
      } else {
        await addProduct(payload);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Product' : 'Add New Product'}
      subtitle="Configure product parameters, pricing, photos, and stock thresholds"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Section */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Product Photos (Camera / Gallery)
          </label>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/40 shadow-sm group">
                <img src={img} alt="Product" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <label className="relative aspect-square rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/30 dark:bg-slate-900/30">
              <Camera className="w-6 h-6 text-slate-400" />
              <span className="text-[10px] text-slate-400 mt-1 font-semibold">Upload Photo</span>
              <input type="file" accept="image/*" capture="environment" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassInput
            label="Product Name"
            placeholder="e.g. Premium Wireless Headphones"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                SKU Number
              </label>
              <button
                type="button"
                onClick={handleGenerateSKU}
                className="text-xs text-brand-500 font-bold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Auto-Generate
              </button>
            </div>
            <GlassInput
              placeholder="e.g. ELE-HDP-9831"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassInput
            label="Barcode (UPC/EAN)"
            placeholder="8901234567890"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
          <GlassSelect
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={categories.map((c) => ({ label: c, value: c }))}
          />
          <GlassSelect
            label="Unit of Measurement"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={units.map((u) => ({ label: u, value: u }))}
          />
        </div>

        {/* Pricing & Thresholds */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
          <GlassInput
            label="Cost Price ($)"
            type="number"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            required
          />
          <GlassInput
            label="Default Selling ($)"
            type="number"
            step="0.01"
            value={defaultSellingPrice}
            onChange={(e) => setDefaultSellingPrice(e.target.value)}
            required
          />
          <GlassInput
            label="Low Reorder Level"
            type="number"
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
            required
          />
          <GlassInput
            label="Optimal Max Stock"
            type="number"
            value={optimalStock}
            onChange={(e) => setOptimalStock(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassSelect
            label="Preferred Supplier"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            options={[
              { label: '-- Select Supplier --', value: '' },
              ...suppliers.map((s) => ({ label: s.name, value: s.id })),
            ]}
          />
          <GlassInput
            label="Description / Specs"
            placeholder="Optional detailed description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <GlassButton variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" type="submit" isLoading={isLoading}>
            {productToEdit ? 'Save Changes' : 'Create Product'}
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
};
