import { useState, useEffect } from 'react';
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { generarPDFGarzon, generarPDFChica } from '../../utils/pdfGenerator';

export function ReportesGarzon() {
  const [personalSeleccionado, setPersonalSeleccionado] = useState('');
  const [rangoFecha, setRangoFecha] = useState('dia');
  const [personal, setPersonal] = useState<any[]>([]);
  const [detallesPersonal, setDetallesPersonal] = useState<any[]>([]);
  const [detallesGarzon, setDetallesGarzon] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ ventasDia: 0, ventasMes: 0, comision: 0 });

  useEffect(() => {
    fetchPersonal();
    fetchStats();
    fetchDetalleGarzon();
  }, []);

  useEffect(() => {
    fetchStats();
    fetchDetalleGarzon();
  }, [rangoFecha]);

  useEffect(() => {
    if (personalSeleccionado) fetchDetallePersonal();
  }, [personalSeleccionado]);

  const fetchPersonal = async () => {
    const res = await axios.get("http://localhost:3000/api/reportes/chicas");
    setPersonal(res.data);
  };

  const fetchStats = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const res = await axios.get(`http://localhost:3000/api/reportes/garzon/${usuario.id}/${rangoFecha}`);
      const total = Number(res.data.total);
      const comision = total * 0.07;
      setStats({ ventasDia: total, ventasMes: total, comision, pagoPersonal: 0, totalFinal: total - comision });
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDetalleGarzon = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      const res = await axios.get(`http://localhost:3000/api/reportes/garzon-detalle/${usuario.id}/${rangoFecha}`);
      setDetallesGarzon(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDetallePersonal = async () => {
    const res = await axios.get(`http://localhost:3000/api/reportes/chica/${personalSeleccionado}`);
    setDetallesPersonal(res.data);
  };

  const handleDescargarPDFGarzon = () => {
    generarPDFGarzon({
      nombreGarzon: 'Mi Reporte',
      fecha: new Date().toLocaleDateString(),
      totalVentas: stats.ventasMes,
      comision: stats.comision,
      detalles: detallesGarzon,
    });
  };

  const handleDescargarPDFPersonal = () => {
    const p = personal.find(c => c.id === personalSeleccionado);
    generarPDFChica({
      nombreArtistico: p?.nombre_artistico,
      fecha: new Date().toLocaleDateString(),
      detalles: detallesPersonal,
      totalFinal: detallesPersonal.reduce((sum, d) => sum + Number(d.ganancia), 0),
    });
  };

  const agruparGarzon = () => {
    const grupos: any = {};
    detallesGarzon.forEach(d => {
      const fecha = new Date(d.fecha);
      const dia = String(fecha.getDate()).padStart(2, "0");
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const key = `${dia}/${mes} ${d.turno}`;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(d);
    });
    return grupos;
  };

  const agruparPorFechaTurno = () => {
    const grupos: any = {};
    detallesPersonal.forEach(d => {
      const fecha = new Date(d.fecha);
      const dia = String(fecha.getDate()).padStart(2, "0");
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const key = `${dia}/${mes} ${d.turno}`;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(d);
    });
    return grupos;
  };

  const datosGarzonAgrupados = agruparGarzon();
  const datosAgrupados = agruparPorFechaTurno();

  return (
    <Tabs defaultValue="garzon" className="space-y-4">
      <TabsList>
        <TabsTrigger value="garzon">Reporte del Garzón</TabsTrigger>
        <TabsTrigger value="personal">Reporte por Personal</TabsTrigger>
      </TabsList>

      <TabsContent value="garzon">
        <Card>
          <CardHeader><CardTitle>Resumen de Ventas</CardTitle></CardHeader>
        </Card>

        {Object.entries(datosGarzonAgrupados).map(([grupo, items]: any) => (
          <div key={grupo} className="mb-6">
            <div className="font-bold text-lg border-b pb-1 mb-2">{grupo}</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.producto}</TableCell>
                    <TableCell>{d.hora}</TableCell>
                    <TableCell>{d.fraccion === 0.5 ? "1/2" : d.cantidad}</TableCell>
                    <TableCell>${Number(d.precio).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </TabsContent>

      <TabsContent value="personal">
        <Card>
          <CardHeader><CardTitle>Reporte por Personal</CardTitle></CardHeader>
          <CardContent>
            <Select value={personalSeleccionado} onValueChange={setPersonalSeleccionado}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {personal.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre_artistico}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {Object.entries(datosAgrupados).map(([grupo, items]: any) => (
              <div key={grupo} className="mb-6">
                <div className="font-bold text-lg border-b pb-1 mb-2">{grupo}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Ganancia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((d: any) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.producto}</TableCell>
                        <TableCell>{d.hora}</TableCell>
                        <TableCell>{d.fraccion === 0.5 ? "1/2" : d.cantidad}</TableCell>
                        <TableCell>${Number(d.ganancia).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}

            <Button onClick={handleDescargarPDFPersonal}>Descargar PDF</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
