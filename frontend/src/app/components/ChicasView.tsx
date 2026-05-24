import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { generatePDF } from "../utils/pdfGenerator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface Personal {
  id: number;
  nombre_artistico: string;
  celular: string;
  botellas: number;
  total: number;
  fecha: string;
  turno: "dia" | "noche";
  salidas: number;
  monto_salidas: number;
  monto_propinas: number;
}

export function ChicasView() {
  const [personal, setPersonal] = React.useState<Personal[]>([]);
  const [allPersonal, setAllPersonal] = React.useState<any[]>([]);
  const [selectedPersonalId, setSelectedPersonalId] = React.useState<string>("");
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchPersonal();
    fetchAllPersonal();
  }, []);

  const fetchAllPersonal = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/personal/");
      setAllPersonal(res.data);
    } catch (error) {
      console.error("Error al cargar personal:", error);
    }
  };

  const fetchPersonal = async () => {
    try {
      const resDia = await axios.get("http://localhost:3000/api/reportes/chicas/turno/dia");
      const resNoche = await axios.get("http://localhost:3000/api/reportes/chicas/turno/noche");

      const procesar = (data: any, turno: "dia" | "noche") => {
        const arr: Personal[] = [];
        Object.keys(data).forEach((fecha) => {
          data[fecha].forEach((p: any) => {
            arr.push({
              id: p.id,
              nombre_artistico: p.nombre,
              celular: p.celular,
              botellas: p.botellas,
              total: p.pago,
              fecha,
              turno,
              salidas: p.salidas || 0,
              monto_salidas: p.monto_salidas || 0,
              monto_propinas: p.monto_propinas || 0,
            });
          });
        });
        return arr;
      };

      const todas = [...procesar(resDia.data, "dia"), ...procesar(resNoche.data, "noche")];
      todas.sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        if (fechaA !== fechaB) return fechaB - fechaA;
        return a.turno === "dia" ? -1 : 1;
      });

      setPersonal(todas);
    } catch (error) {
      console.error("Error al cargar personal:", error);
      setPersonal([]);
    }
  };

  const handleDownloadPDF = async (p: Personal) => {
    if (!p.nombre_artistico) return;

    const fechaFormateada = new Date(p.fecha).toLocaleDateString('sv-SE');

    try {
      const res = await axios.get(
        `http://localhost:3000/api/reportes/chicas/detalle/nombre/${p.nombre_artistico}/${fechaFormateada}`
      );
      const data = res.data;
      generatePDF({
        tipo: "personal",
        nombre: data.nombre_artistico,
        fecha: new Date(data.fecha).toLocaleDateString(),
        datos: data.detalle,
        totalGeneral: `Bs ${data.totalGeneral}`,
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
    }
  };

  const grouped = React.useMemo(() => {
    const g: Record<string, Personal[]> = {};
    personal.forEach((p) => {
      const dateObj = new Date(p.fecha);
      const nombreDia = dateObj.toLocaleDateString("es-BO", { weekday: "long" });
      const fechaFormateada = dateObj.toLocaleDateString("es-BO");
      const key = `${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)} ${p.turno.toUpperCase()} ${fechaFormateada}`;
      if (!g[key]) g[key] = [];
      g[key].push(p);
    });
    return g;
  }, [personal]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-3xl text-primary mb-2">Personal</h1>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/app/adicionar-personal")}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-lg shadow-lg shadow-primary/25 transition-all"
        >
          Adicionar
        </button>

        <div className="flex items-center gap-2">
          <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecciona para editar" />
            </SelectTrigger>
            <SelectContent>
              {allPersonal.map((p: any) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.nombre_artistico}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => {
              if (selectedPersonalId) {
                const selected = allPersonal.find(p => p.id.toString() === selectedPersonalId);
                if (selected) {
                  navigate("/app/adicionar-personal", { state: { personal: selected } });
                }
              }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg transition-all"
            disabled={!selectedPersonalId}
          >
            Editar
          </button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 && (
        <p className="text-muted-foreground mt-4">No hay personal para mostrar</p>
      )}

      {Object.entries(grouped).map(([fechaTurno, items]) => (
        <div key={fechaTurno} className="bg-card border border-primary/20 rounded-xl p-4 space-y-2">
          <h3 className="text-lg font-bold">{fechaTurno}</h3>

          <table className="w-full mt-2">
            <thead className="bg-secondary/20">
              <tr>
                <th className="px-6 py-2 text-left text-xs">Nombre</th>
                <th className="px-6 py-2 text-left text-xs">Botellas</th>
                <th className="px-6 py-2 text-left text-xs">Salidas</th>
                <th className="px-6 py-2 text-left text-xs">Propinas</th>
                <th className="px-6 py-2 text-left text-xs">Total Bebidas</th>
                <th className="px-6 py-2 text-left text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={`${p.nombre_artistico}-${p.fecha}`} className="hover:bg-secondary/10">
                  <td className="px-6 py-2">{p.nombre_artistico}</td>
                  <td className="px-6 py-2">{p.botellas}</td>
                  <td className="px-6 py-2 text-blue-400">{p.salidas || 0}</td>
                  <td className="px-6 py-2 text-yellow-400">Bs {p.monto_propinas || 0}</td>
                  <td className="px-6 py-2 text-pink-400">Bs {p.total}</td>
                  <td className="px-6 py-2">
                    <button
                      onClick={() => handleDownloadPDF(p)}
                      className="bg-primary/20 px-3 py-1 rounded-lg"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
