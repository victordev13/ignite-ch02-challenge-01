import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(({id}) => id === productId);

      const stock = await api.get(`stock/${productId}`)

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      if(productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get(`products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart));
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(({id}) => id === productId);
      
      if(!productExists) {
        toast.error('Erro na remoção do produto');
        return;
      }

      updatedCart.filter(item => item.id !== productExists.id);

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart));
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount < 1) return;
      const updatedCart = [...cart];
      const productExists = updatedCart.find(({id}) => id === productId);

      if(!productExists){
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;
      
      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      productExists.amount = amount;
      updatedCart.push(productExists);
  
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart',JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na edição do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
