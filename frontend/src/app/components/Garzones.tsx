// src/app/components/GarzonesView.tsx
import React from 'react';
import { Download } from 'lucide-react';
import axios from 'axios';
import { formatCurrency, generatePDF } from '../utils/pdfGenerator';

interface Garzon {
  garzon: string;
  fecha: string;
  total_venta: number;
  comision: number;
  pagoChicasTotal: number;
  totalFinal: number;
  turno: 'dia' | 'noche';
}

export function GarzonesView() {
  const [garzones, setGarzones] = React.useState<Garzon[]>([]);

  React.useEffect(() => {
    fetchGarzones();
  }, []);

  const fetchGarzones = async () => {
    try {
      // Pedir datos de los turnos DIA y NOCHE
      const [resDia, resNoche] = await Promise.all([
        axios.get('http://localhost:3000/api/reportes/jefa/dia'),
        axios.get('http://localhost:3000/api/reportes/jefa/noche'),
      ]);

      const procesar = (data: any, turno: 'dia' | 'noche') =>
        data.garzones.map((g: any) => ({ ...g, turno }));

      const todas = [...procesar(resDia.data, 'dia'), ...procesar(resNoche.data, 'noche')];

      // Ordenar por fecha descendente y turno (DIA primero)
      todas.sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime();
        const fechaB = new Date(b.fecha).getTime();
        if (fechaA !== fechaB) return fechaB - fechaA;
        return a.turno === 'dia' ? -1 : 1;
      });

      setGarzones(todas);
    } catch (error) {
      console.error('Error cargando garzones:', error);
      setGarzones([]);
    }
  };

  // Agrupar por fecha + turno
  const grouped = React.useMemo(() => {
    const ag: Record<string, Garzon[]> = {};
    garzones.forEach((garzon) => {
      const dateObj = new Date(garzon.fecha);
      const nombreDia = dateObj.toLocaleDateString('es-BO', { weekday: 'long' });
      const fechaFormateada = dateObj.toLocaleDateString('es-BO');
      const key = `${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)} ${garzon.turno.toUpperCase()} ${fechaFormateada}`;

      if (!ag[key]) ag[key] = [];
      ag[key].push(garzon);
    });
    return ag;
  }, [garzones]);

  const handleDownloadPDF = (garzon: Garzon) => {
    generatePDF({
      tipo: 'garzon',
      nombre: garzon.garzon,
      fecha: new Date(garzon.fecha).toLocaleDateString(),
      datos: [
        { concepto: 'Total Venta', cantidad: 1, monto: formatCurrency(garzon.total_venta) },
        { concepto: 'Comisión Garzón', cantidad: 1, monto: formatCurrency(garzon.comision) },
        { concepto: 'Pago Personal', cantidad: 1, monto: formatCurrency(garzon.pagoChicasTotal) },
        { concepto: 'Ganancia Final', cantidad: 1, monto: formatCurrency(garzon.totalFinal) },
      ],
      totalGeneral: formatCurrency(garzon.totalFinal),
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <h1 className="text-3xl text-primary mb-2">Reporte de Garzones</h1>

      {Object.keys(grouped).length === 0 && (
        <p className="text-muted-foreground mt-4">No hay garzones para mostrar</p>
      )}

      {Object.entries(grouped).map(([fechaTurno, garzones]) => (
        <div key={fechaTurno} className="bg-card border border-primary/20 rounded-xl p-4 space-y-2">
          <h3 className="text-lg font-bold">{fechaTurno}</h3>

          <table className="w-full mt-2">
            <thead className="bg-secondary/20">
              <tr>
                <th className="px-6 py-2 text-left text-xs">Garzón</th>
                <th className="px-6 py-2 text-left text-xs">Total Venta</th>
                <th className="px-6 py-2 text-left text-xs">Comisión</th>
                <th className="px-6 py-2 text-left text-xs">Pago Personal</th>
                <th className="px-6 py-2 text-left text-xs">Ganancia Final</th>
                <th className="px-6 py-2 text-left text-xs">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {garzones.map((g) => (
                <tr key={`${g.garzon}-${g.fecha}-${g.turno}`} className="hover:bg-secondary/10">
                  <td className="px-6 py-2">{g.garzon}</td>
                  <td className="px-6 py-2">{formatCurrency(g.total_venta)}</td>
                  <td className="px-6 py-2">{formatCurrency(g.comision)}</td>
                  <td className="px-6 py-2">{formatCurrency(g.pagoChicasTotal)}</td>
                  <td className="px-6 py-2 text-accent">{formatCurrency(g.totalFinal)}</td>
                  <td className="px-6 py-2">
                    <button
                      onClick={() => handleDownloadPDF(g)}
                      className="bg-primary/20 px-3 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" /> PDF
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