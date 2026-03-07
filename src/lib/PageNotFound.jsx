import { useLocation, Link } from "react-router-dom";

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="max-w-xl w-full text-center border border-cyan-500 rounded-2xl p-8 bg-black/70 shadow-xl">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">404</h1>
        <p className="text-lg text-gray-300 mb-2">Página no encontrada</p>
        {pageName && (
          <p className="text-sm text-gray-400 mb-6">
            No existe la ruta: <span className="text-cyan-400">/{pageName}</span>
          </p>
        )}
        <Link
          to="/"
          className="inline-block bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-6 py-3 rounded-lg"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
