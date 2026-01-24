/**
 * Marketplace - productos para MarketRollers
 */

import { supabase } from "../config/supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

const BUCKET_ID = "marketplace-fotos";

export const uploadMarketplaceImage = async (imageUri, userId) => {
  const timestamp = Date.now();
  const fileName = `marketplace/${userId}/product_${timestamp}_${Math.random()
    .toString(36)
    .slice(2)}.jpg`;

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: "base64",
  });
  const arrayBuffer = decode(base64);

  const { data, error } = await supabase.storage
    .from(BUCKET_ID)
    .upload(fileName, arrayBuffer, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "3600",
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage.from(BUCKET_ID).getPublicUrl(data.path);
  return publicData.publicUrl;
};

export const uploadMarketplaceImages = async (imageUris, userId) => {
  const urls = [];
  for (const uri of imageUris) {
    const url = await uploadMarketplaceImage(uri, userId);
    urls.push(url);
  }
  return urls;
};

export const getProductos = async () => {
  const { data, error } = await supabase
    .from("marketplace_productos")
    .select(
      `
        *,
        vendedor:usuarios!marketplace_productos_vendedor_id_fkey (
          id,
          nombre,
          ciudad
        )
      `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createProducto = async (productData, userId) => {
  const imageUrls = await uploadMarketplaceImages(productData.imagenes, userId);

  const { data, error } = await supabase
    .from("marketplace_productos")
    .insert([
      {
        nombre: productData.nombre.trim(),
        precio: Number(productData.precio),
        categoria: productData.categoria,
        imagenes: imageUrls,
        descripcion: productData.descripcion?.trim() || null,
        whatsapp: productData.whatsapp?.trim() || null,
        vendedor_id: userId,
      },
    ])
    .select(
      `
        *,
        vendedor:usuarios!marketplace_productos_vendedor_id_fkey (
          id,
          nombre,
          ciudad
        )
      `
    )
    .single();

  if (error) throw error;
  return data;
};

export const deleteProducto = async (productId, userId) => {
  const { error } = await supabase
    .from("marketplace_productos")
    .delete()
    .eq("id", productId)
    .eq("vendedor_id", userId);

  if (error) throw error;
  return true;
};
