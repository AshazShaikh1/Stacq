import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";

// DELETE section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership via collection
    const { data: section, error: fetchError } = await supabase
      .from("sections")
      .select("collection_id, collections(owner_id)")
      .eq("id", id)
      .single();

    if (fetchError || !section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // @ts-ignore - Supabase types might not infer nested join perfectly or 'collections' might be array
    const ownerId = section.collections?.owner_id;

    if (ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("sections")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH section (Rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const supabase = await createClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const { data: section, error: fetchError } = await supabase
      .from("sections")
      .select("collection_id, collections(owner_id)")
      .eq("id", id)
      .single();

    if (fetchError || !section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // @ts-ignore
    const ownerId = section.collections?.owner_id;

    if (ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updatedSection, error: updateError } = await supabase
      .from("sections")
      .update({ title: title.trim() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ section: updatedSection });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
