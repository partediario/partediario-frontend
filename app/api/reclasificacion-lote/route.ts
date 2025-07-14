import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  console.log("🔄 API reclasificacion-lote - Iniciando...")

  try {
    const body = await request.json()
    console.log("📋 Datos recibidos completos:", JSON.stringify(body, null, 2))

    const { establecimiento_id, lote_id, user_id, fecha, hora, nota, reclasificaciones } = body

    // Validaciones detalladas
    console.log("🔍 Validando campos...")
    console.log("- establecimiento_id:", establecimiento_id, typeof establecimiento_id)
    console.log("- lote_id:", lote_id, typeof lote_id)
    console.log("- user_id:", user_id, typeof user_id)
    console.log("- fecha:", fecha, typeof fecha)
    console.log("- hora:", hora, typeof hora)
    console.log("- nota:", nota, typeof nota)
    console.log("- reclasificaciones:", reclasificaciones, Array.isArray(reclasificaciones))

    if (!establecimiento_id || !lote_id || !user_id || !fecha || !hora || !reclasificaciones) {
      console.log("❌ Error: Faltan campos requeridos")
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (!Array.isArray(reclasificaciones) || reclasificaciones.length === 0) {
      console.log("❌ Error: No hay reclasificaciones para procesar")
      return NextResponse.json({ error: "Debe incluir al menos una reclasificación" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log("✅ Cliente Supabase creado")

    // Usar directamente el ID 38 para RECLASIFICACION
    const tipoActividadId = 38
    console.log("✅ Usando tipo de actividad ID:", tipoActividadId)

    // Crear actividad en pd_actividades
    const datosActividad = {
      establecimiento_id: Number(establecimiento_id),
      tipo_actividad_id: tipoActividadId,
      user_id: user_id, // UUID string
      fecha: fecha, // formato YYYY-MM-DD
      hora: hora, // formato HH:MM
      nota: nota || null, // Usar la nota del usuario o null si está vacía
    }

    console.log("📝 Datos para insertar actividad:", JSON.stringify(datosActividad, null, 2))

    const { data: actividad, error: errorActividad } = await supabase
      .from("pd_actividades")
      .insert(datosActividad)
      .select("id")
      .single()

    if (errorActividad) {
      console.error("❌ Error completo creando actividad:", {
        message: errorActividad.message,
        details: errorActividad.details,
        hint: errorActividad.hint,
        code: errorActividad.code,
        error: errorActividad,
      })
      return NextResponse.json(
        {
          error: "Error al crear la actividad",
          message: errorActividad.message,
          details: errorActividad.details,
          hint: errorActividad.hint,
          code: errorActividad.code,
          datosEnviados: datosActividad,
        },
        { status: 500 },
      )
    }

    if (!actividad || !actividad.id) {
      console.error("❌ No se obtuvo ID de la actividad creada")
      return NextResponse.json({ error: "No se pudo obtener el ID de la actividad creada" }, { status: 500 })
    }

    console.log("✅ Actividad creada con ID:", actividad.id)

    // Actualizar directamente pd_lote_stock y crear registros en pd_actividad_animales
    console.log("🔄 Procesando reclasificaciones...")
    const actualizacionesExitosas = []
    const actualizacionesFallidas = []

    for (const reclasificacion of reclasificaciones) {
      const { lote_stock_id, nueva_categoria_id } = reclasificacion

      console.log(`🔄 Procesando lote_stock_id ${lote_stock_id} a categoría ${nueva_categoria_id}`)

      try {
        // Primero obtener los datos actuales del stock para el registro en pd_actividad_animales
        const { data: stockActual, error: errorStock } = await supabase
          .from("pd_lote_stock")
          .select("categoria_animal_id, cantidad, peso_total, lote_id")
          .eq("id", lote_stock_id)
          .single()

        if (errorStock || !stockActual) {
          console.error(`❌ Error obteniendo stock actual ${lote_stock_id}:`, errorStock)
          actualizacionesFallidas.push({ lote_stock_id, error: "No se pudo obtener el stock actual" })
          continue
        }

        console.log(`📊 Stock actual para ${lote_stock_id}:`, stockActual)

        // Actualizar pd_lote_stock
        const { error: updateError } = await supabase
          .from("pd_lote_stock")
          .update({ categoria_animal_id: nueva_categoria_id })
          .eq("id", lote_stock_id)

        if (updateError) {
          console.error(`❌ Error actualizando lote_stock_id ${lote_stock_id}:`, updateError)
          actualizacionesFallidas.push({ lote_stock_id, error: updateError.message })
          continue
        }

        console.log(`✅ Actualizado lote_stock_id ${lote_stock_id}`)

        // Crear registro en pd_actividad_animales
        const datosActividadAnimal = {
          actividad_id: actividad.id,
          categoria_animal_id: nueva_categoria_id, // Nueva categoría
          cantidad: stockActual.cantidad,
          peso: stockActual.peso_total,
          tipo_peso: "TOTAL" as const,
          lote_id: Number(lote_id),
          categoria_animal_id_anterior: stockActual.categoria_animal_id, // Categoría anterior
          peso_anterior: stockActual.peso_total,
          tipo_peso_anterior: "TOTAL" as const,
        }

        console.log(`📝 Creando registro actividad animal:`, datosActividadAnimal)

        const { error: errorActividadAnimal } = await supabase
          .from("pd_actividad_animales")
          .insert(datosActividadAnimal)

        if (errorActividadAnimal) {
          console.error(`❌ Error creando actividad animal para ${lote_stock_id}:`, errorActividadAnimal)
          // No marcamos como fallida la actualización porque el stock ya se actualizó
        } else {
          console.log(`✅ Registro actividad animal creado para ${lote_stock_id}`)
        }

        actualizacionesExitosas.push({ lote_stock_id, nueva_categoria_id })
      } catch (error) {
        console.error(`❌ Error general procesando lote_stock_id ${lote_stock_id}:`, error)
        actualizacionesFallidas.push({
          lote_stock_id,
          error: error instanceof Error ? error.message : "Error desconocido",
        })
      }
    }

    if (actualizacionesFallidas.length > 0) {
      console.error("❌ Algunas actualizaciones fallaron:", actualizacionesFallidas)
      return NextResponse.json(
        {
          error: "Error al actualizar algunos registros de stock",
          fallidas: actualizacionesFallidas,
          exitosas: actualizacionesExitosas,
        },
        { status: 500 },
      )
    }

    console.log("✅ Reclasificación completada exitosamente")
    console.log("📊 Resumen:", {
      actividad_id: actividad.id,
      actualizaciones_exitosas: actualizacionesExitosas.length,
      total_procesado: reclasificaciones.length,
    })

    return NextResponse.json({
      success: true,
      message: "Reclasificación guardada exitosamente",
      actividad_id: actividad.id,
      reclasificaciones_procesadas: reclasificaciones.length,
      actualizaciones_exitosas: actualizacionesExitosas.length,
    })
  } catch (error) {
    console.error("❌ Error general en API:", error)
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
