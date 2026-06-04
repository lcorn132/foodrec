import React, { createContext, useContext, useMemo, useReducer } from "react";

const CartContext = createContext(null);

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const dish = action.payload;
      const cartKey = dish.cartKey || String(dish.id);
      const item = { ...dish, cartKey };
      const existing = state.items.find((i) => (i.cartKey || String(i.id)) === cartKey);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            (i.cartKey || String(i.id)) === cartKey ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      return { ...state, items: [...state.items, { ...item, qty: 1 }] };
    }
    case "REMOVE": {
      const cartKey = action.payload;
      return { ...state, items: state.items.filter((i) => (i.cartKey || String(i.id)) !== String(cartKey)) };
    }
    case "SET_QTY": {
      const { id, qty } = action.payload;
      const cartKey = String(id);
      const nextQty = Number.isFinite(qty) ? qty : 1;
      if (nextQty <= 0) {
        return { ...state, items: state.items.filter((i) => (i.cartKey || String(i.id)) !== cartKey) };
      }
      return {
        ...state,
        items: state.items.map((i) => ((i.cartKey || String(i.id)) === cartKey ? { ...i, qty: nextQty } : i)),
      };
    }
    case "UPDATE_VARIANT": {
      const { cartKey, nextItem } = action.payload;
      const nextKey = nextItem.cartKey || String(nextItem.id);
      const current = state.items.find((i) => (i.cartKey || String(i.id)) === String(cartKey));
      if (!current) return state;

      const merged = state.items.find((i) => (i.cartKey || String(i.id)) === nextKey);
      if (merged && nextKey !== String(cartKey)) {
        return {
          ...state,
          items: state.items
            .filter((i) => (i.cartKey || String(i.id)) !== String(cartKey))
            .map((i) => ((i.cartKey || String(i.id)) === nextKey ? { ...i, qty: i.qty + current.qty } : i)),
        };
      }

      return {
        ...state,
        items: state.items.map((i) =>
          (i.cartKey || String(i.id)) === String(cartKey)
            ? { ...i, ...nextItem, qty: current.qty }
            : i,
        ),
      };
    }
    case "CLEAR":
      return { ...state, items: [], voucher: null };
    case "SET_VOUCHER":
      return { ...state, voucher: action.payload };
    case "CLEAR_VOUCHER":
      return { ...state, voucher: null };
    default:
      return state;
  }
}

const initialState = { items: [], voucher: null };

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const value = useMemo(() => {
    const count = state.items.reduce((sum, i) => sum + i.qty, 0);
    const totalAmount = state.items.reduce(
      (sum, i) => sum + (Number(i.price) || 0) * i.qty,
      0,
    );
    const discountAmount = Math.min(Number(state.voucher?.discount_amount || 0), totalAmount);
    const payableAmount = Math.max(totalAmount - discountAmount, 0);
    return {
      items: state.items,
      voucher: state.voucher,
      count,
      getTotalItems: () => count,
      getTotalAmount: () => totalAmount,
      getDiscountAmount: () => discountAmount,
      getPayableAmount: () => payableAmount,
      addToCart: (dish) => dispatch({ type: "ADD", payload: dish }),
      removeFromCart: (id) => dispatch({ type: "REMOVE", payload: id }),
      setQty: (id, qty) => dispatch({ type: "SET_QTY", payload: { id, qty } }),
      updateQuantity: (id, qty) =>
        dispatch({ type: "SET_QTY", payload: { id, qty } }),
      updateVariant: (cartKey, nextItem) =>
        dispatch({ type: "UPDATE_VARIANT", payload: { cartKey, nextItem } }),
      setVoucher: (voucher) => dispatch({ type: "SET_VOUCHER", payload: voucher }),
      clearVoucher: () => dispatch({ type: "CLEAR_VOUCHER" }),
      clearCart: () => dispatch({ type: "CLEAR" }),
    };
  }, [state.items, state.voucher]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
