import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Warehouse,
  Supplier,
  WarehouseStock,
  DailyPrice,
  PriceHistoryLog,
  StockMovement,
  RestockRequest,
  PurchaseOrder,
  PurchaseOrderItem,
  CustomerOrder,
  CustomerOrderItem,
  Vehicle,
  LoadingTask,
  LoadingTaskItem,
  MovementType,
  RestockUrgency,
  POStatus,
  CustomerOrderStatus,
  PaymentStatus,
} from '../types';
import { supabase, isSupabaseConfigured, getLocalCollection, setLocalCollection } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { generateOrderNumber } from '../lib/utils';

interface DataContextType {
  products: Product[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  stocks: WarehouseStock[];
  dailyPrices: DailyPrice[];
  priceLogs: PriceHistoryLog[];
  movements: StockMovement[];
  restockRequests: RestockRequest[];
  purchaseOrders: PurchaseOrder[];
  customerOrders: CustomerOrder[];
  vehicles: Vehicle[];
  loadingTasks: LoadingTask[];
  categories: string[];
  units: string[];

  // Product Actions
  addProduct: (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<void>;
  archiveProduct: (id: string) => Promise<void>;

  // Warehouse Actions
  addWarehouse: (wh: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateWarehouse: (id: string, wh: Partial<Warehouse>) => Promise<void>;

  // Supplier Actions
  addSupplier: (sup: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplier: (id: string, sup: Partial<Supplier>) => Promise<void>;

  // Daily Prices Actions
  setDailyPrice: (productId: string, date: string, sellingPrice: number) => Promise<void>;
  bulkUpdateDailyPrices: (date: string, updates: { productId: string; price: number }[]) => Promise<void>;
  getProductEffectivePrice: (productId: string, date?: string) => number;
  hasPriceConfirmedForToday: boolean;

  // Stock Movement & Adjustment Actions
  executeStockMovement: (
    productId: string,
    sourceWhId: string | undefined,
    destWhId: string | undefined,
    quantity: number,
    type: MovementType,
    reason: string
  ) => Promise<boolean>;

  // Restock Request Actions
  createRestockRequest: (productId: string, warehouseId: string, quantity: number, urgency: RestockUrgency, note?: string) => Promise<void>;
  approveRestockRequest: (requestId: string) => Promise<void>;
  rejectRestockRequest: (requestId: string, reason: string) => Promise<void>;

  // Purchase Order Actions
  createPurchaseOrder: (supplierId: string, items: { productId: string; warehouseId: string; quantity: number; unitCost: number }[], expectedDate?: string) => Promise<void>;
  receivePurchaseOrder: (poId: string, itemReceivedMap: Record<string, number>) => Promise<void>;
  cancelPurchaseOrder: (poId: string) => Promise<void>;

  // Customer Order Actions
  createCustomerOrder: (customerName: string, customerPhone: string, items: { productId: string; warehouseId: string; quantity: number; unitPrice: number }[], discount: number, notes?: string) => Promise<CustomerOrder>;
  updateOrderStatus: (orderId: string, status: CustomerOrderStatus) => Promise<void>;
  recordPayment: (orderId: string, amount: number) => Promise<void>;

  // Vehicles & Loading Actions
  addVehicle: (v: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createLoadingTask: (orderId: string, sourceWhId: string, vehicleId: string, loaderId: string, notes?: string) => Promise<void>;
  toggleTaskItemLoaded: (taskId: string, itemId: string, isLoaded: boolean) => Promise<void>;
  completeLoadingTask: (taskId: string) => Promise<void>;

  // Helper Stock Lookups
  getProductTotalStock: (productId: string) => number;
  getProductStockInWarehouse: (productId: string, warehouseId: string) => number;
  addCategory: (category: string) => void;
  addUnit: (unit: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stocks, setStocks] = useState<WarehouseStock[]>([]);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>([]);
  const [priceLogs, setPriceLogs] = useState<PriceHistoryLog[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [restockRequests, setRestockRequests] = useState<RestockRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingTasks, setLoadingTasks] = useState<LoadingTask[]>([]);
  const [categories, setCategories] = useState<string[]>(['Electronics', 'Beverages', 'Clothing', 'Raw Materials', 'Hardware']);
  const [units, setUnits] = useState<string[]>(['pcs', 'kg', 'boxes', 'liters', 'pallets', 'meters']);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    if (isSupabaseConfigured) {
      const { data: p } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (p) setProducts(p);

      const { data: w } = await supabase.from('warehouses').select('*').order('created_at', { ascending: false });
      if (w) setWarehouses(w);

      const { data: s } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (s) setSuppliers(s);

      const { data: st } = await supabase.from('warehouse_stock').select('*');
      if (st) setStocks(st);

      const { data: dp } = await supabase.from('daily_prices').select('*');
      if (dp) setDailyPrices(dp);

      const { data: sm } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
      if (sm) setMovements(sm);

      const { data: rr } = await supabase.from('restock_requests').select('*').order('created_at', { ascending: false });
      if (rr) setRestockRequests(rr);

      const { data: po } = await supabase.from('purchase_orders').select('*, items:purchase_order_items(*)').order('created_at', { ascending: false });
      if (po) setPurchaseOrders(po);

      const { data: co } = await supabase.from('customer_orders').select('*, items:customer_order_items(*)').order('created_at', { ascending: false });
      if (co) setCustomerOrders(co);

      const { data: v } = await supabase.from('vehicles').select('*');
      if (v) setVehicles(v);

      const { data: lt } = await supabase.from('loading_tasks').select('*, items:loading_task_items(*)').order('created_at', { ascending: false });
      if (lt) setLoadingTasks(lt);
    } else {
      setProducts(getLocalCollection<Product>('products'));
      setWarehouses(getLocalCollection<Warehouse>('warehouses'));
      setSuppliers(getLocalCollection<Supplier>('suppliers'));
      setStocks(getLocalCollection<WarehouseStock>('warehouse_stock'));
      setDailyPrices(getLocalCollection<DailyPrice>('daily_prices'));
      setPriceLogs(getLocalCollection<PriceHistoryLog>('price_history_log'));
      setMovements(getLocalCollection<StockMovement>('stock_movements'));
      setRestockRequests(getLocalCollection<RestockRequest>('restock_requests'));
      setPurchaseOrders(getLocalCollection<PurchaseOrder>('purchase_orders'));
      setCustomerOrders(getLocalCollection<CustomerOrder>('customer_orders'));
      setVehicles(getLocalCollection<Vehicle>('vehicles'));
      setLoadingTasks(getLocalCollection<LoadingTask>('loading_tasks'));
    }
  };

  // Helper Stock Methods
  const getProductTotalStock = (productId: string): number => {
    return stocks
      .filter((s) => s.product_id === productId)
      .reduce((sum, s) => sum + s.quantity, 0);
  };

  const getProductStockInWarehouse = (productId: string, warehouseId: string): number => {
    const record = stocks.find((s) => s.product_id === productId && s.warehouse_id === warehouseId);
    return record ? record.quantity : 0;
  };

  // Pricing Helpers
  const todayStr = new Date().toISOString().slice(0, 10);
  const hasPriceConfirmedForToday = dailyPrices.some((dp) => dp.date === todayStr);

  const getProductEffectivePrice = (productId: string, dateStr: string = todayStr): number => {
    const dp = dailyPrices.find((p) => p.product_id === productId && p.date === dateStr);
    if (dp) return dp.selling_price;
    const prod = products.find((p) => p.id === productId);
    return prod ? prod.default_selling_price : 0;
  };

  // Product Actions
  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
    const newProduct: Product = {
      ...productData,
      id: Math.random().toString(36).substring(2, 9),
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newProduct, ...products];
    setProducts(updated);

    if (isSupabaseConfigured) {
      await supabase.from('products').insert([newProduct]);
    } else {
      setLocalCollection('products', updated);
    }
    showToast('Product Added', `Added ${newProduct.name} to inventory`, 'success');
    return newProduct;
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...productData, updated_at: new Date().toISOString() } : p));
    setProducts(updated);

    if (isSupabaseConfigured) {
      await supabase.from('products').update(productData).eq('id', id);
    } else {
      setLocalCollection('products', updated);
    }
    showToast('Product Updated', 'Product details updated successfully', 'success');
  };

  const archiveProduct = async (id: string) => {
    const updated = products.map((p) => (p.id === id ? { ...p, is_archived: true, updated_at: new Date().toISOString() } : p));
    setProducts(updated);

    if (isSupabaseConfigured) {
      await supabase.from('products').update({ is_archived: true }).eq('id', id);
    } else {
      setLocalCollection('products', updated);
    }
    showToast('Product Archived', 'Product status set to archived', 'info');
  };

  // Warehouses Actions
  const addWarehouse = async (wh: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => {
    const newWh: Warehouse = {
      ...wh,
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newWh, ...warehouses];
    setWarehouses(updated);

    if (isSupabaseConfigured) {
      await supabase.from('warehouses').insert([newWh]);
    } else {
      setLocalCollection('warehouses', updated);
    }
    showToast('Warehouse Added', `Warehouse ${newWh.name} created.`, 'success');
  };

  const updateWarehouse = async (id: string, wh: Partial<Warehouse>) => {
    const updated = warehouses.map((w) => (w.id === id ? { ...w, ...wh, updated_at: new Date().toISOString() } : w));
    setWarehouses(updated);

    if (isSupabaseConfigured) {
      await supabase.from('warehouses').update(wh).eq('id', id);
    } else {
      setLocalCollection('warehouses', updated);
    }
    showToast('Warehouse Updated', 'Warehouse details updated', 'success');
  };

  // Supplier Actions
  const addSupplier = async (sup: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    const newSup: Supplier = {
      ...sup,
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newSup, ...suppliers];
    setSuppliers(updated);

    if (isSupabaseConfigured) {
      await supabase.from('suppliers').insert([newSup]);
    } else {
      setLocalCollection('suppliers', updated);
    }
    showToast('Supplier Added', `${newSup.name} added to suppliers list`, 'success');
  };

  const updateSupplier = async (id: string, sup: Partial<Supplier>) => {
    const updated = suppliers.map((s) => (s.id === id ? { ...s, ...sup, updated_at: new Date().toISOString() } : s));
    setSuppliers(updated);

    if (isSupabaseConfigured) {
      await supabase.from('suppliers').update(sup).eq('id', id);
    } else {
      setLocalCollection('suppliers', updated);
    }
    showToast('Supplier Updated', 'Supplier record updated', 'success');
  };

  // Daily Prices Actions
  const setDailyPrice = async (productId: string, date: string, sellingPrice: number) => {
    const oldPrice = getProductEffectivePrice(productId, date);
    const existingIndex = dailyPrices.findIndex((dp) => dp.product_id === productId && dp.date === date);

    let updatedPrices: DailyPrice[];
    if (existingIndex >= 0) {
      updatedPrices = [...dailyPrices];
      updatedPrices[existingIndex] = { ...updatedPrices[existingIndex], selling_price: sellingPrice };
    } else {
      const newDp: DailyPrice = {
        id: Math.random().toString(36).substring(2, 9),
        product_id: productId,
        date,
        selling_price: sellingPrice,
        created_by: user?.id,
        created_at: new Date().toISOString(),
      };
      updatedPrices = [...dailyPrices, newDp];
    }
    setDailyPrices(updatedPrices);

    const newLog: PriceHistoryLog = {
      id: Math.random().toString(36).substring(2, 9),
      product_id: productId,
      date,
      old_price: oldPrice,
      new_price: sellingPrice,
      changed_by: user?.id,
      created_at: new Date().toISOString(),
    };
    const updatedLogs = [newLog, ...priceLogs];
    setPriceLogs(updatedLogs);

    if (isSupabaseConfigured) {
      await supabase.from('daily_prices').upsert({ product_id: productId, date, selling_price: sellingPrice, created_by: user?.id });
      await supabase.from('price_history_log').insert([newLog]);
    } else {
      setLocalCollection('daily_prices', updatedPrices);
      setLocalCollection('price_history_log', updatedLogs);
    }
  };

  const bulkUpdateDailyPrices = async (date: string, updates: { productId: string; price: number }[]) => {
    for (const update of updates) {
      await setDailyPrice(update.productId, date, update.price);
    }
    showToast('Prices Confirmed', `Updated prices for ${updates.length} products for ${date}`, 'success');
  };

  // Stock Movement Action (With Zero Negative Stock Guarantee)
  const executeStockMovement = async (
    productId: string,
    sourceWhId: string | undefined,
    destWhId: string | undefined,
    quantity: number,
    type: MovementType,
    reason: string
  ): Promise<boolean> => {
    if (quantity <= 0) {
      showToast('Invalid Quantity', 'Movement quantity must be greater than zero', 'error');
      return false;
    }

    let updatedStocks = [...stocks];

    if (type === 'out' || type === 'transfer') {
      if (!sourceWhId) {
        showToast('Source Warehouse Required', 'Please select source warehouse', 'error');
        return false;
      }
      const currentSourceQty = getProductStockInWarehouse(productId, sourceWhId);
      if (currentSourceQty < quantity) {
        showToast('Insufficient Stock', `Available: ${currentSourceQty}, Requested: ${quantity}`, 'error');
        return false;
      }

      // Deduct
      updatedStocks = updatedStocks.map((s) =>
        s.product_id === productId && s.warehouse_id === sourceWhId
          ? { ...s, quantity: s.quantity - quantity, updated_at: new Date().toISOString() }
          : s
      );
    }

    if (type === 'in' || type === 'transfer') {
      if (!destWhId) {
        showToast('Destination Warehouse Required', 'Please select destination warehouse', 'error');
        return false;
      }
      const existing = updatedStocks.find((s) => s.product_id === productId && s.warehouse_id === destWhId);
      if (existing) {
        updatedStocks = updatedStocks.map((s) =>
          s.product_id === productId && s.warehouse_id === destWhId
            ? { ...s, quantity: s.quantity + quantity, updated_at: new Date().toISOString() }
            : s
        );
      } else {
        updatedStocks.push({
          id: Math.random().toString(36).substring(2, 9),
          warehouse_id: destWhId,
          product_id: productId,
          quantity: quantity,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (type === 'adjustment') {
      if (!destWhId) {
        showToast('Warehouse Required', 'Select warehouse for adjustment', 'error');
        return false;
      }
      const existing = updatedStocks.find((s) => s.product_id === productId && s.warehouse_id === destWhId);
      if (existing) {
        updatedStocks = updatedStocks.map((s) =>
          s.product_id === productId && s.warehouse_id === destWhId
            ? { ...s, quantity: quantity, updated_at: new Date().toISOString() }
            : s
        );
      } else {
        updatedStocks.push({
          id: Math.random().toString(36).substring(2, 9),
          warehouse_id: destWhId,
          product_id: productId,
          quantity: quantity,
          updated_at: new Date().toISOString(),
        });
      }
    }

    setStocks(updatedStocks);

    const newMovement: StockMovement = {
      id: Math.random().toString(36).substring(2, 9),
      product_id: productId,
      source_warehouse_id: sourceWhId,
      destination_warehouse_id: destWhId,
      quantity,
      movement_type: type,
      reason,
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };
    const updatedMovements = [newMovement, ...movements];
    setMovements(updatedMovements);

    if (isSupabaseConfigured) {
      await supabase.rpc('execute_stock_movement', {
        p_product_id: productId,
        p_source_wh_id: sourceWhId,
        p_dest_wh_id: destWhId,
        p_quantity: quantity,
        p_type: type,
        p_reason: reason,
        p_user_id: user?.id,
      });
    } else {
      setLocalCollection('warehouse_stock', updatedStocks);
      setLocalCollection('stock_movements', updatedMovements);
    }

    showToast('Stock Movement Recorded', `${type.toUpperCase()} - ${quantity} units logged.`, 'success');
    return true;
  };

  // Restock Request Actions
  const createRestockRequest = async (productId: string, warehouseId: string, quantity: number, urgency: RestockUrgency, note?: string) => {
    const newReq: RestockRequest = {
      id: Math.random().toString(36).substring(2, 9),
      product_id: productId,
      warehouse_id: warehouseId,
      quantity_needed: quantity,
      urgency,
      note,
      requested_by: user?.id || 'sales',
      status: 'requested',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newReq, ...restockRequests];
    setRestockRequests(updated);

    if (isSupabaseConfigured) {
      await supabase.from('restock_requests').insert([newReq]);
    } else {
      setLocalCollection('restock_requests', updated);
    }
    showToast('Restock Requested', 'Submitted to Owner/Manager inbox.', 'success');
  };

  const approveRestockRequest = async (requestId: string) => {
    const req = restockRequests.find((r) => r.id === requestId);
    if (!req) return;

    const prod = products.find((p) => p.id === req.product_id);
    const updatedRequests = restockRequests.map((r) => (r.id === requestId ? { ...r, status: 'approved' as const, updated_at: new Date().toISOString() } : r));
    setRestockRequests(updatedRequests);

    // Auto-create draft Purchase Order
    if (prod && prod.supplier_id) {
      await createPurchaseOrder(prod.supplier_id, [
        { productId: req.product_id, warehouseId: req.warehouse_id, quantity: req.quantity_needed, unitCost: prod.cost_price },
      ]);
    }

    if (isSupabaseConfigured) {
      await supabase.from('restock_requests').update({ status: 'approved' }).eq('id', requestId);
    } else {
      setLocalCollection('restock_requests', updatedRequests);
    }
    showToast('Request Approved', 'Converted into a Purchase Order draft.', 'success');
  };

  const rejectRestockRequest = async (requestId: string, reason: string) => {
    const updatedRequests = restockRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'rejected' as const, rejection_reason: reason, updated_at: new Date().toISOString() } : r
    );
    setRestockRequests(updatedRequests);

    if (isSupabaseConfigured) {
      await supabase.from('restock_requests').update({ status: 'rejected', rejection_reason: reason }).eq('id', requestId);
    } else {
      setLocalCollection('restock_requests', updatedRequests);
    }
    showToast('Request Rejected', 'Restock request marked as rejected.', 'info');
  };

  // Purchase Order Actions
  const createPurchaseOrder = async (
    supplierId: string,
    items: { productId: string; warehouseId: string; quantity: number; unitCost: number }[],
    expectedDate?: string
  ) => {
    const poId = Math.random().toString(36).substring(2, 9);
    const poNumber = generateOrderNumber('PO');
    const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const poItems: PurchaseOrderItem[] = items.map((item) => ({
      id: Math.random().toString(36).substring(2, 9),
      purchase_order_id: poId,
      product_id: item.productId,
      warehouse_id: item.warehouseId,
      quantity_ordered: item.quantity,
      quantity_received: 0,
      unit_cost: item.unitCost,
    }));

    const newPO: PurchaseOrder = {
      id: poId,
      po_number: poNumber,
      supplier_id: supplierId,
      status: 'ordered',
      total_cost: totalCost,
      expected_date: expectedDate,
      created_by: user?.id,
      items: poItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newPO, ...purchaseOrders];
    setPurchaseOrders(updated);

    if (isSupabaseConfigured) {
      await supabase.from('purchase_orders').insert([
        { id: poId, po_number: poNumber, supplier_id: supplierId, status: 'ordered', total_cost: totalCost, expected_date: expectedDate, created_by: user?.id },
      ]);
      await supabase.from('purchase_order_items').insert(poItems);
    } else {
      setLocalCollection('purchase_orders', updated);
    }
    showToast('Purchase Order Created', `PO ${poNumber} issued to supplier`, 'success');
  };

  const receivePurchaseOrder = async (poId: string, itemReceivedMap: Record<string, number>) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po || !po.items) return;

    let allReceived = true;
    let anyReceived = false;

    const updatedItems = po.items.map((item) => {
      const addedQty = itemReceivedMap[item.id] || 0;
      if (addedQty > 0) {
        anyReceived = true;
        // Auto stock in!
        executeStockMovement(
          item.product_id,
          undefined,
          item.warehouse_id,
          addedQty,
          'in',
          `Received PO: ${po.po_number}`
        );
      }
      const totalRec = item.quantity_received + addedQty;
      if (totalRec < item.quantity_ordered) allReceived = false;
      return { ...item, quantity_received: totalRec };
    });

    const newStatus: POStatus = allReceived ? 'received' : anyReceived ? 'partially_received' : po.status;
    const updatedPOs = purchaseOrders.map((p) => (p.id === poId ? { ...p, status: newStatus, items: updatedItems, updated_at: new Date().toISOString() } : p));
    setPurchaseOrders(updatedPOs);

    if (isSupabaseConfigured) {
      await supabase.from('purchase_orders').update({ status: newStatus }).eq('id', poId);
      for (const item of updatedItems) {
        await supabase.from('purchase_order_items').update({ quantity_received: item.quantity_received }).eq('id', item.id);
      }
    } else {
      setLocalCollection('purchase_orders', updatedPOs);
    }
    showToast('Inventory Updated', `Goods received for ${po.po_number}`, 'success');
  };

  const cancelPurchaseOrder = async (poId: string) => {
    const updatedPOs = purchaseOrders.map((p) => (p.id === poId ? { ...p, status: 'cancelled' as const, updated_at: new Date().toISOString() } : p));
    setPurchaseOrders(updatedPOs);

    if (isSupabaseConfigured) {
      await supabase.from('purchase_orders').update({ status: 'cancelled' }).eq('id', poId);
    } else {
      setLocalCollection('purchase_orders', updatedPOs);
    }
    showToast('PO Cancelled', 'Purchase order status set to cancelled', 'info');
  };

  // Customer Order Actions
  const createCustomerOrder = async (
    customerName: string,
    customerPhone: string,
    items: { productId: string; warehouseId: string; quantity: number; unitPrice: number }[],
    discount: number,
    notes?: string
  ): Promise<CustomerOrder> => {
    // Validate stock for all items
    for (const item of items) {
      const avail = getProductStockInWarehouse(item.productId, item.warehouseId);
      if (avail < item.quantity) {
        const prod = products.find((p) => p.id === item.productId);
        showToast('Insufficient Stock', `${prod?.name || 'Item'} only has ${avail} units available in selected warehouse`, 'error');
        throw new Error('Insufficient stock');
      }
    }

    const orderId = Math.random().toString(36).substring(2, 9);
    const orderNumber = generateOrderNumber('SO');
    const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalAmount = Math.max(0, itemsTotal - discount);

    const orderItems: CustomerOrderItem[] = items.map((item) => ({
      id: Math.random().toString(36).substring(2, 9),
      customer_order_id: orderId,
      product_id: item.productId,
      warehouse_id: item.warehouseId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const newOrder: CustomerOrder = {
      id: orderId,
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      status: 'pending',
      payment_status: 'pending',
      total_amount: totalAmount,
      amount_paid: 0,
      discount,
      notes,
      created_by: user?.id,
      items: orderItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newOrder, ...customerOrders];
    setCustomerOrders(updated);

    if (isSupabaseConfigured) {
      await supabase.from('customer_orders').insert([
        { id: orderId, order_number: orderNumber, customer_name: customerName, customer_phone: customerPhone, status: 'pending', payment_status: 'pending', total_amount: totalAmount, amount_paid: 0, discount, notes, created_by: user?.id },
      ]);
      await supabase.from('customer_order_items').insert(orderItems);
    } else {
      setLocalCollection('customer_orders', updated);
    }

    showToast('Customer Order Created', `Order ${orderNumber} placed successfully`, 'success');
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: CustomerOrderStatus) => {
    const order = customerOrders.find((o) => o.id === orderId);
    if (!order) return;

    // Deduct stock on confirmation/delivery if not deducted yet
    if (status === 'confirmed' && order.status === 'pending') {
      if (order.items) {
        for (const item of order.items) {
          await executeStockMovement(item.product_id, item.warehouse_id, undefined, item.quantity, 'out', `Sale Order: ${order.order_number}`);
        }
      }
    }

    const updatedOrders = customerOrders.map((o) => (o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o));
    setCustomerOrders(updatedOrders);

    if (isSupabaseConfigured) {
      await supabase.from('customer_orders').update({ status }).eq('id', orderId);
    } else {
      setLocalCollection('customer_orders', updatedOrders);
    }
    showToast('Order Status Updated', `Order ${order.order_number} marked as ${status.toUpperCase()}`, 'success');
  };

  const recordPayment = async (orderId: string, amount: number) => {
    const order = customerOrders.find((o) => o.id === orderId);
    if (!order) return;

    const newAmountPaid = order.amount_paid + amount;
    const newPaymentStatus: PaymentStatus = newAmountPaid >= order.total_amount ? 'paid' : newAmountPaid > 0 ? 'partial' : 'pending';

    const updatedOrders = customerOrders.map((o) =>
      o.id === orderId ? { ...o, amount_paid: newAmountPaid, payment_status: newPaymentStatus, updated_at: new Date().toISOString() } : o
    );
    setCustomerOrders(updatedOrders);

    if (isSupabaseConfigured) {
      await supabase.from('customer_orders').update({ amount_paid: newAmountPaid, payment_status: newPaymentStatus }).eq('id', orderId);
    } else {
      setLocalCollection('customer_orders', updatedOrders);
    }
    showToast('Payment Recorded', `Recorded payment of ${amount}. Status: ${newPaymentStatus.toUpperCase()}`, 'success');
  };

  // Vehicle & Loader Actions
  const addVehicle = async (v: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => {
    const newVehicle: Vehicle = {
      ...v,
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [newVehicle, ...vehicles];
    setVehicles(updated);

    if (isSupabaseConfigured) {
      await supabase.from('vehicles').insert([newVehicle]);
    } else {
      setLocalCollection('vehicles', updated);
    }
    showToast('Vehicle Added', `Added ${newVehicle.name} (${newVehicle.plate_number})`, 'success');
  };

  const createLoadingTask = async (orderId: string, sourceWhId: string, vehicleId: string, loaderId: string, notes?: string) => {
    const order = customerOrders.find((o) => o.id === orderId);
    if (!order || !order.items) return;

    const taskId = Math.random().toString(36).substring(2, 9);
    const taskNumber = generateOrderNumber('TASK');

    const taskItems: LoadingTaskItem[] = order.items.map((item) => ({
      id: Math.random().toString(36).substring(2, 9),
      loading_task_id: taskId,
      product_id: item.product_id,
      quantity_to_load: item.quantity,
      quantity_loaded: 0,
      is_loaded: false,
    }));

    const newTask: LoadingTask = {
      id: taskId,
      task_number: taskNumber,
      customer_order_id: orderId,
      source_warehouse_id: sourceWhId,
      vehicle_id: vehicleId,
      assigned_loader_id: loaderId,
      status: 'assigned',
      notes,
      items: taskItems,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...loadingTasks];
    setLoadingTasks(updatedTasks);

    if (isSupabaseConfigured) {
      await supabase.from('loading_tasks').insert([
        { id: taskId, task_number: taskNumber, customer_order_id: orderId, source_warehouse_id: sourceWhId, vehicle_id: vehicleId, assigned_loader_id: loaderId, status: 'assigned', notes },
      ]);
      await supabase.from('loading_task_items').insert(taskItems);
    } else {
      setLocalCollection('loading_tasks', updatedTasks);
    }

    showToast('Loading Task Assigned', `Task ${taskNumber} created for loader`, 'success');
  };

  const toggleTaskItemLoaded = async (taskId: string, itemId: string, isLoaded: boolean) => {
    const task = loadingTasks.find((t) => t.id === taskId);
    if (!task || !task.items) return;

    const updatedItems = task.items.map((item) =>
      item.id === itemId ? { ...item, is_loaded: isLoaded, quantity_loaded: isLoaded ? item.quantity_to_load : 0 } : item
    );

    const anyLoaded = updatedItems.some((i) => i.is_loaded);
    const allLoaded = updatedItems.every((i) => i.is_loaded);
    const newStatus = allLoaded ? 'completed' : anyLoaded ? 'in_progress' : 'assigned';

    const updatedTasks = loadingTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus as any, items: updatedItems, updated_at: new Date().toISOString() } : t));
    setLoadingTasks(updatedTasks);

    if (isSupabaseConfigured) {
      await supabase.from('loading_task_items').update({ is_loaded: isLoaded, quantity_loaded: isLoaded ? updatedItems.find(i=>i.id===itemId)?.quantity_to_load : 0 }).eq('id', itemId);
      await supabase.from('loading_tasks').update({ status: newStatus }).eq('id', taskId);
    } else {
      setLocalCollection('loading_tasks', updatedTasks);
    }
  };

  const completeLoadingTask = async (taskId: string) => {
    const task = loadingTasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTasks = loadingTasks.map((t) => (t.id === taskId ? { ...t, status: 'completed' as const, updated_at: new Date().toISOString() } : t));
    setLoadingTasks(updatedTasks);

    // Flow back status to customer order -> packed/loaded!
    if (task.customer_order_id) {
      await updateOrderStatus(task.customer_order_id, 'loaded');
    }

    if (isSupabaseConfigured) {
      await supabase.from('loading_tasks').update({ status: 'completed' }).eq('id', taskId);
    } else {
      setLocalCollection('loading_tasks', updatedTasks);
    }

    showToast('Task Completed', 'Vehicle load confirmed successfully', 'success');
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) setCategories((prev) => [...prev, category]);
  };

  const addUnit = (unit: string) => {
    if (!units.includes(unit)) setUnits((prev) => [...prev, unit]);
  };

  return (
    <DataContext.Provider
      value={{
        products,
        warehouses,
        suppliers,
        stocks,
        dailyPrices,
        priceLogs,
        movements,
        restockRequests,
        purchaseOrders,
        customerOrders,
        vehicles,
        loadingTasks,
        categories,
        units,
        addProduct,
        updateProduct,
        archiveProduct,
        addWarehouse,
        updateWarehouse,
        addSupplier,
        updateSupplier,
        setDailyPrice,
        bulkUpdateDailyPrices,
        getProductEffectivePrice,
        hasPriceConfirmedForToday,
        executeStockMovement,
        createRestockRequest,
        approveRestockRequest,
        rejectRestockRequest,
        createPurchaseOrder,
        receivePurchaseOrder,
        cancelPurchaseOrder,
        createCustomerOrder,
        updateOrderStatus,
        recordPayment,
        addVehicle,
        createLoadingTask,
        toggleTaskItemLoaded,
        completeLoadingTask,
        getProductTotalStock,
        getProductStockInWarehouse,
        addCategory,
        addUnit,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
