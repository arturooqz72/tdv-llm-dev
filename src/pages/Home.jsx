import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Radio } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import GlobalAzuraCastPlayer from "@/components/radio/GlobalAzuraCastPlayer";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Bienvenida izquierda / AzuraCast derecha */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card className="rounded-2xl shadow-md border">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl font-bold">
              Bienvenido a Team Desvelados LLDM
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              Disfruta nuestra radio 24/7, videos, juegos bíblicos, concursos,
              LLDMPlay y espacios para convivir con la comunidad.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link to={createPageUrl("Radio")}>
                  <Radio className="mr-2 h-4 w-4" />
                  Escuchar Radio
                </Link>
              </Button>

              <Button asChild variant="outline">
                <Link to={createPageUrl("LLDMPlay")}>
                  <Music className="mr-2 h-4 w-4" />
                  Abrir LLDMPlay
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md border">
          <CardHeader>
            <CardTitle className="text-xl font-bold">
              Radio Team Desvelados 24/7
            </CardTitle>
          </CardHeader>

          <CardContent>
            <GlobalAzuraCastPlayer />
          </CardContent>
        </Card>
      </section>

      {/* LLDMPlay enseguida */}
      <section>
        <Card className="rounded-2xl shadow-md border">
          <CardHeader>
            <CardTitle className="text-xl font-bold">LLDMPlay</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              Explora predicaciones, cantos, testimonios, podcast, debates,
              temas e instrumental en un solo lugar.
            </p>

            <Button asChild>
              <Link to={createPageUrl("LLDMPlay")}>
                <Music className="mr-2 h-4 w-4" />
                Entrar a LLDMPlay
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Sesión iniciada después de LLDMPlay */}
      {user && (
        <section>
          <Card className="rounded-2xl shadow-md border">
            <CardContent className="pt-6">
              <p className="text-sm font-medium">
                Sesión iniciada como{" "}
                <span className="font-bold">
                  {user.username || user.email || "usuario"}
                </span>
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
