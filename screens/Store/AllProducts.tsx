import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import {
    scale as s,
    verticalScale as vs,
    moderateScale as ms,
} from 'react-native-size-matters';

// Type definitions moved here
type Product = {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    stock_quantity: number;
};

// Assuming the User type from useUser has at least 'id' and 'store_id'
type User = {
    id: string; 
    store_id: string;
    // ... other user properties
};

type AllProductsProps = {
    products: Product[];
    user: User | null; // Pass user for cart logic
    navigation: any;
};

export default function AllProducts({ products, user, navigation }: AllProductsProps) {
    // Tracks the temporary quantity selected by the user for an item
    const [itemQuantities, setItemQuantities] = useState<{ [key: number]: number }>({});

    // --- LOCAL QUANTITY HANDLER ---
    const updateLocalQuantity = (productId: number, change: number) => {
        setItemQuantities(prev => {
            const currentQty = prev[productId] || 0;
            const newQty = Math.max(0, currentQty + change);
            return { ...prev, [productId]: newQty };
        });
    };
    
    // --- CART COMMIT LOGIC (Always adds >= 1 unit) ---
    const commitToCart = async (product: Product) => {
        if (!user) return;
        
        // 1. Determine quantity: Use the selected quantity, or default to 1
        let quantityToAdd = itemQuantities[product.id] || 0;
        if (quantityToAdd === 0) {
            quantityToAdd = 1; 
        }

        // Optimistically reset the local counter for the selected item
        setItemQuantities(prev => ({ ...prev, [product.id]: 0 })); 

        try {
            // 2. Backend Logic: Check if item exists in the cart
            const { data: existingItem } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .eq('store_id', user.store_id)
                .maybeSingle();

            const finalNewQty = (existingItem?.quantity || 0) + quantityToAdd;

            if (existingItem) {
                // UPDATE: Add the determined quantity to the existing quantity
                await supabase
                    .from('cart_items')
                    .update({ quantity: finalNewQty })
                    .eq('id', existingItem.id);
            } else {
                // INSERT: Add a new item with the determined quantity
                await supabase.from('cart_items').insert([
                    {
                        user_id: user.id,
                        product_id: product.id,
                        store_id: user.store_id,
                        quantity: quantityToAdd,
                    },
                ]);
            }
            
            // 3. SUCCESS ALERT 
            Alert.alert('Success', `${quantityToAdd} item(s) added to cart successfully!`);

        } catch (error: any) {
            Alert.alert('Error', error.message);
            // Revert the local counter if the database transaction fails
            setItemQuantities(prev => ({ ...prev, [product.id]: quantityToAdd }));
        }
    };

    // --- RENDER PRODUCT CARD ---
    const renderProductCard = (item: Product) => {
        const quantity = itemQuantities[item.id] || 0;

        return (
            <View key={item.id} style={localStyles.card}>
                {/* Left: Image */}
                <Image source={{ uri: item.image_url }} style={localStyles.image} />

                {/* Middle: Info (Name, Price) */}
                <View style={localStyles.info}>
                    <Text style={localStyles.name}>{item.name}</Text>
                    <Text style={localStyles.price}>${item.price.toFixed(2)}</Text>
                </View>

                {/* Right: Vertical Action Section */}
                <View style={localStyles.actionColumn}>
                    
                    {/* 1. ADD Button (Commits to Cart - Always Active) */}
                    <TouchableOpacity 
                        style={localStyles.addBtnSmall} 
                        onPress={() => commitToCart(item)}
                    >
                        <Text style={localStyles.addBtnText}>ADD</Text>
                    </TouchableOpacity>

                    {/* 2. Horizontal Counter (Local Quantity Selector) */}
                    <View style={localStyles.horizontalCounter}>
                        <TouchableOpacity 
                            style={localStyles.counterBtn}
                            onPress={() => updateLocalQuantity(item.id, -1)}
                            disabled={quantity === 0}
                        >
                            <Text style={[localStyles.counterSymbol, {opacity: quantity === 0 ? 0.3 : 1}]}>-</Text>
                        </TouchableOpacity>
                        
                        <Text style={localStyles.counterText}>{quantity}</Text>
                        
                        <TouchableOpacity 
                            style={localStyles.counterBtn} 
                            onPress={() => updateLocalQuantity(item.id, 1)}
                        >
                            <Text style={localStyles.counterSymbol}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ width: '100%' }}>
            
            {/* HEADER ROW: Title + Cart Button */}
            <View style={localStyles.listHeader}>
                <Text style={localStyles.productListTitle}>All Products</Text>
                
                <TouchableOpacity 
                    style={localStyles.headerCartBtn}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Text style={localStyles.headerCartText}>Cart 🛒</Text>
                </TouchableOpacity>
            </View>

            {products.length > 0 ? (
                products.map(renderProductCard)
            ) : (
                <Text style={localStyles.emptyText}>No products found.</Text>
            )}
        </View>
    );
}

// --- LOCAL STYLES ---
const localStyles = StyleSheet.create({
    // --- HEADER STYLES ---
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(15),
        width: '100%',
    },
    productListTitle: {
        fontSize: ms(24),
        fontWeight: '900',
        color: '#333',
    },
    headerCartBtn: {
        backgroundColor: '#00c6ff',
        paddingVertical: vs(6),
        paddingHorizontal: ms(14),
        borderRadius: ms(20),
    },
    headerCartText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: ms(14),
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    // --- CARD STYLES ---
    card: {
        flexDirection: 'row',
        backgroundColor: '#64008b10',
        borderRadius: ms(15),
        marginBottom: vs(15),
        padding: ms(10),
        alignItems: 'center',
    },
    image: {
        width: s(70),
        height: s(70),
        borderRadius: ms(12),
        backgroundColor: '#eee',
    },
    info: {
        flex: 1,
        marginLeft: ms(15),
        justifyContent: 'center',
        height: s(70),
    },
    name: {
        fontSize: ms(16),
        fontWeight: '900',
        color: '#333',
        marginBottom: vs(4),
    },
    price: {
        fontSize: ms(15),
        color: '#31313181',
        fontWeight: '700',
    },
    
    // --- RIGHT COLUMN STYLES ---
    actionColumn: {
        width: s(90), 
        height: s(70),
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginLeft: ms(5),
    },
    addBtnSmall: {
        backgroundColor: '#340052ff',
        width: s(90), 
        height: s(30),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnText: {
        color: 'white',
        fontSize: ms(12),
        fontWeight: '900',
    },
    
    // *** HORIZONTAL COUNTER STYLES ***
    horizontalCounter: {
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#34005218',
        borderRadius: ms(10), 
        width: '100%',
        height: vs(25), 
    },
    counterBtn: {
        marginHorizontal: s(15),
        alignItems: 'center',
        justifyContent: 'center', 
    },
    counterSymbol: {
        fontSize: ms(20),
        color: '#555',
        fontWeight: '900',
    },
    counterText: {
        fontSize: ms(15),
        fontWeight: '900',
        color: '#333',
        minWidth: s(15), 
        textAlign: 'center',
    },
});