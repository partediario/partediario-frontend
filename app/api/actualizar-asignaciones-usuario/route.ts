import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function PUT(request: Request) {
  try {
    const { usuarioId, asignaciones, empresasIds } = await request.json()

    console.log("[v0] Actualizando asignaciones para usuario:", usuarioId)
    console.log("[v0] Nuevas asignaciones:", asignaciones)
    console.log("[v0] Empresas del administrador:", empresasIds)

    if (!usuarioId || !asignaciones || !Array.isArray(asignaciones) || !empresasIds || !Array.isArray(empresasIds)) {
      return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: asignacionesActuales, error: errorActuales } = await supabase
      .from("pd_asignacion_usuarios")
      .select("id, empresa_id, establecimiento_id, rol_id")
      .eq("usuario_id", usuarioId)
      .in("empresa_id", empresasIds)

    if (errorActuales) {
      console.error("Error obteniendo asignaciones actuales:", errorActuales)
      return NextResponse.json({ success: false, error: "Error al obtener asignaciones actuales" }, { status: 500 })
    }

    console.log("[v0] Asignaciones actuales en BD (solo empresas del admin):", asignacionesActuales?.length || 0)

    const asignacionesAEliminar = (asignacionesActuales || []).filter((actual: any) => {
      return !asignaciones.some(
        (nueva: any) =>
          nueva.empresaId === actual.empresa_id.toString() &&
          nueva.establecimientoId === actual.establecimiento_id.toString(),
      )
    })

    const asignacionesACrear = asignaciones.filter((nueva: any) => {
      return !(asignacionesActuales || []).some(
        (actual: any) =>
          nueva.empresaId === actual.empresa_id.toString() &&
          nueva.establecimientoId === actual.establecimiento_id.toString(),
      )
    })

    const asignacionesAActualizar = asignaciones
      .filter((nueva: any) => {
        const actual = (asignacionesActuales || []).find(
          (a: any) =>
            nueva.empresaId === a.empresa_id.toString() && nueva.establecimientoId === a.establecimiento_id.toString(),
        )
        return actual && nueva.rolId !== actual.rol_id.toString()
      })
      .map((nueva: any) => {
        const actual = (asignacionesActuales || []).find(
          (a: any) =>
            nueva.empresaId === a.empresa_id.toString() && nueva.establecimientoId === a.establecimiento_id.toString(),
        )
        return {
          id: actual.id,
          rolId: nueva.rolId,
        }
      })

    console.log("[v0] Asignaciones a eliminar:", asignacionesAEliminar.length)
    console.log("[v0] Asignaciones a crear:", asignacionesACrear.length)
    console.log("[v0] Asignaciones a actualizar:", asignacionesAActualizar.length)

    if (asignacionesAEliminar.length > 0) {
      const { error: errorEliminar } = await supabase
        .from("pd_asignacion_usuarios")
        .delete()
        .in(
          "id",
          asignacionesAEliminar.map((a: any) => a.id),
        )

      if (errorEliminar) {
        console.error("Error eliminando asignaciones:", errorEliminar)
        return NextResponse.json({ success: false, error: "Error al eliminar asignaciones" }, { status: 500 })
      }
      console.log("[v0] Asignaciones eliminadas correctamente")
    }

    if (asignacionesACrear.length > 0) {
      const nuevasAsignaciones = asignacionesACrear.map((asig: any) => ({
        usuario_id: usuarioId,
        empresa_id: Number.parseInt(asig.empresaId),
        establecimiento_id: Number.parseInt(asig.establecimientoId),
        rol_id: Number.parseInt(asig.rolId),
        is_owner: false,
      }))

      const { error: errorCrear } = await supabase.from("pd_asignacion_usuarios").insert(nuevasAsignaciones)

      if (errorCrear) {
        console.error("Error creando asignaciones:", errorCrear)
        return NextResponse.json({ success: false, error: "Error al crear nuevas asignaciones" }, { status: 500 })
      }
      console.log("[v0] Asignaciones creadas correctamente")
    }

    if (asignacionesAActualizar.length > 0) {
      for (const asig of asignacionesAActualizar) {
        const { error: errorActualizar } = await supabase
          .from("pd_asignacion_usuarios")
          .update({ rol_id: Number.parseInt(asig.rolId) })
          .eq("id", asig.id)

        if (errorActualizar) {
          console.error("Error actualizando asignación:", errorActualizar)
          return NextResponse.json({ success: false, error: "Error al actualizar asignaciones" }, { status: 500 })
        }
      }
      console.log("[v0] Asignaciones actualizadas correctamente")
    }

    return NextResponse.json({
      success: true,
      message: "Asignaciones actualizadas correctamente",
      eliminadas: asignacionesAEliminar.length,
      creadas: asignacionesACrear.length,
      actualizadas: asignacionesAActualizar.length,
    })
  } catch (error) {
    console.error("Error en actualizar-asignaciones-usuario:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
