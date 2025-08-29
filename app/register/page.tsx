"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
    empresa: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
  }

  const validateForm = () => {
    if (!formData.nombres.trim()) return "El nombre es requerido"
    if (!formData.apellidos.trim()) return "El apellido es requerido"
    if (!formData.email.trim()) return "El email es requerido"
    if (!formData.telefono.trim()) return "El teléfono es requerido"
    if (!formData.password) return "La contraseña es requerida"
    if (!formData.confirmPassword) return "Confirme su contraseña"
    if (!formData.empresa.trim()) return "El nombre de la empresa es requerido"

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) return "Email inválido"

    if (formData.password.length < 6) return "La contraseña debe tener al menos 6 caracteres"
    if (formData.password !== formData.confirmPassword) return "Las contraseñas no coinciden"

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log(`🔐 [REGISTER] Iniciando registro para: ${formData.email}`)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          empresa: formData.empresa,
          telefono: formData.telefono,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log("✅ [REGISTER] Cuenta creada exitosamente")
        setSuccess(true)

        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          window.location.href = "/login"
        }, 3000)
      } else {
        console.log("❌ [REGISTER] Error:", result.message)
        setError(result.message || "Error al crear la cuenta")
      }
    } catch (error) {
      console.log("❌ [REGISTER] Error:", error)
      setError("Error de conexión con el servidor")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: "url('/login-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <Card className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-700">¡Cuenta Creada!</h2>
              <p className="text-gray-600">
                ✅ Cuenta creada con éxito. Revise su correo electrónico para validar su cuenta.
              </p>
              <p className="text-sm text-gray-500">Redirigiendo al login en 3 segundos...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/login-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="w-full max-w-md space-y-6 relative z-10">
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <Image src="/logo-icon.png" alt="Parte Diario Pro" width={80} height={80} className="rounded-lg" />
            </div>
            <div>
              <CardTitle className="text-xl">Registro</CardTitle>
              <CardDescription>Ingrese sus datos para crear una nueva cuenta</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombres */}
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres *</Label>
                <Input
                  id="nombres"
                  name="nombres"
                  type="text"
                  placeholder="Ingrese sus nombres"
                  value={formData.nombres}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Apellidos */}
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  placeholder="Ingrese sus apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="0984156475 o +59598415647"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="empresa">Nombre de la Empresa *</Label>
                <Input
                  id="empresa"
                  name="empresa"
                  type="text"
                  placeholder="Ingrese el nombre de su empresa"
                  value={formData.empresa}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
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

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita su contraseña"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Botón de registro */}
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            {/* Link al login */}
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center text-sm text-green-600 hover:text-green-700">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
