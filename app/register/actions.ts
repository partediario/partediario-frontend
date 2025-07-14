"use server"

import { createClient } from "@/lib/supabase-server"

export async function register(
  nombre: string,
  apellido: string,
  nombreEmpresa: string,
  email: string,
  password: string,
) {
  try {
    const supabase = createClient()

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellido,
          nombre_empresa: nombreEmpresa,
        },
      },
    })

    if (authError) {
      console.error("Error en registro:", authError)
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: "No se pudo crear el usuario" }
    }

    // Crear empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from("empresas")
      .insert({
        nombre: nombreEmpresa,
        created_by: authData.user.id,
      })
      .select()
      .single()

    if (empresaError) {
      console.error("Error creando empresa:", empresaError)
      return { success: false, error: "Error al crear la empresa" }
    }

    // Crear perfil de usuario
    const { error: perfilError } = await supabase.from("user_profiles").insert({
      user_id: authData.user.id,
      nombre,
      apellido,
      email,
      empresa_id: empresaData.id,
      is_owner: true, // Campo agregado
    })

    if (perfilError) {
      console.error("Error creando perfil:", perfilError)
      return { success: false, error: "Error al crear el perfil de usuario" }
    }

    return {
      success: true,
      message: "Cuenta creada exitosamente. Por favor verifica tu correo electrónico.",
    }
  } catch (error) {
    console.error("Error en registro:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
