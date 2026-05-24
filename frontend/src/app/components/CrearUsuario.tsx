import React, { useState } from "react";
import { UserPlus, Lock } from "lucide-react";

export function CrearUsuario() {
  const [masterPassword, setMasterPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [ci, setCi] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [celular, setCelular] = useState("");
  const [celularReferencia, setCelularReferencia] = useState("");
  const[password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [verified, setVerified] = useState(false);

  // 🔐 Verificar contraseña maestra (solo visual)
  const handleVerifyMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!masterPassword) {
      setError("Ingresa la contraseña maestra");
      return;
    }

    setVerified(true);
  };

  // 🔥 Crear garzón
  const handleCreateUser = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccessMessage("");

  if (!nombre || !ci || !password) {
    setError("Nombre, CI y contraseña son obligatorios");
    return;
  }

  console.log({
    masterPassword,
    nombre,
    ci,
    password
  });

  try {
    const res = await fetch("http://localhost:3000/api/garzones/crear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        masterPassword,
        nombre,
        apellido_paterno: apellidoPaterno,
        apellido_materno: apellidoMaterno,
        ci,
        password,
        fecha_nacimiento: fechaNacimiento,
        celular,
        celular_referencia: celularReferencia,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Error al crear garzón");
      return;
    }

    setSuccessMessage("Garzón creado correctamente");

    setNombre("");
    setApellidoPaterno("");
    setApellidoMaterno("");
    setCi("");
    setFechaNacimiento("");
    setCelular("");
    setCelularReferencia("");
    setPassword("");

  } catch (err) {
    setError("No se pudo conectar con el servidor");
  }
};

  // 🔐 Pantalla contraseña maestra
  if (!verified) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-md mx-auto">
          <form
            onSubmit={handleVerifyMaster}
            className="bg-card border rounded-xl p-8 space-y-6"
          >
            <div>
              <label className="block text-sm mb-2">
                Contraseña Maestra
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />

                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full border rounded-lg pl-11 pr-4 py-3"
                  placeholder="Ingrese contraseña maestra"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg"
            >
              Verificar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 🧑‍🍳 Formulario crear garzón
  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleCreateUser}
          className="bg-card border rounded-xl p-8 space-y-4"
        >
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="w-full border rounded-lg p-3"
          />

          <input
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(e.target.value)}
            placeholder="Apellido paterno"
            className="w-full border rounded-lg p-3"
          />

          <input
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(e.target.value)}
            placeholder="Apellido materno"
            className="w-full border rounded-lg p-3"
          />

          <input
            value={ci}
            onChange={(e) => setCi(e.target.value)}
            placeholder="CI"
            className="w-full border rounded-lg p-3"
          />

          <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            placeholder="Celular"
            className="w-full border rounded-lg p-3"
          />

          <input
            value={celularReferencia}
            onChange={(e) => setCelularReferencia(e.target.value)}
            placeholder="Celular de referencia"
            className="w-full border rounded-lg p-3"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full border rounded-lg p-3"
          />

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {successMessage && (
            <div className="text-green-600 text-sm">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Crear Garzón
          </button>
        </form>
      </div>
    </div>
  );
}