import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAILS = ["arturooqz@gmail.com"].map((item) =>
    item.trim().toLowerCase()
  );

  const TEAM_DESVELADOS_ROOM_EMAILS = ["arturooqz@gmail.com"].map((item) =>
    item.trim().toLowerCase()
  );

  const buildLocalUser = (firebaseUser, cleanEmail) => {
    const isAdmin = ADMIN_EMAILS.includes(cleanEmail);
    const canAccessTeamDesveladosRoom =
      isAdmin || TEAM_DESVELADOS_ROOM_EMAILS.includes(cleanEmail);

    return {
      id: firebaseUser?.uid || cleanEmail,
      email: cleanEmail,
      name: firebaseUser?.displayName || cleanEmail.split("@")[0] || "Usuario",
      photoURL: firebaseUser?.photoURL || "",
      role: isAdmin ? "admin" : "user",
      canAccessTeamDesveladosRoom,
    };
  };

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
      let credential;

      if (isRegisterMode) {
        credential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword
        );
      } else {
        credential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword
        );
      }

      const firebaseUser = credential?.user || null;
      const localUser = buildLocalUser(firebaseUser, cleanEmail);

      const ok = login(localUser);

      if (!ok) {
        alert("No se pudo guardar la sesión local.");
        return;
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error de autenticación:", error);

      switch (error.code) {
        case "auth/email-already-in-use":
          alert("Ese correo ya está registrado. Intenta iniciar sesión.");
          break;
        case "auth/invalid-email":
          alert("El correo no es válido.");
          break;
        case "auth/user-not-found":
          alert("No existe una cuenta con ese correo.");
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          alert("Correo o contraseña incorrectos.");
          break;
        case "auth/weak-password":
          alert("La contraseña es muy débil. Usa al menos 6 caracteres.");
          break;
        case "auth/too-many-requests":
          alert("Demasiados intentos. Intenta de nuevo en un momento.");
          break;
        default:
          alert("Ocurrió un error al procesar la solicitud.");
          break;
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
      await sendPasswordResetEmail(auth, cleanEmail);
      alert("Te envié un correo para restablecer tu contraseña.");
    } catch (error) {
      console.error("Error enviando recuperación:", error);

      switch (error.code) {
        case "auth/user-not-found":
          alert("No existe una cuenta con ese correo.");
          break;
        case "auth/invalid-email":
          alert("El correo no es válido.");
          break;
        default:
          alert("No se pudo enviar el correo de recuperación.");
          break;
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
