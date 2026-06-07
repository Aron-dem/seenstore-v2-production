import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, getToken } from "../lib/apiClient";

interface WishlistContextValue {
  wishlist: number[];
  toggleWishlist: (id: number) => void;
  isWishlisted: (id: number) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue>({
  wishlist: [],
  toggleWishlist: () => {},
  isWishlisted: () => false,
  count: 0,
});

function getLocalWishlist(): number[] {
  try {
    const s = localStorage.getItem("seenstore_wishlist");
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function saveLocalWishlist(ids: number[]) {
  localStorage.setItem("seenstore_wishlist", JSON.stringify(ids));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<number[]>(getLocalWishlist);
  const [synced,   setSynced]   = useState(false);

  // Sync from API when logged in
  useEffect(() => {
    if (!getToken() || synced) return;
    api.get<{ items: number[] }>("/me/wishlist")
      .then(d => {
        setWishlist(d.items);
        saveLocalWishlist(d.items);
        setSynced(true);
      })
      .catch(() => { /* offline — use localStorage */ });
  }, [synced]);

  const toggleWishlist = useCallback((id: number) => {
    setWishlist(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      saveLocalWishlist(next);
      if (getToken()) {
        if (prev.includes(id)) api.delete(`/me/wishlist/${id}`).catch(() => {});
        else                   api.post("/me/wishlist", { productId: id }).catch(() => {});
      }
      return next;
    });
  }, []);

  const isWishlisted = useCallback((id: number) => wishlist.includes(id), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, count: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
