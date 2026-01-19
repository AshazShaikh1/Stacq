
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: collectionId } = await params;
    const { action, title } = await request.json(); // action: 'convert' | 'clear'

    const supabase = await createClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const { data: collection } = await supabase
      .from("collections")
      .select("owner_id")
      .eq("id", collectionId)
      .single();

    if (!collection || collection.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === 'convert') {
        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        
        // 1. Create new section
        const { data: section, error: sectionError } = await supabase
            .from("sections")
            .insert({
                collection_id: collectionId,
                title: title,
                order: 999 // Add to end (or calculate max order?)
            })
            .select()
            .single();

        if (sectionError) throw sectionError;

        // 2. Move all uncategorized cards to this section
        const { error: updateError } = await supabase
            .from("collection_cards")
            .update({ section_id: section.id })
            .eq("collection_id", collectionId)
            .is("section_id", null);

        if (updateError) throw updateError;
        
        return NextResponse.json({ success: true, section });
    } 
    else if (action === 'clear') {
        // Delete all uncategorized cards
        const { error: deleteError } = await supabase
            .from("collection_cards")
            .delete()
            .eq("collection_id", collectionId)
            .is("section_id", null);
            
        if (deleteError) throw deleteError;
        
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("General section op error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
