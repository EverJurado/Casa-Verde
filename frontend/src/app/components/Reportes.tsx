import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Download, TrendingUp, Package, Calendar, Sun } from 'lucide-react';

const API = 'http://localhost:3000/api/reportes';

const fmt = (n: any) =>
  Number(n).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function exportCSV(filename: string, rows: any[], cols: { key: string; label: string }[]) {
  const header = cols.map(c => c.label).join(',');
  const body = rows.map(r => cols.map(c => `"${r[c.key] ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const CHART_STYLE = {
  contentStyle: { backgroundColor: '#0f1f18', border: '1px solid #1e3a2b', borderRadius: 8, color: '#e8f5e9' },
};

// ─── VENTAS POR GARZÓN ────────────────────────────────────────────────────────
function TabVentasGarzon() {
  const hoy = new Date().toISOString().slice(0, 10);
  const [fi, setFi] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [ff, setFf] = useState(hoy);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/ventas-por-garzon`, { params: { fecha_inicio: fi, fecha_fin: ff } });
      setData(r.data.data);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const cols = [
    { key: 'garzon', label: 'Garzón' },
    { key: 'pedidos', label: 'Pedidos' },
    { key: 'total_ventas', label: 'Total Bs' },
    { key: 'comision', label: 'Comisión Bs' },
    { key: 'servicios_extras', label: 'Servicios' },
    { key: 'ultima_venta', label: 'Última venta' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Desde</p>
          <Input type="date" value={fi} onChange={e => setFi(e.target.value)} className="w-40" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Hasta</p>
          <Input type="date" value={ff} onChange={e => setFf(e.target.value)} className="w-40" />
        </div>
        <Button onClick={cargar} disabled={loading}>{loading ? 'Cargando...' : 'Aplicar'}</Button>
        <Button variant="outline" onClick={() => exportCSV('ventas_garzon.csv', data, cols)}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">Sin datos para el período seleccionado</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
              <XAxis dataKey="garzon" stroke="#86a895" />
              <YAxis stroke="#86a895" tickFormatter={v => v.toLocaleString()} />
              <Tooltip {...CHART_STYLE} formatter={(v: any) => `Bs ${Number(v).toLocaleString()}`} />
              <Bar dataKey="total_ventas" name="Total Bs" fill="#10b981" radius={[6,6,0,0]} />
              <Bar dataKey="comision" name="Comisión Bs" fill="#34d399" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="overflow-x-auto rounded-xl border border-primary/20">
            <table className="w-full text-sm">
              <thead className="bg-secondary/20">
                <tr>{cols.map(c => <th key={c.key} className="px-4 py-2 text-left text-xs text-primary uppercase">{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((r, i) => (
                  <tr key={i} className="hover:bg-secondary/10">
                    <td className="px-4 py-2 font-medium">{r.garzon}</td>
                    <td className="px-4 py-2">{r.pedidos}</td>
                    <td className="px-4 py-2 text-green-500 font-semibold">Bs {fmt(r.total_ventas)}</td>
                    <td className="px-4 py-2 text-yellow-500">Bs {fmt(r.comision)}</td>
                    <td className="px-4 py-2">{r.servicios_extras}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {r.ultima_venta ? new Date(r.ultima_venta).toLocaleString('es-CL') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── VENTAS POR PRODUCTO ──────────────────────────────────────────────────────
function TabVentasProducto() {
  const [fi, setFi] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [ff, setFf] = useState(new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState('Todas');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/ventas-por-producto`, { params: { fecha_inicio: fi, fecha_fin: ff, categoria } });
      setData(r.data.data);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const top5 = [...data].slice(0, 5);
  const cols = [
    { key: 'producto', label: 'Producto' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'cantidad_vendida', label: 'Cantidad' },
    { key: 'ingreso_total', label: 'Ingreso Bs' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Desde</p>
          <Input type="date" value={fi} onChange={e => setFi(e.target.value)} className="w-40" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Hasta</p>
          <Input type="date" value={ff} onChange={e => setFf(e.target.value)} className="w-40" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Categoría</p>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Todas','Licores','Cerveza','Vaso'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={cargar} disabled={loading}>{loading ? 'Cargando...' : 'Aplicar'}</Button>
        <Button variant="outline" onClick={() => exportCSV('ventas_producto.csv', data, cols)}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">Sin datos para el período seleccionado</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={top5} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
              <XAxis type="number" stroke="#86a895" tickFormatter={v => v.toLocaleString()} />
              <YAxis dataKey="producto" type="category" stroke="#86a895" width={120} />
              <Tooltip {...CHART_STYLE} formatter={(v: any) => `Bs ${Number(v).toLocaleString()}`} />
              <Bar dataKey="ingreso_total" name="Ingreso Bs" fill="#f59e0b" radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="overflow-x-auto rounded-xl border border-primary/20">
            <table className="w-full text-sm">
              <thead className="bg-secondary/20">
                <tr>{cols.map(c => <th key={c.key} className="px-4 py-2 text-left text-xs text-primary uppercase">{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((r, i) => (
                  <tr key={i} className="hover:bg-secondary/10">
                    <td className="px-4 py-2 font-medium">{r.producto}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.categoria}</td>
                    <td className="px-4 py-2">{Number(r.cantidad_vendida).toFixed(1)}</td>
                    <td className="px-4 py-2 text-yellow-500 font-semibold">Bs {fmt(r.ingreso_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── RESUMEN MENSUAL ──────────────────────────────────────────────────────────
function TabResumenMensual() {
  const now = new Date();
  const [anio, setAnio] = useState(String(now.getFullYear()));
  const [mes, setMes] = useState(String(now.getMonth() + 1));
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/resumen-mensual`, { params: { anio, mes } });
      setData(r.data.data);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const cols = [
    { key: 'dia', label: 'Día' },
    { key: 'ventas_dia', label: 'Ventas Bs' },
    { key: 'acumulado', label: 'Acumulado Bs' },
    { key: 'garzon_destacado', label: 'Garzón destacado' },
  ];

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Año</p>
          <Input type="number" value={anio} onChange={e => setAnio(e.target.value)} className="w-24" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Mes</p>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={cargar} disabled={loading}>{loading ? 'Cargando...' : 'Aplicar'}</Button>
        <Button variant="outline" onClick={() => exportCSV('resumen_mensual.csv', data, cols)}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
          <XAxis dataKey="dia" stroke="#86a895"
            tickFormatter={v => new Date(v).getDate().toString()} />
          <YAxis stroke="#86a895" tickFormatter={v => v.toLocaleString()} />
          <Tooltip {...CHART_STYLE} labelFormatter={v => new Date(v).toLocaleDateString('es-CL')}
            formatter={(v: any) => `Bs ${Number(v).toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="ventas_dia" name="Ventas día" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </LineChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto rounded-xl border border-primary/20">
        <table className="w-full text-sm">
          <thead className="bg-secondary/20">
            <tr>{cols.map(c => <th key={c.key} className="px-4 py-2 text-left text-xs text-primary uppercase">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.filter(r => Number(r.ventas_dia) > 0).map((r, i) => (
              <tr key={i} className="hover:bg-secondary/10">
                <td className="px-4 py-2">{new Date(r.dia).toLocaleDateString('es-CL')}</td>
                <td className="px-4 py-2 text-green-500">Bs {fmt(r.ventas_dia)}</td>
                <td className="px-4 py-2 text-accent">Bs {fmt(r.acumulado)}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.garzon_destacado || '-'}</td>
              </tr>
            ))}
            {data.every(r => Number(r.ventas_dia) === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Sin ventas este mes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RESUMEN ANUAL ────────────────────────────────────────────────────────────
function TabResumenAnual() {
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/resumen-anual`, { params: { anio } });
      setData(r.data.data);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const cols = [
    { key: 'mes_nombre', label: 'Mes' },
    { key: 'ventas', label: 'Ventas Bs' },
    { key: 'crecimiento', label: 'Crecimiento Bs' },
    { key: 'garzon_estrella', label: 'Garzón estrella' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Año</p>
          <Input type="number" value={anio} onChange={e => setAnio(e.target.value)} className="w-24" />
        </div>
        <Button onClick={cargar} disabled={loading}>{loading ? 'Cargando...' : 'Aplicar'}</Button>
        <Button variant="outline" onClick={() => exportCSV('resumen_anual.csv', data, cols)}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
          <XAxis dataKey="mes_nombre" stroke="#86a895" />
          <YAxis stroke="#86a895" tickFormatter={v => v.toLocaleString()} />
          <Tooltip {...CHART_STYLE} formatter={(v: any) => `Bs ${Number(v).toLocaleString()}`} />
          <Bar dataKey="ventas" name="Ventas Bs" fill="#10b981" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto rounded-xl border border-primary/20">
        <table className="w-full text-sm">
          <thead className="bg-secondary/20">
            <tr>{cols.map(c => <th key={c.key} className="px-4 py-2 text-left text-xs text-primary uppercase">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((r, i) => (
              <tr key={i} className="hover:bg-secondary/10">
                <td className="px-4 py-2 font-medium capitalize">{r.mes_nombre}</td>
                <td className="px-4 py-2 text-green-500">Bs {fmt(r.ventas)}</td>
                <td className={`px-4 py-2 font-semibold ${Number(r.crecimiento) >= 0 ? 'text-accent' : 'text-red-400'}`}>
                  {Number(r.crecimiento) >= 0 ? '+' : ''}Bs {fmt(r.crecimiento)}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{r.garzon_estrella}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORTE POR TURNO ────────────────────────────────────────────────────────
function TabTurno() {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/turno`, { params: { fecha } });
      setData(r.data.data);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Fecha</p>
          <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-40" />
        </div>
        <Button onClick={cargar} disabled={loading}>{loading ? 'Cargando...' : 'Aplicar'}</Button>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">Sin ventas para esta fecha</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
              <XAxis dataKey="turno" stroke="#86a895" tickFormatter={v => v === 'día' ? '☀️ Día' : '🌙 Noche'} />
              <YAxis stroke="#86a895" tickFormatter={v => v.toLocaleString()} />
              <Tooltip {...CHART_STYLE} formatter={(v: any) => `Bs ${Number(v).toLocaleString()}`} />
              <Bar dataKey="total_ventas" name="Total Bs" fill="#10b981" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((r, i) => (
              <div key={i} className="bg-card border border-primary/20 rounded-xl p-6">
                <p className="text-lg font-bold mb-3">
                  {r.turno === 'día' ? '☀️ Turno Día (08:00–20:00)' : '🌙 Turno Noche (20:00–08:00)'}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total vendido</span>
                    <span className="text-green-500 font-bold">Bs {fmt(r.total_ventas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pedidos</span>
                    <span>{r.pedidos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Productos vendidos</span>
                    <span>{r.productos_vendidos}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function Reportes() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl text-primary mb-1">Reportes</h1>
        <p className="text-muted-foreground text-sm">Análisis de ventas — solo visible para administrador</p>
      </div>

      <Tabs defaultValue="garzon" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/20 p-1">
          <TabsTrigger value="garzon" className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3" /> Ventas por Garzón
          </TabsTrigger>
          <TabsTrigger value="producto" className="flex items-center gap-1 text-xs">
            <Package className="w-3 h-3" /> Ventas por Producto
          </TabsTrigger>
          <TabsTrigger value="mensual" className="flex items-center gap-1 text-xs">
            <Calendar className="w-3 h-3" /> Resumen Mensual
          </TabsTrigger>
          <TabsTrigger value="anual" className="flex items-center gap-1 text-xs">
            <Calendar className="w-3 h-3" /> Resumen Anual
          </TabsTrigger>
          <TabsTrigger value="turno" className="flex items-center gap-1 text-xs">
            <Sun className="w-3 h-3" /> Por Turno
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="garzon"><TabVentasGarzon /></TabsContent>
          <TabsContent value="producto"><TabVentasProducto /></TabsContent>
          <TabsContent value="mensual"><TabResumenMensual /></TabsContent>
          <TabsContent value="anual"><TabResumenAnual /></TabsContent>
          <TabsContent value="turno"><TabTurno /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
