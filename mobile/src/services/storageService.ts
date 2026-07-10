// Port dari lib/services/storage_service.dart (image_picker → expo-image-picker)
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

const ANNOUNCEMENT_BUCKET = 'announcement-images';
const PROFILE_AVATAR_BUCKET = 'profile-avatars';
const IURAN_PROOF_BUCKET = 'iuran-payment-proofs';
const RT_ASSETS_BUCKET = 'rt-assets';

export type RtAssetKind = 'kop' | 'signature' | 'qris';

export interface PickedImage {
  uri: string;
  mimeType?: string;
  fileName?: string;
}

function extensionOf(pathOrName: string): 'png' | 'webp' | 'jpg' {
  const lower = pathOrName.toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.webp')) return 'webp';
  return 'jpg';
}

function contentTypeOf(ext: string): string {
  return ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
}

async function toArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  return res.arrayBuffer();
}

export const storageService = {
  async pickImageFromGallery(): Promise<PickedImage | null> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || result.assets.length === 0) return null;
    const a = result.assets[0];
    return { uri: a.uri, mimeType: a.mimeType, fileName: a.fileName ?? undefined };
  },

  async pickImageFromCamera(): Promise<PickedImage | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled || result.assets.length === 0) return null;
    const a = result.assets[0];
    return { uri: a.uri, mimeType: a.mimeType, fileName: a.fileName ?? undefined };
  },

  async uploadAnnouncementImage(rtId: string, file: PickedImage): Promise<string> {
    const ext = extensionOf(file.fileName ?? file.uri);
    const path = `${rtId}/${Date.now()}.${ext}`;
    const buffer = await toArrayBuffer(file.uri);
    const { error } = await supabase.storage
      .from(ANNOUNCEMENT_BUCKET)
      .upload(path, buffer, { contentType: contentTypeOf(ext), upsert: false });
    if (error) throw error;
    return supabase.storage.from(ANNOUNCEMENT_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async uploadProfileAvatar(userId: string, file: PickedImage): Promise<string> {
    const ext = extensionOf(file.fileName ?? file.uri);
    const path = `${userId}/avatar.${ext}`;
    const buffer = await toArrayBuffer(file.uri);
    const { error } = await supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .upload(path, buffer, { contentType: contentTypeOf(ext), upsert: true });
    if (error) throw error;
    return supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  async uploadIuranPaymentProof(rtId: string, userId: string, file: PickedImage): Promise<string> {
    const ext = extensionOf(file.fileName ?? file.uri);
    const path = `${userId}/${rtId}/${Date.now()}.${ext}`;
    const buffer = await toArrayBuffer(file.uri);
    const { error } = await supabase.storage
      .from(IURAN_PROOF_BUCKET)
      .upload(path, buffer, { contentType: contentTypeOf(ext), upsert: false });
    if (error) throw error;
    return supabase.storage.from(IURAN_PROOF_BUCKET).getPublicUrl(path).data.publicUrl;
  },

  // Aset setting RT (kop surat, tanda tangan, QRIS). Bucket 'rt-assets',
  // path {rtId}/{kind}.ext, upsert (satu file per jenis per RT).
  async uploadRtAsset(rtId: string, kind: RtAssetKind, file: PickedImage): Promise<string> {
    const ext = extensionOf(file.fileName ?? file.uri);
    const path = `${rtId}/${kind}.${ext}`;
    const buffer = await toArrayBuffer(file.uri);
    const { error } = await supabase.storage
      .from(RT_ASSETS_BUCKET)
      .upload(path, buffer, { contentType: contentTypeOf(ext), upsert: true });
    if (error) throw error;
    // cache-bust karena upsert memakai path yang sama
    const base = supabase.storage.from(RT_ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
    return `${base}?t=${Date.now()}`;
  },
};
