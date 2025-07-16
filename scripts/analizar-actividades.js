// Script para analizar las actividades del CSV
async function analizarActividades() {
  try {
    console.log("📥 Descargando archivo CSV...")

    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pd_tipo_actividades_rows%20%283%29-V2th8GUYPhNGjMkVLPq9gpwwsKq4PH.csv",
    )

    if (!response.ok) {
      throw new Error(`Error al descargar: ${response.status}`)
    }

    const csvText = await response.text()
    console.log("✅ Archivo descargado exitosamente")

    // Parsear CSV manualmente
    const lines = csvText.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""))

    console.log("📋 Headers encontrados:", headers)
    console.log("📊 Total de líneas:", lines.length - 1)

    const actividades = []

    // Procesar cada línea (saltando el header)
    for (let i = 1; i < lines.length; i++) {
      const values = []
      let currentValue = ""
      let insideQuotes = false

      // Parser CSV que maneja comillas
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]

        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === "," && !insideQuotes) {
          values.push(currentValue.trim())
          currentValue = ""
        } else {
          currentValue += char
        }
      }
      values.push(currentValue.trim()) // Agregar el último valor

      if (values.length >= 7) {
        const actividad = {
          id: values[0] || "",
          empresa_id: values[1] || "",
          nombre: values[2] || "",
          ubicacion: values[3] || "",
          descripcion: values[4] || "",
          animales: values[5] || "",
          insumos: values[6] || "",
          categoria_actividad_id: values[7] || null,
        }

        actividades.push(actividad)
      }
    }

    console.log(`\n🎯 LISTA ENUMERADA DE ACTIVIDADES (${actividades.length} total):\n`)

    // Agrupar por ubicación para mejor organización
    const actividadesPorUbicacion = {}

    actividades.forEach((actividad) => {
      const ubicacion = actividad.ubicacion || "SIN UBICACION"
      if (!actividadesPorUbicacion[ubicacion]) {
        actividadesPorUbicacion[ubicacion] = []
      }
      actividadesPorUbicacion[ubicacion].push(actividad)
    })

    let contador = 1

    // Mostrar actividades agrupadas por ubicación
    Object.keys(actividadesPorUbicacion)
      .sort()
      .forEach((ubicacion) => {
        console.log(`\n📍 ${ubicacion}:`)
        console.log("=" + "=".repeat(ubicacion.length + 3))

        actividadesPorUbicacion[ubicacion].forEach((actividad) => {
          console.log(`${contador}. ${actividad.nombre}`)
          console.log(`   • ID: ${actividad.id}`)
          console.log(`   • Empresa: ${actividad.empresa_id}`)
          console.log(`   • Descripción: ${actividad.descripcion}`)
          console.log(`   • Animales: ${actividad.animales}`)
          console.log(`   • Insumos: ${actividad.insumos}`)
          if (actividad.categoria_actividad_id) {
            console.log(`   • Categoría ID: ${actividad.categoria_actividad_id}`)
          }
          console.log("")
          contador++
        })
      })

    // Estadísticas adicionales
    console.log("\n📊 ESTADÍSTICAS:")
    console.log("================")

    const estadisticasUbicacion = {}
    const estadisticasAnimales = {}
    const estadisticasInsumos = {}
    const estadisticasEmpresa = {}

    actividades.forEach((actividad) => {
      // Por ubicación
      estadisticasUbicacion[actividad.ubicacion] = (estadisticasUbicacion[actividad.ubicacion] || 0) + 1

      // Por animales
      estadisticasAnimales[actividad.animales] = (estadisticasAnimales[actividad.animales] || 0) + 1

      // Por insumos
      estadisticasInsumos[actividad.insumos] = (estadisticasInsumos[actividad.insumos] || 0) + 1

      // Por empresa
      estadisticasEmpresa[actividad.empresa_id] = (estadisticasEmpresa[actividad.empresa_id] || 0) + 1
    })

    console.log("\n🏢 Por Ubicación:")
    Object.entries(estadisticasUbicacion).forEach(([ubicacion, count]) => {
      console.log(`   ${ubicacion}: ${count} actividades`)
    })

    console.log("\n🐄 Por Animales:")
    Object.entries(estadisticasAnimales).forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count} actividades`)
    })

    console.log("\n📦 Por Insumos:")
    Object.entries(estadisticasInsumos).forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count} actividades`)
    })

    console.log("\n🏭 Por Empresa:")
    Object.entries(estadisticasEmpresa).forEach(([empresa, count]) => {
      console.log(`   Empresa ${empresa}: ${count} actividades`)
    })
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

// Ejecutar el análisis
analizarActividades()
