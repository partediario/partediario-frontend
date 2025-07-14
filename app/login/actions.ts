"use server"

import { createClient } from "@supabase/supabase-js"
import { supabaseServer } from "@/lib/supabase-server"

export async function login(email: string, password: string) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Faltan variables de entorno de Supabase")
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log("🔐 [LOGIN] Intentando login para:", email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("❌ [LOGIN] Error de Supabase:", error.message)
      return {
        success: false,
        message: error.message === "Invalid login credentials" ? "Credenciales inválidas" : error.message,
      }
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        message: "No se pudo obtener los datos del usuario",
      }
    }

    console.log("✅ [LOGIN] Login exitoso, obteniendo datos del usuario...")

    // Obtener datos adicionales del usuario desde pd_usuarios
    const { data: userData, error: userError } = await supabaseServer
      .from("pd_usuarios")
      .select("nombres, apellidos")
      .eq("id", data.user.id)
      .single()

    if (userError) {
      console.log("⚠️ [LOGIN] No se pudieron obtener datos adicionales:", userError)
    }

    // Fetch comprehensive user profile data from pd_user_profile_view
    console.log("🔍 [LOGIN] Obteniendo perfil completo del usuario...")

    const { data: profileData, error: profileError } = await supabase
      .from("pd_user_profile_view")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError) {
      console.log("⚠️ [LOGIN] Error al obtener perfil completo:", profileError)
    } else {
      console.log("✅ [LOGIN] Perfil completo obtenido:")
      console.log("📋 [PROFILE_DATA] Datos completos del perfil:", JSON.stringify(profileData, null, 2))

      // Mostrar información específica de roles
      if (profileData.roles && profileData.roles.length > 0) {
        console.log("👤 [ROLES] Roles del usuario:")
        profileData.roles.forEach((role: any, index: number) => {
          console.log(`   ${index + 1}. ${role.nombre} (ID: ${role.id})`)
          if (role.privilegios && role.privilegios.length > 0) {
            console.log(`      Privilegios: ${role.privilegios.join(", ")}`)
          }
        })
      } else {
        console.log("👤 [ROLES] El usuario no tiene roles asignados")
      }

      // Mostrar información específica de empresas
      if (profileData.empresas && profileData.empresas.length > 0) {
        console.log("🏢 [EMPRESAS] Empresas del usuario:")
        profileData.empresas.forEach((empresa: any, index: number) => {
          console.log(`   ${index + 1}. ${empresa.nombre} (ID: ${empresa.id})`)
          if (empresa.establecimientos && empresa.establecimientos.length > 0) {
            console.log(`      Establecimientos:`)
            empresa.establecimientos.forEach((est: any, estIndex: number) => {
              console.log(`         ${estIndex + 1}. ${est.nombre} (ID: ${est.id})`)
            })
          } else {
            console.log(`      Sin establecimientos asignados`)
          }
        })
      } else {
        console.log("🏢 [EMPRESAS] El usuario no tiene empresas asignadas")
      }

      // Mostrar información básica
      console.log("📞 [CONTACTO] Información de contacto:")
      console.log(`   Email: ${profileData.email}`)
      console.log(`   Teléfono: ${profileData.phone || "No especificado"}`)
      console.log(`   Nombre completo: ${profileData.nombres} ${profileData.apellidos}`)
    }

    // Combine all user data including profile information
    const completeUserData = {
      ...data.user,
      user_metadata: {
        ...data.user.user_metadata,
        nombres: profileData?.nombres || userData?.nombres || data.user.user_metadata?.nombres || "",
        apellidos: profileData?.apellidos || userData?.apellidos || data.user.user_metadata?.apellidos || "",
      },
      // Add profile data for later use
      profile: profileData || null,
      roles: profileData?.roles || [],
      empresas: profileData?.empresas || [],
      phone: profileData?.phone || null,
    }

    console.log("✅ [LOGIN] Login completado para:", email)
    console.log("🎯 [FINAL_USER_DATA] Datos finales del usuario:", {
      id: completeUserData.id,
      email: completeUserData.email,
      nombres: completeUserData.user_metadata.nombres,
      apellidos: completeUserData.user_metadata.apellidos,
      rolesCount: completeUserData.roles.length,
      empresasCount: completeUserData.empresas.length,
      hasProfile: !!completeUserData.profile,
    })

    return {
      success: true,
      user: completeUserData,
      session: data.session,
    }
  } catch (error) {
    console.log("❌ [LOGIN] Error general:", error)
    return {
      success: false,
      message: "Error interno del servidor",
    }
  }
}
