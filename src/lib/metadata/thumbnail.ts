import { createServiceClient } from '@/lib/supabase/api-service';

/**
 * Download and upload thumbnail to Supabase Storage
 */
export async function uploadThumbnail(
  imageUrl: string,
  cardId: string,
  userId: string
): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    
    // Download the image
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StackBot/1.0)',
      },
    });
    
    if (!imageResponse.ok) {
      console.error(`Failed to download thumbnail: ${imageResponse.status}`);
      return null;
    }
    
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    
    // Determine file extension from content type or URL
    const contentType = imageResponse.headers.get('content-type') || '';
    let extension = 'jpg';
    
    if (contentType.includes('png')) {
      extension = 'png';
    } else if (contentType.includes('gif')) {
      extension = 'gif';
    } else if (contentType.includes('webp')) {
      extension = 'webp';
    } else {
      // Try to get extension from URL
      const urlMatch = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
      if (urlMatch) {
        extension = urlMatch[1].toLowerCase();
      }
    }
    
    // Upload to Supabase Storage
    const fileName = `cards/${userId}/${cardId}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, imageBuffer, {
        contentType: contentType || `image/${extension}`,
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Error uploading thumbnail:', uploadError);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadThumbnail:', error);
    return null;
  }
}

