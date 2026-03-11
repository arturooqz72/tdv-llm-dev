import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (!cleanEmail) {
      alert("Por favor ingresa tu correo.");
      return;
    }

    if (!cleanPassword) {
      alert("Por favor ingresa tu contraseña.");
      return;
    }

    if (cleanPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (isRegisterMode) {
      if (!cleanConfirmPassword) {
        alert("Por favor confirma tu contraseña.");
        return;
      }

      if (cleanPassword !== cleanConfirmPassword) {
        alert("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
          options: {
            data: {
              full_name: cleanEmail.split("@")[0] || "Usuario",
            },
          },
        });

        if (error) throw error;

        if (!data.session) {
          alert(
            "Tu cuenta fue creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesión."
          );
        } else {
          alert("Cuenta creada correctamente.");
          navigate("/", { replace: true });
        }

        setIsRegisterMode(false);
        setPassword("");
        setConfirmPassword("");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) throw error;

      setLoading(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error de autenticación:", error);

      const message = error?.message || "";

      if (message.toLowerCase().includes("user already registered")) {
        alert("Ese correo ya está registrado. Intenta iniciar sesión.");
      } else if (message.toLowerCase().includes("invalid login credentials")) {
        alert("Correo o contraseña incorrectos.");
      } else if (message.toLowerCase().includes("email not confirmed")) {
        alert("Debes confirmar tu correo antes de iniciar sesión.");
      } else if (message.toLowerCase().includes("password should be at least")) {
        alert("La contraseña debe tener al menos 6 caracteres.");
      } else if (message.toLowerCase().includes("invalid email")) {
        alert("El correo no es válido.");
      } else if (message.toLowerCase().includes("rate limit")) {
        alert("Demasiados intentos. Intenta de nuevo en un momento.");
      } else {
        alert("Ocurrió un error al procesar la solicitud.");
      }

      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("Primero escribe tu correo para enviarte el enlace de recuperación.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) throw error;

      alert("Te envié un correo para restablecer tu contraseña.");
    } catch (error) {
      console.error("Error enviando recuperación:", error);

      const message = error?.message || "";

      if (message.toLowerCase().includes("invalid email")) {
        alert("El correo no es válido.");
      } else {
        alert("No se pudo enviar el correo de recuperación.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-sky-50 to-blue-100 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-sky-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 border border-sky-200">
            <span className="text-2xl">🔐</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">
            {isRegisterMode ? "Crear Cuenta" : "Iniciar Sesión"}
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {isRegisterMode
              ? "Regístrate para acceder a chats, juegos y subir audios."
              : "Ingresa con tu cuenta para continuar."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Correo electrónico"
            className="h-12 rounded-2xl border-sky-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-sky-400"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Contraseña"
            className="h-12 rounded-2xl border-sky-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-sky-400"
            value={password}
            autoComplete={isRegisterMode ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {isRegisterMode && (
            <Input
              type="password"
              placeholder="Confirmar contraseña"
              className="h-12 rounded-2xl border-sky-200 bg-white text-gray-900 placeholder:text-gray-400 focus-visible:ring-sky-400"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-sky-500 font-bold text-white hover:bg-sky-600 disabled:opacity-70"
          >
            {loading
              ? "Procesando..."
              : isRegisterMode
                ? "Crear cuenta"
                : "Entrar"}
          </Button>
        </form>

        {!isRegisterMode && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm font-medium text-sky-600 hover:text-sky-700"
            >
              Olvidé mi contraseña
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode((prev) => !prev);
              setPassword("");
              setConfirmPassword("");
            }}
            className="text-sm font-semibold text-sky-600 hover:text-sky-700"
          >
            {isRegisterMode
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </button>
        </div>
      </div>
    </div>
  );
}
