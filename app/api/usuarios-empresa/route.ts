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

    // Usar la vista pd_user_profile_view para obtener usuarios con sus datos completos
    const { data: userProfiles, error: profilesError } = await supabase.from("pd_user_profile_view").select("*")

    if (profilesError) {
      console.error("❌ Error fetching user profiles:", profilesError)
      return NextResponse.json({ success: false, error: "Error al obtener perfiles de usuarios" }, { status: 500 })
    }

    console.log("✅ User profiles found:", userProfiles?.length || 0)

    // Filtrar usuarios que pertenecen a la empresa seleccionada
    const usuariosEmpresa = []

    for (const profile of userProfiles || []) {
      // Parsear empresas si viene como string JSON
      let empresas = profile.empresas
      if (typeof empresas === "string") {
        try {
          empresas = JSON.parse(empresas)
        } catch (e) {
          console.error("Error parsing empresas JSON:", e)
          empresas = []
        }
      }

      // Parsear roles si viene como string JSON
      let roles = profile.roles
      if (typeof roles === "string") {
        try {
          roles = JSON.parse(roles)
        } catch (e) {
          console.error("Error parsing roles JSON:", e)
          roles = []
        }
      }

      // Verificar si el usuario tiene asignaciones en la empresa seleccionada
      const empresaActual = Array.isArray(empresas)
        ? empresas.find((emp: any) => emp.id === Number.parseInt(empresaId))
        : null

      if (empresaActual) {
        // Extraer establecimientos de esta empresa con nombres
        const establecimientos = empresaActual.establecimientos || []
        const establecimientosConNombres = establecimientos.map((est: any) => ({
          id: est.id,
          nombre: est.nombre,
        }))

        // Obtener el primer rol del usuario
        const primerRol = Array.isArray(roles) && roles.length > 0 ? roles[0] : null

        // Verificar si tiene is_owner en alguno de sus roles
        const isOwner = Array.isArray(roles) && roles.some((rol: any) => rol.is_owner === true)

        const usuario = {
          id: profile.id,
          nombres: profile.nombres,
          apellidos: profile.apellidos,
          telefono: profile.phone || "Sin teléfono",
          email: profile.email || "Sin email",
          empresa_id: empresaActual.id,
          establecimientos: establecimientosConNombres,
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
