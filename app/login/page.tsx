"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { login } from "./actions"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError("Por favor complete todos los campos")
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log(`🔐 [LOGIN] Iniciando login para: ${email}`)

      // Limpiar datos anteriores
      localStorage.removeItem("user_data")
      localStorage.removeItem("supabase_token")
      localStorage.removeItem("supabase_refresh_token")

      const result = await login(email, password)

      if (result.success && result.user && result.session) {
        console.log("✅ [LOGIN] Login exitoso")

        // Guardar datos del usuario con el formato correcto
        const userData = {
          usuario_id: result.user.id, // Usar 'id' de Supabase como 'usuario_id'
          id: result.user.id, // Mantener también 'id' para compatibilidad
          email: result.user.email,
          nombres: result.user.user_metadata?.nombres || result.user.user_metadata?.first_name || "",
          apellidos: result.user.user_metadata?.apellidos || result.user.user_metadata?.last_name || "",
          nombreCompleto:
            result.user.user_metadata?.nombres && result.user.user_metadata?.apellidos
              ? `${result.user.user_metadata.nombres} ${result.user.user_metadata.apellidos}`.trim()
              : result.user.email,
          activo: true,
        }

        localStorage.setItem("user_data", JSON.stringify(userData))
        localStorage.setItem("supabase_token", result.session.access_token)
        localStorage.setItem("supabase_refresh_token", result.session.refresh_token)

        console.log("✅ [LOGIN] Datos guardados en localStorage:", userData)

        // Disparar eventos para actualizar contextos
        window.dispatchEvent(new Event("storage"))
        window.dispatchEvent(new CustomEvent("userChanged"))

        // Redirigir después de un breve delay
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
      } else {
        console.log("❌ [LOGIN] Error:", result.message)
        setError(result.message || "Error al iniciar sesión")
      }
    } catch (error) {
      console.log("❌ [LOGIN] Error general:", error)
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url(/images/login-background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="w-full max-w-md space-y-6 relative z-10">
        <Card className="backdrop-blur-sm bg-white/95">
          <CardHeader className="space-y-4 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <Image src="/images/logo-icon.png" alt="Parte Diario Pro" width={80} height={80} className="rounded-lg" />
            </div>
            <div>
              
              
            </div>
            <div>
              <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
              <CardDescription>Ingrese sus credenciales para acceder</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            {/* Link al registro */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{" "}
                <Link
                  href="/register"
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Crear cuenta
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
