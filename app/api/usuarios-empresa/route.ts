import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresaId")
    const empresasIds = searchParams.get("empresasIds")

    console.log("🔍 Fetching usuarios for empresa:", empresaId, "o empresas:", empresasIds)

    if (!empresaId && !empresasIds) {
      return NextResponse.json({ success: false, error: "ID de empresa o empresas requerido" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: userProfiles, error: profilesError } = await supabase.from("pd_user_profile_view").select("*")

    if (profilesError) {
      console.error("❌ Error fetching user profiles:", profilesError)
      return NextResponse.json({ success: false, error: "Error al obtener perfiles de usuarios" }, { status: 500 })
    }

    console.log("✅ User profiles found:", userProfiles?.length || 0)

    let empresasInfo = []
    let establecimientosEmpresa = []

    if (empresasIds) {
      // Múltiples empresas
      const empresasArray = empresasIds.split(",")
      console.log("🏢 Buscando usuarios de múltiples empresas:", empresasArray)

      const { data: empresasData, error: empresasError } = await supabase
        .from("pd_empresas")
        .select("id, nombre")
        .in("id", empresasArray)

      if (empresasError) {
        console.error("❌ Error fetching empresas info:", empresasError)
        return NextResponse.json({ success: false, error: "Error al obtener empresas" }, { status: 500 })
      }

      empresasInfo = empresasData || []

      const { data: establecimientosData, error: establecimientosError } = await supabase
        .from("pd_establecimientos")
        .select("id, nombre, empresa_id")
        .in("empresa_id", empresasArray)

      if (establecimientosError) {
        console.error("❌ Error fetching establecimientos:", establecimientosError)
        return NextResponse.json({ success: false, error: "Error al obtener establecimientos" }, { status: 500 })
      }

      establecimientosEmpresa = establecimientosData || []
    } else {
      // Una sola empresa (compatibilidad con código existente)
      const { data: empresaInfo, error: empresaError } = await supabase
        .from("pd_empresas")
        .select("id, nombre")
        .eq("id", empresaId)
        .single()

      if (empresaError || !empresaInfo) {
        console.error("❌ Error fetching empresa info:", empresaError)
        return NextResponse.json({ success: false, error: "Empresa no encontrada" }, { status: 404 })
      }

      empresasInfo = [empresaInfo]

      const { data: establecimientosData, error: establecimientosError } = await supabase
        .from("pd_establecimientos")
        .select("id, nombre, empresa_id")
        .eq("empresa_id", empresaId)

      if (establecimientosError) {
        console.error("❌ Error fetching establecimientos:", establecimientosError)
        return NextResponse.json({ success: false, error: "Error al obtener establecimientos" }, { status: 500 })
      }

      establecimientosEmpresa = establecimientosData || []
    }

    const establecimientosIds = establecimientosEmpresa?.map((est) => est.id) || []
    console.log("🏢 Establecimientos de las empresas:", establecimientosIds.length)

    const usuariosMap = new Map()

    for (const profile of userProfiles || []) {
      let establecimientos = profile.establecimientos
      if (typeof establecimientos === "string") {
        try {
          establecimientos = JSON.parse(establecimientos)
        } catch (e) {
          console.error("Error parsing establecimientos JSON:", e)
          establecimientos = []
        }
      }

      const establecimientosDeEmpresas = Array.isArray(establecimientos)
        ? establecimientos.filter((est: any) => establecimientosIds.includes(est.id))
        : []

      if (establecimientosDeEmpresas.length > 0) {
        const establecimientosPorEmpresa = new Map()

        for (const est of establecimientosDeEmpresas) {
          const establecimientoInfo = establecimientosEmpresa.find((e) => e.id === est.id)
          if (establecimientoInfo) {
            const empresaId = establecimientoInfo.empresa_id
            if (!establecimientosPorEmpresa.has(empresaId)) {
              establecimientosPorEmpresa.set(empresaId, [])
            }
            establecimientosPorEmpresa.get(empresaId).push({
              id: est.id,
              nombre: est.nombre,
              roles: est.roles || [],
              privilegios: est.privilegios || [],
              is_owner: est.is_owner || false,
            })
          }
        }

        const establecimientosConNombres = establecimientosDeEmpresas.map((est: any) => ({
          id: est.id,
          nombre: est.nombre,
          roles: est.roles || [],
          privilegios: est.privilegios || [],
          is_owner: est.is_owner || false,
        }))

        const primerRol = establecimientosDeEmpresas
          .flatMap((est: any) => est.roles || [])
          .find((rol: any) => rol && rol.nombre)

        const isOwner = establecimientosDeEmpresas.some((est: any) => est.is_owner === true)

        if (usuariosMap.has(profile.id)) {
          const usuarioExistente = usuariosMap.get(profile.id)
          // Agregar establecimientos que no estén ya en la lista
          for (const est of establecimientosConNombres) {
            if (!usuarioExistente.establecimientos.some((e: any) => e.id === est.id)) {
              usuarioExistente.establecimientos.push({
                id: est.id,
                nombre: est.nombre,
              })
            }
          }
        } else {
          const usuario = {
            id: profile.id,
            nombres: profile.nombres,
            apellidos: profile.apellidos,
            telefono: profile.phone || "Sin teléfono",
            email: profile.email || "Sin email",
            empresa_id: empresasInfo.length === 1 ? Number.parseInt(empresasInfo[0].id) : null,
            establecimientos: establecimientosConNombres.map((est) => ({
              id: est.id,
              nombre: est.nombre,
            })),
            rol: primerRol ? primerRol.nombre : "Sin rol",
            rol_id: primerRol ? primerRol.id : null,
            is_owner: isOwner,
            created_at: profile.created_at,
            last_sign_in: null,
          }

          usuariosMap.set(profile.id, usuario)
          console.log(
            "✅ Usuario processed:",
            profile.nombres,
            profile.apellidos,
            "Email:",
            profile.email,
            "Rol:",
            primerRol ? primerRol.nombre : "Sin rol",
            "is_owner:",
            isOwner,
            "Establecimientos:",
            establecimientosConNombres.length,
          )
        }
      }
    }

    const usuariosEmpresa = Array.from(usuariosMap.values())

    console.log("✅ Total usuarios únicos de las empresas:", usuariosEmpresa.length)

    return NextResponse.json({
      success: true,
      usuarios: usuariosEmpresa.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    })
  } catch (error) {
    console.error("❌ Error fetching usuarios:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
