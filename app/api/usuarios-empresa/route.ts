import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = searchParams.get("empresaId")

    console.log("🔍 Fetching usuarios for empresa:", empresaId)

    if (!empresaId) {
      return NextResponse.json({ success: false, error: "ID de empresa requerido" }, { status: 400 })
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

    const { data: empresaInfo, error: empresaError } = await supabase
      .from("pd_empresas")
      .select("id, nombre")
      .eq("id", empresaId)
      .single()

    if (empresaError || !empresaInfo) {
      console.error("❌ Error fetching empresa info:", empresaError)
      return NextResponse.json({ success: false, error: "Empresa no encontrada" }, { status: 404 })
    }

    const { data: establecimientosEmpresa, error: establecimientosError } = await supabase
      .from("pd_establecimientos")
      .select("id, nombre")
      .eq("empresa_id", empresaId)

    if (establecimientosError) {
      console.error("❌ Error fetching establecimientos:", establecimientosError)
      return NextResponse.json({ success: false, error: "Error al obtener establecimientos" }, { status: 500 })
    }

    const establecimientosIds = establecimientosEmpresa?.map((est) => est.id) || []
    console.log("🏢 Establecimientos de la empresa:", establecimientosIds)

    const usuariosEmpresa = []

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

      const establecimientosDeEmpresa = Array.isArray(establecimientos)
        ? establecimientos.filter((est: any) => establecimientosIds.includes(est.id))
        : []

      if (establecimientosDeEmpresa.length > 0) {
        const establecimientosConNombres = establecimientosDeEmpresa.map((est: any) => ({
          id: est.id,
          nombre: est.nombre,
          roles: est.roles || [],
          privilegios: est.privilegios || [],
          is_owner: est.is_owner || false,
        }))

        const primerRol = establecimientosDeEmpresa
          .flatMap((est: any) => est.roles || [])
          .find((rol: any) => rol && rol.nombre)

        const isOwner = establecimientosDeEmpresa.some((est: any) => est.is_owner === true)

        const usuario = {
          id: profile.id,
          nombres: profile.nombres,
          apellidos: profile.apellidos,
          telefono: profile.phone || "Sin teléfono",
          email: profile.email || "Sin email",
          empresa_id: Number.parseInt(empresaId),
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

        usuariosEmpresa.push(usuario)
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

    console.log("✅ Total usuarios de la empresa:", usuariosEmpresa.length)

    return NextResponse.json({
      success: true,
      usuarios: usuariosEmpresa.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    })
  } catch (error) {
    console.error("❌ Error fetching usuarios:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
