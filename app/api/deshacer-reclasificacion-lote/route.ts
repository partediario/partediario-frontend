import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { actividad_id, user_id, detalles_animales } = await request.json()

    if (!actividad_id || !user_id || !detalles_animales || !Array.isArray(detalles_animales)) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    // Para cada detalle de reclasificación, revertir el cambio
    for (const detalle of detalles_animales) {
      const {
        lote_id,
        categoria_animal_id, // Categoría actual (a la que se movió)
        categoria_animal_id_anterior, // Categoría anterior (de donde vino)
        cantidad,
        peso,
      } = detalle

      // 1. Buscar el registro actual con la nueva categoría
      const { data: stockActual, error: errorBuscar } = await supabase
        .from("pd_lote_stock")
        .select("id, cantidad, peso_total")
        .eq("lote_id", lote_id)
        .eq("categoria_animal_id", categoria_animal_id)
        .single()

      if (errorBuscar || !stockActual) {
        console.error(
          `Error buscando stock actual para lote ${lote_id}, categoría ${categoria_animal_id}:`,
          errorBuscar,
        )
        return NextResponse.json(
          { error: `No se encontró el stock actual para revertir la reclasificación` },
          { status: 404 },
        )
      }

      // 2. Restar la cantidad y peso del registro actual
      const nuevaCantidad = stockActual.cantidad - cantidad
      const nuevoPeso = stockActual.peso_total - peso

      if (nuevaCantidad < 0 || nuevoPeso < 0) {
        return NextResponse.json(
          { error: `No hay suficientes animales en la categoría ${categoria_animal_id} para revertir` },
          { status: 400 },
        )
      }

      if (nuevaCantidad === 0) {
        // Si queda en 0, eliminar el registro
        const { error: errorEliminar } = await supabase.from("pd_lote_stock").delete().eq("id", stockActual.id)

        if (errorEliminar) {
          console.error(`Error eliminando stock vacío:`, errorEliminar)
          return NextResponse.json({ error: "Error al eliminar stock vacío" }, { status: 500 })
        }
      } else {
        // Si queda cantidad, actualizar el registro
        const { error: errorActualizar } = await supabase
          .from("pd_lote_stock")
          .update({
            cantidad: nuevaCantidad,
            peso_total: nuevoPeso,
          })
          .eq("id", stockActual.id)

        if (errorActualizar) {
          console.error(`Error actualizando stock actual:`, errorActualizar)
          return NextResponse.json({ error: "Error al actualizar stock actual" }, { status: 500 })
        }
      }

      // 3. Buscar o crear el registro con la categoría anterior
      const { data: stockAnterior, error: errorBuscarAnterior } = await supabase
        .from("pd_lote_stock")
        .select("id, cantidad, peso_total")
        .eq("lote_id", lote_id)
        .eq("categoria_animal_id", categoria_animal_id_anterior)
        .maybeSingle()

      if (errorBuscarAnterior) {
        console.error(`Error buscando stock anterior:`, errorBuscarAnterior)
        return NextResponse.json({ error: "Error al buscar stock anterior" }, { status: 500 })
      }

      if (stockAnterior) {
        // Si existe, sumar la cantidad y peso
        const { error: errorSumar } = await supabase
          .from("pd_lote_stock")
          .update({
            cantidad: stockAnterior.cantidad + cantidad,
            peso_total: stockAnterior.peso_total + peso,
          })
          .eq("id", stockAnterior.id)

        if (errorSumar) {
          console.error(`Error sumando al stock anterior:`, errorSumar)
          return NextResponse.json({ error: "Error al sumar al stock anterior" }, { status: 500 })
        }
      } else {
        // Si no existe, crear un nuevo registro
        const { error: errorCrear } = await supabase.from("pd_lote_stock").insert({
          lote_id,
          categoria_animal_id: categoria_animal_id_anterior,
          cantidad,
          peso_total: peso,
        })

        if (errorCrear) {
          console.error(`Error creando stock anterior:`, errorCrear)
          return NextResponse.json({ error: "Error al crear stock anterior" }, { status: 500 })
        }
      }
    }

    // Actualizar la actividad como deshecha
    const { error: updateError } = await supabase
      .from("pd_actividades")
      .update({
        deshecho: true,
        deshecho_at: new Date().toISOString(),
        deshecho_user_id: user_id,
      })
      .eq("id", actividad_id)

    if (updateError) {
      console.error("Error actualizando actividad:", updateError)
      return NextResponse.json({ error: "Error al marcar actividad como deshecha" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Reclasificación deshecha exitosamente" })
  } catch (error) {
    console.error("Error en deshacer-reclasificacion-lote:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
