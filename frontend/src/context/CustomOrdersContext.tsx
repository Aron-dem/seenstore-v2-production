import { createContext, useContext, useState, ReactNode } from "react";
import { api, getToken } from "../lib/apiClient";

export type CustomOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  itemType: string;
  size: string;
  color: string;
  designUrl: string | null;
  details: string;
  status: "pending" | "processing" | "done" | "cancelled";
  adminNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type CustomOrdersContextType = {
  addOrder: (order: Omit<CustomOrder, "id" | "createdAt" | "status" | "adminNotes" | "updatedAt">) => Promise<string>;
  isSubmitting: boolean;
};

const CustomOrdersContext = createContext<CustomOrdersContextType | undefined>(undefined);

export function CustomOrdersProvider({ children }: { children: ReactNode }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOrder = async (order: Omit<CustomOrder, "id" | "createdAt" | "status" | "adminNotes" | "updatedAt">): Promise<string> => {
    setIsSubmitting(true);
    try {
      const data = await api.post<{ order: CustomOrder }>("/custom-orders", order);
      return data.order.id;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomOrdersContext.Provider value={{ addOrder, isSubmitting }}>
      {children}
    </CustomOrdersContext.Provider>
  );
}

export function useCustomOrders() {
  const ctx = useContext(CustomOrdersContext);
  if (!ctx) throw new Error("useCustomOrders must be used within CustomOrdersProvider");
  return ctx;
}
