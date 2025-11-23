import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient';
import {
    scale as s,
    verticalScale as vs,
    moderateScale as ms,
} from 'react-native-size-matters';

// Type Definitions (Copied for local use if not in a shared file)
type Product = {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    stock_quantity: number;
};

type User = {
    id: string; 
    store_id: string;
};

export default function ProductDetails({ route, navigation }: any) {
    // Get product and user from Navigation Params
    const { product, user } = route.params as { product: Product, user: User };

    const [quantity, setQuantity] = useState(0);

    // --- QUANTITY HANDLER ---
    const updateQuantity = (change: number) => {
        setQuantity(prev => Math.max(0, prev + change));
    };

    // --- CART LOGIC ---
    const addToCart = async () => {
        if (!user) return;
        
        // If 0 is selected, default to 1, otherwise use selected quantity
        const qtyToAdd = quantity === 0 ? 1 : quantity;

        try {
            const { data: existingItem } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', product.id)
                .eq('store_id', user.store_id)
                .maybeSingle();

            const finalNewQty = (existingItem?.quantity || 0) + qtyToAdd;

            if (existingItem) {
                await supabase
                    .from('cart_items')
                    .update({ quantity: finalNewQty })
                    .eq('id', existingItem.id);
            } else {
                await supabase.from('cart_items').insert([
                    {
                        user_id: user.id,
                        product_id: product.id,
                        store_id: user.store_id,
                        quantity: qtyToAdd,
                    },
                ]);
            }
            
            Alert.alert(
                'Success', 
                `${qtyToAdd} ${product.name}(s) added to cart!`,
                [
                    { text: "Keep Shopping", onPress: () => navigation.goBack() },
                    { text: "Go to Cart", onPress: () => navigation.navigate('Cart') }
                ]
            );

        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* BACK BUTTON (Optional, if you hide default header) */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* LARGE IMAGE */}
                <View style={styles.imageContainer}>
                    <Image 
                        source={{ uri: product.image_url }} 
                        style={styles.image} 
                        resizeMode="cover"
                    />
                </View>

                {/* DETAILS CONTAINER */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.title}>{product.name}</Text>
                    <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                    
                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>
                        {product.description || "No description provided for this product."}
                    </Text>
                </View>
            </ScrollView>

            {/* BOTTOM ACTION BAR (Sticky at bottom) */}
            <View style={styles.bottomBar}>
                {/* Counter */}
                <View style={styles.counterWrapper}>
                    <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => updateQuantity(-1)}
                        disabled={quantity === 0}
                    >
                        <Text style={[styles.counterSymbol, {opacity: quantity === 0 ? 0.3 : 1}]}>-</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.counterText}>{quantity}</Text>
                    
                    <TouchableOpacity 
                        style={styles.counterBtn} 
                        onPress={() => updateQuantity(1)}
                    >
                        <Text style={styles.counterSymbol}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Add Button */}
                <TouchableOpacity 
                    style={styles.addBtn} 
                    onPress={addToCart}
                >
                    <Text style={styles.addBtnText}>ADD TO CART</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    backButton: {
        marginTop: vs(40), // Adjust for status bar
        marginLeft: ms(20),
        marginBottom: vs(10),
        zIndex: 10,
    },
    backButtonText: {
        fontSize: ms(16),
        color: '#333',
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingBottom: vs(100), // Space for bottom bar
    },
    imageContainer: {
        width: '100%',
        height: vs(300),
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '80%',
        height: '80%',
        borderRadius: ms(20),
    },
    detailsContainer: {
        padding: ms(20),
        backgroundColor: 'white',
        borderTopLeftRadius: ms(30),
        borderTopRightRadius: ms(30),
        marginTop: -vs(30), // Overlap effect
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    title: {
        fontSize: ms(26),
        fontWeight: '900',
        color: '#333',
        marginBottom: vs(5),
    },
    price: {
        fontSize: ms(24),
        color: '#340052ff', // Brand Purple
        fontWeight: '700',
        marginBottom: vs(15),
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#eee',
        marginBottom: vs(20),
    },
    sectionTitle: {
        fontSize: ms(16),
        fontWeight: 'bold',
        color: '#666',
        marginBottom: vs(8),
    },
    description: {
        fontSize: ms(15),
        color: '#444',
        lineHeight: ms(24),
    },
    
    // --- BOTTOM BAR STYLES ---
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        flexDirection: 'row',
        padding: ms(20),
        paddingBottom: vs(30), // Safe area for iOS
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: ms(15),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 10,
    },
    counterWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#34005218',
        borderRadius: ms(15),
        height: vs(50),
        width: s(130),
    },
    counterBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    counterSymbol: {
        fontSize: ms(24),
        color: '#555',
        fontWeight: '900',
    },
    counterText: {
        fontSize: ms(18),
        fontWeight: '900',
        color: '#333',
    },
    addBtn: {
        flex: 1,
        backgroundColor: '#340052ff',
        height: vs(50),
        borderRadius: ms(15),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#340052",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    addBtnText: {
        color: 'white',
        fontSize: ms(16),
        fontWeight: '900',
        letterSpacing: 1,
    },
});