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

        if (error) {
          throw error;
        }

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
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        throw error;
      }

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
    } finally {
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

      if (error) {
        throw error;
      }

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B3A4A] via-[#061F2B] to-[#030B10] px-4">
      <div className="bg-black border border-cyan-500 rounded-xl p-8 w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-bold text-cyan-400 text-center mb-2">
          {isRegisterMode ? "Crear Cuenta" : "Iniciar Sesión"}
        </h1>

        <p className="text-sm text-gray-400 text-center mb-6">
          {isRegisterMode
            ? "Regístrate para acceder a chats, juegos y subir audios."
            : "Ingresa con tu cuenta para continuar."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Correo electrónico"
            className="text-white bg-black border-cyan-500 placeholder:text-gray-400"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Contraseña"
            className="text-white bg-black border-cyan-500 placeholder:text-gray-400"
            value={password}
            autoComplete={isRegisterMode ? "new-password" : "current-password"}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {isRegisterMode && (
            <Input
              type="password"
              placeholder="Confirmar contraseña"
              className="text-white bg-black border-cyan-500 placeholder:text-gray-400"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold disabled:opacity-70"
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
              className="text-sm text-cyan-400 hover:text-cyan-300"
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
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
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
