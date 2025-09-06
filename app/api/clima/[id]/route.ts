import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()

    console.log(`[API] PATCH /api/clima/${id}`)
    console.log("[API] Body:", body)

    const { data, error } = await supabase
      .from("pd_clima")
      .update({
        deleted: body.deleted,
        deleted_at: body.deleted_at,
        deleted_user_id: body.deleted_user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("[API] Error en soft delete:", error)
      return NextResponse.json({ error: "Error en soft delete", details: error.message }, { status: 500 })
    }

    console.log("[API] Soft delete exitoso:", data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Error en soft delete:", error)
    return NextResponse.json(
      { error: "Error en soft delete", details: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
