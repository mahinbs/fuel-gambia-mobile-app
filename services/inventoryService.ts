import { supabase } from '../utils/supabase';
import { Inventory, FuelType } from '../types';

export const inventoryService = {
  async getInventory(stationId: string): Promise<Inventory | null> {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('id, name, petrol_stock, diesel_stock, created_at') // created_at as fallback for lastUpdated if no specific column
        .eq('id', stationId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        stationId: data.id,
        stationName: data.name,
        petrolStock: Number(data.petrol_stock),
        dieselStock: Number(data.diesel_stock),
        lastUpdated: data.created_at, // In a real app, you might want a 'updated_at' or specific inventory logs
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return null;
    }
  },

  async updateInventory(
    stationId: string,
    fuelType: FuelType,
    liters: number
  ): Promise<boolean> {
    try {
      const stockColumn = fuelType === FuelType.PETROL ? 'petrol_stock' : 'diesel_stock';
      
      // Using rpc for atomic update if defined, or simple update
      const { error } = await supabase
        .from('stations')
        .update({ [stockColumn]: liters }) // This replaces, should usually be an increment/decrement
        .eq('id', stationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating inventory:', error);
      return false;
    }
  },
};
