import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { nombre, sexo, edad, categoria_animal_estandar_id } = body

    if (!nombre || !sexo || !edad) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Validar valores de enum
    if (!["HEMBRA", "MACHO"].includes(sexo)) {
      return NextResponse.json({ error: "Sexo debe ser HEMBRA o MACHO" }, { status: 400 })
    }

    if (!["JOVEN", "ADULTO"].includes(edad)) {
      return NextResponse.json({ error: "Edad debe ser JOVEN o ADULTO" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de Supabase no encontrada" }, { status: 500 })
    }

    const url = `${supabaseUrl}/rest/v1/pd_categoria_animales?id=eq.${id}`

    const updateData = {
      nombre: nombre.trim(),
      sexo,
      edad,
    }

    if (categoria_animal_estandar_id !== undefined) {
      updateData.categoria_animal_estandar_id =
        categoria_animal_estandar_id && categoria_animal_estandar_id !== 0
          ? Number.parseInt(categoria_animal_estandar_id)
          : null
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error actualizando categoría: ${response.status} - ${errorText}`)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const categoria = await response.json()

    return NextResponse.json({ categoria: categoria[0] })
  } catch (error) {
    console.error("Error updating categoria:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
