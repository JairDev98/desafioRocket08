import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // BUSCANDO ITENS EXISTENTES DENTRO DO ASSYNCSTORAGE
      const storagedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      // CASO ENCONTRAR MANDE PARA O SETPRODUCTS
      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productsExists = products.find(
        newProduct => product.id === newProduct.id,
      );

      // MAPEANDO TODOS OS PRODUCTS E VERIFICANDO SE O MESMO PRODUCT QUE ESTÁ SENDO PASSADO JÁ EXISTE DENTRO DO ESTADO
      // SE ELE FOR IGUAL, É PASSADO TODAS AS INFORMAÇÕES DO MESMO PRODUTO ALTERANDO APENAS A QUANTIDADE DELE DENTRO DO ESTADO
      if (productsExists) {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
          ),
        );
      } else {
        // CASO NÃO EXISTIR PASSAMOS VIA SPREAD O PRODUTO COM A QUANTIADE IGUAL A 1
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      // GRAVANDO ITEM NO ASSYNC STORAGE
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      // ELE VERIFICA SE O PRODUTO JÁ EXISTE NO MEU ARRAY DE PRODUCTS, CASO EXISTIR ELE MODIFICA A QUANTIDADE
      // CASO NÃO EXISTA ELE PASSA O PRODUTO SEM ALTERAÇÃO NA QUANTIDADE.

      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      // PASSANDO A VARIAVEL JÁ MAPEADA PARA O SETPRODUCTS
      setProducts(newProducts);

      // SETANDO ITENS NO ASSYNCSTORAGE EFETUANDO GRAVAÇÃO
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id && product.quantity > 1
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );
      setProducts(newProducts);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
