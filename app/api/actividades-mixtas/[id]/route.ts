import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actividadId = params.id

    console.log("🔍 Obteniendo actividad mixta con ID:", actividadId)

    // Obtener la actividad principal
    const { data: actividad, error: actividadError } = await supabase
      .from("pd_actividades")
      .select(`
        *,
        pd_tipo_actividades:tipo_actividad_id (
          id,
          nombre,
          ubicacion,
          animales,
          insumos
        ),
        pd_usuarios:user_id (
          nombres,
          apellidos
        )
      `)
      .eq("id", actividadId)
      .single()

    if (actividadError) {
      console.error("❌ Error obteniendo actividad:", actividadError)
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    // Obtener los detalles de animales
    const { data: detallesAnimales, error: animalesError } = await supabase
      .from("pd_actividad_animales")
      .select(`
        *,
        pd_categoria_animales:categoria_animal_id (
          id,
          nombre
        ),
        pd_lotes:lote_id (
          id,
          nombre
        )
      `)
      .eq("actividad_id", actividadId)

    if (animalesError) {
      console.error("❌ Error obteniendo detalles de animales:", animalesError)
    }

    // Obtener los detalles de insumos
    const { data: detallesInsumos, error: insumosError } = await supabase
      .from("pd_actividad_insumos")
      .select("*")
      .eq("actividad_id", actividadId)

    if (insumosError) {
      console.error("❌ Error obteniendo detalles de insumos:", insumosError)
    }

    // Obtener información completa de los insumos por separado
    let insumosConDetalles = []
    if (detallesInsumos && detallesInsumos.length > 0) {
      const insumosIds = detallesInsumos.map((d) => d.insumo_id)

      // Primero intentar obtener los insumos básicos sin unidad de medida
      const { data: insumosBasicos, error: insumosBasicosError } = await supabase
        .from("pd_insumos")
        .select("id, nombre")
        .in("id", insumosIds)

      if (insumosBasicosError) {
        console.error("❌ Error obteniendo información básica de insumos:", insumosBasicosError)
        // Si falla, crear estructura básica
        insumosConDetalles = detallesInsumos.map((detalle) => ({
          ...detalle,
          pd_insumos: {
            id: detalle.insumo_id,
            nombre: `Insumo ${detalle.insumo_id}`,
            pd_unidad_medida_insumos: null,
          },
        }))
      } else {
        // Intentar obtener las unidades de medida
        // Primero necesitamos saber cuál es el nombre correcto de la columna
        // Vamos a intentar diferentes nombres posibles
        let insumosConUnidades = []

        // Intentar con unidad_medida_insumo_id
        const { data: insumosConUnidad1, error: error1 } = await supabase
          .from("pd_insumos")
          .select("id, nombre, unidad_medida_insumo_id")
          .in("id", insumosIds)

        if (!error1 && insumosConUnidad1) {
          console.log("✅ Usando columna unidad_medida_insumo_id")
          insumosConUnidades = insumosConUnidad1

          // Obtener las unidades de medida
          const unidadesIds = insumosConUnidades.map((i) => i.unidad_medida_insumo_id).filter(Boolean)
          let unidadesMedida = []

          if (unidadesIds.length > 0) {
            const { data: unidadesData, error: unidadesError } = await supabase
              .from("pd_unidad_medida_insumos")
              .select("id, nombre")
              .in("id", unidadesIds)

            if (!unidadesError) {
              unidadesMedida = unidadesData || []
            }
          }

          // Combinar todos los datos
          insumosConDetalles = detallesInsumos.map((detalle) => {
            const insumoInfo = insumosConUnidades.find((info) => info.id === detalle.insumo_id)
            const unidadMedida = unidadesMedida.find((u) => u.id === insumoInfo?.unidad_medida_insumo_id)

            return {
              ...detalle,
              pd_insumos: insumoInfo
                ? {
                    id: insumoInfo.id,
                    nombre: insumoInfo.nombre,
                    pd_unidad_medida_insumos: unidadMedida
                      ? {
                          nombre: unidadMedida.nombre,
                        }
                      : null,
                  }
                : null,
            }
          })
        } else {
          // Si falla, intentar con otros nombres posibles o usar solo datos básicos
          console.log("⚠️ No se pudo obtener unidades de medida, usando datos básicos")
          insumosConDetalles = detallesInsumos.map((detalle) => {
            const insumoInfo = insumosBasicos?.find((info) => info.id === detalle.insumo_id)
            return {
              ...detalle,
              pd_insumos: insumoInfo
                ? {
                    id: insumoInfo.id,
                    nombre: insumoInfo.nombre,
                    pd_unidad_medida_insumos: null,
                  }
                : {
                    id: detalle.insumo_id,
                    nombre: `Insumo ${detalle.insumo_id}`,
                    pd_unidad_medida_insumos: null,
                  },
            }
          })
        }
      }
    }

    console.log("✅ Actividad mixta obtenida:", {
      actividad,
      animales: detallesAnimales?.length || 0,
      insumos: insumosConDetalles?.length || 0,
      insumosDetalle: insumosConDetalles,
    })

    return NextResponse.json({
      ...actividad,
      pd_actividades_animales_detalle: detallesAnimales || [],
      pd_actividades_insumos_detalle: insumosConDetalles || [],
    })
  } catch (error) {
    console.error("❌ Error en API actividades-mixtas GET:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const actividadId = params.id
    const body = await request.json()
    console.log("📝 Actualizando actividad mixta ID:", actividadId)
    console.log("📝 Datos recibidos:", JSON.stringify(body, null, 2))

    const { fecha, hora, nota, detalles_animales, detalles_insumos } = body

    // Validaciones básicas
    if (!fecha || !hora) {
      return NextResponse.json({ error: "Fecha y hora son requeridos" }, { status: 400 })
    }

    // Verificar que la actividad existe
    const { data: actividadExistente, error: verificarError } = await supabase
      .from("pd_actividades")
      .select("id")
      .eq("id", actividadId)
      .single()

    if (verificarError || !actividadExistente) {
      console.error("❌ Actividad no encontrada:", verificarError)
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    // Actualizar la actividad principal
    const { error: updateError } = await supabase
      .from("pd_actividades")
      .update({
        fecha,
        hora,
        nota: nota || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", actividadId)

    if (updateError) {
      console.error("❌ Error actualizando actividad:", updateError)
      return NextResponse.json({ error: "Error al actualizar la actividad" }, { status: 500 })
    }

    // Eliminar detalles existentes de animales
    const { error: deleteAnimalesError } = await supabase
      .from("pd_actividad_animales")
      .delete()
      .eq("actividad_id", actividadId)

    if (deleteAnimalesError) {
      console.error("❌ Error eliminando detalles de animales:", deleteAnimalesError)
      return NextResponse.json({ error: "Error al eliminar detalles de animales" }, { status: 500 })
    }

    // Eliminar detalles existentes de insumos
    const { error: deleteInsumosError } = await supabase
      .from("pd_actividad_insumos")
      .delete()
      .eq("actividad_id", actividadId)

    if (deleteInsumosError) {
      console.error("❌ Error eliminando detalles de insumos:", deleteInsumosError)
      return NextResponse.json({ error: "Error al eliminar detalles de insumos" }, { status: 500 })
    }

    // Insertar nuevos detalles de animales si existen
    if (detalles_animales && detalles_animales.length > 0) {
      console.log("🐄 Insertando detalles de animales:", detalles_animales)

      // Validar que todos los detalles de animales tengan los campos requeridos
      for (let i = 0; i < detalles_animales.length; i++) {
        const detalle = detalles_animales[i]
        if (!detalle.lote_id || detalle.lote_id === 0) {
          return NextResponse.json({ error: `Detalle de animal ${i + 1}: lote_id es requerido` }, { status: 400 })
        }
        if (!detalle.categoria_animal_id || detalle.categoria_animal_id === 0) {
          return NextResponse.json(
            { error: `Detalle de animal ${i + 1}: categoria_animal_id es requerido` },
            { status: 400 },
          )
        }
      }

      // Validar que todas las categorías de animales existen
      const categoriasIds = detalles_animales.map((d: any) => Number.parseInt(d.categoria_animal_id)).filter(Boolean)
      if (categoriasIds.length > 0) {
        const { data: categoriasExistentes, error: categoriasError } = await supabase
          .from("pd_categoria_animales")
          .select("id")
          .in("id", categoriasIds)

        if (categoriasError) {
          console.error("❌ Error verificando categorías:", categoriasError)
          return NextResponse.json({ error: "Error al verificar categorías de animales" }, { status: 500 })
        }

        const categoriasExistentesIds = categoriasExistentes?.map((c) => c.id) || []
        const categoriasInvalidas = categoriasIds.filter((id) => !categoriasExistentesIds.includes(id))

        if (categoriasInvalidas.length > 0) {
          console.error("❌ Categorías de animales no válidas:", categoriasInvalidas)
          return NextResponse.json(
            {
              error: `Categorías de animales no válidas: ${categoriasInvalidas.join(", ")}`,
            },
            { status: 400 },
          )
        }
      }

      // Validar que todos los lotes existen
      const lotesIds = detalles_animales.map((d: any) => Number.parseInt(d.lote_id)).filter(Boolean)
      if (lotesIds.length > 0) {
        const { data: lotesExistentes, error: lotesError } = await supabase
          .from("pd_lotes")
          .select("id")
          .in("id", lotesIds)

        if (lotesError) {
          console.error("❌ Error verificando lotes:", lotesError)
          return NextResponse.json({ error: "Error al verificar lotes" }, { status: 500 })
        }

        const lotesExistentesIds = lotesExistentes?.map((l) => l.id) || []
        const lotesInvalidos = lotesIds.filter((id) => !lotesExistentesIds.includes(id))

        if (lotesInvalidos.length > 0) {
          console.error("❌ Lotes no válidos:", lotesInvalidos)
          return NextResponse.json(
            {
              error: `Lotes no válidos: ${lotesInvalidos.join(", ")}`,
            },
            { status: 400 },
          )
        }
      }

      const detallesAnimalesParaInsertar = detalles_animales.map((detalle: any) => {
        const registro = {
          actividad_id: Number.parseInt(actividadId),
          categoria_animal_id: Number.parseInt(detalle.categoria_animal_id),
          cantidad: Number.parseInt(detalle.cantidad),
          peso: Number.parseInt(detalle.peso),
          tipo_peso: detalle.tipo || "TOTAL",
          lote_id: Number.parseInt(detalle.lote_id),
        }

        console.log("🐄 Registro a insertar:", registro)
        return registro
      })

      const { error: insertAnimalesError } = await supabase
        .from("pd_actividad_animales")
        .insert(detallesAnimalesParaInsertar)

      if (insertAnimalesError) {
        console.error("❌ Error insertando nuevos detalles de animales:", insertAnimalesError)
        return NextResponse.json({ error: "Error al insertar nuevos detalles de animales" }, { status: 500 })
      }
    }

    // Insertar nuevos detalles de insumos si existen
    if (detalles_insumos && detalles_insumos.length > 0) {
      console.log("📦 Insertando detalles de insumos:", detalles_insumos)

      // Validar que todos los detalles de insumos tengan los campos requeridos
      for (let i = 0; i < detalles_insumos.length; i++) {
        const detalle = detalles_insumos[i]
        if (!detalle.insumo_id || detalle.insumo_id === 0) {
          return NextResponse.json({ error: `Detalle de insumo ${i + 1}: insumo_id es requerido` }, { status: 400 })
        }
      }

      // Validar que todos los insumos existen
      const insumosIds = detalles_insumos.map((d: any) => Number.parseInt(d.insumo_id)).filter(Boolean)
      if (insumosIds.length > 0) {
        const { data: insumosExistentes, error: insumosError } = await supabase
          .from("pd_insumos")
          .select("id")
          .in("id", insumosIds)

        if (insumosError) {
          console.error("❌ Error verificando insumos:", insumosError)
          return NextResponse.json({ error: "Error al verificar insumos" }, { status: 500 })
        }

        const insumosExistentesIds = insumosExistentes?.map((i) => i.id) || []
        const insumosInvalidos = insumosIds.filter((id) => !insumosExistentesIds.includes(id))

        if (insumosInvalidos.length > 0) {
          console.error("❌ Insumos no válidos:", insumosInvalidos)
          return NextResponse.json(
            {
              error: `Insumos no válidos: ${insumosInvalidos.join(", ")}`,
            },
            { status: 400 },
          )
        }
      }

      const detallesInsumosParaInsertar = detalles_insumos.map((detalle: any) => {
        const registro = {
          actividad_id: Number.parseInt(actividadId),
          insumo_id: Number.parseInt(detalle.insumo_id),
          cantidad: Number.parseInt(detalle.cantidad),
        }

        console.log("📦 Registro a insertar:", registro)
        return registro
      })

      const { error: insertInsumosError } = await supabase
        .from("pd_actividad_insumos")
        .insert(detallesInsumosParaInsertar)

      if (insertInsumosError) {
        console.error("❌ Error insertando nuevos detalles de insumos:", insertInsumosError)
        return NextResponse.json({ error: "Error al insertar nuevos detalles de insumos" }, { status: 500 })
      }
    }

    console.log("✅ Actividad mixta actualizada exitosamente")

    return NextResponse.json({
      success: true,
      message: "Actividad mixta actualizada correctamente",
    })
  } catch (error) {
    console.error("❌ Error en API actividades-mixtas PUT:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
