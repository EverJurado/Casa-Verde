import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '../utils/pdfGenerator';
import { Button } from './ui/button';

export function JefaDashboard() {
  const [ventasPorDia, setVentasPorDia] = useState<any[]>([]);
  const [ventasPorGarzon, setVentasPorGarzon] = useState<any[]>([]);
  const [fichasPorPersonal, setFichasPorChica] = useState<any[]>([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState<any[]>([]);
  const [totales, setTotales] = useState({ ventas_mes: 0, pedidos: 0 });
  const [statsGarzones, setStatsGarzones] = useState({ activos: 0, inactivos: 0 });
  const [loading, setLoading] = useState(true);
  
  // Estados individuales para cada gráfico
  const [ventasPorDiaRange, setVentasPorDiaRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
    to: new Date()
  });
  const [ventasPorGarzonRange, setVentasPorGarzonRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Mes actual
    to: new Date()
  });
  const [productosRange, setProductosRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Mes actual
    to: new Date()
  });
  const [fichasRange, setFichasRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Mes actual
    to: new Date()
  });

  const rangesRef = useRef({
    ventasPorDiaRange,
    ventasPorGarzonRange,
    productosRange,
    fichasRange,
  });

  useEffect(() => {
    rangesRef.current = {
      ventasPorDiaRange,
      ventasPorGarzonRange,
      productosRange,
      fichasRange,
    };
  }, [ventasPorDiaRange, ventasPorGarzonRange, productosRange, fichasRange]);

  const fetchVentasPorDia = async (startDate?: Date, endDate?: Date) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);

      const res = await axios.get(`https://casa-verde-production.up.railway.app/api/garzones/reportes?${params.toString()}`);
      setVentasPorDia(res.data.ventasPorDia || []);
    } catch (error) {
      console.error('Error cargando ventas por día:', error);
      setVentasPorDia([]);
    }
  };

  const fetchVentasPorGarzon = async (startDate?: Date, endDate?: Date) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);

      const res = await axios.get(`https://casa-verde-production.up.railway.app/api/garzones/reportes?${params.toString()}`);
      setVentasPorGarzon(res.data.ventasPorGarzon || []);
    } catch (error) {
      console.error('Error cargando ventas por garzón:', error);
      setVentasPorGarzon([]);
    }
  };

  const fetchProductos = async (startDate?: Date, endDate?: Date) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);

      const res = await axios.get(`https://casa-verde-production.up.railway.app/api/garzones/reportes?${params.toString()}`);
      setProductosMasVendidos(res.data.productosMasVendidos || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductosMasVendidos([]);
    }
  };

  const fetchFichas = async (startDate?: Date, endDate?: Date) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);

      const res = await axios.get(`https://casa-verde-production.up.railway.app/api/garzones/reportes?${params.toString()}`);
      setFichasPorChica(res.data.fichasPorPersonal || []);
    } catch (error) {
      console.error('Error cargando fichas:', error);
      setFichasPorChica([]);
    }
  };

  const fetchTotales = async () => {
    try {
      const res = await axios.get('https://casa-verde-production.up.railway.app/api/garzones/reportes');
      setTotales(res.data.totales || { ventas_mes: 0, pedidos: 0 });
    } catch (error) {
      console.error('Error cargando totales:', error);
      setTotales({ ventas_mes: 0, pedidos: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsGarzones = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const res = await axios.get('https://casa-verde-production.up.railway.app/api/usuarios/stats', {
        headers: { 'x-user-rol': usuario.rol === 'jefa' ? 'admin' : usuario.rol },
      });
      setStatsGarzones({ activos: Number(res.data.activos), inactivos: Number(res.data.inactivos) });
    } catch {
      /* silencioso */
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      const {
        ventasPorDiaRange: diaRange,
        ventasPorGarzonRange: garzonRange,
        productosRange: productosActualRange,
        fichasRange: fichasActualRange,
      } = rangesRef.current;

      await Promise.all([
        fetchVentasPorDia(diaRange.from, diaRange.to),
        fetchVentasPorGarzon(garzonRange.from, garzonRange.to),
        fetchProductos(productosActualRange.from, productosActualRange.to),
        fetchFichas(fichasActualRange.from, fichasActualRange.to),
        fetchTotales(),
        fetchStatsGarzones(),
      ]);
    };

    loadAllData();
    const refreshInterval = window.setInterval(loadAllData, 30000);
    window.addEventListener('focus', loadAllData);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', loadAllData);
    };
  }, []);

  const handleApplyVentasPorDiaFilter = () => {
    fetchVentasPorDia(ventasPorDiaRange.from, ventasPorDiaRange.to);
  };

  const handleApplyVentasPorGarzonFilter = () => {
    fetchVentasPorGarzon(ventasPorGarzonRange.from, ventasPorGarzonRange.to);
  };

  const handleApplyProductosFilter = () => {
    fetchProductos(productosRange.from, productosRange.to);
  };

  const handleApplyFichasFilter = () => {
    fetchFichas(fichasRange.from, fichasRange.to);
  };

  const formatDateRange = (from?: Date, to?: Date) => {
    if (!from || !to) return '';
    if (from.toDateString() === to.toDateString()) {
      return from.toLocaleDateString('es-ES');
    }
    return `${from.toLocaleDateString('es-ES')} - ${to.toLocaleDateString('es-ES')}`;
  };

  const totalVendido = totales.ventas_mes || 0;
  const totalPedidos = totales.pedidos || 0;
  const mejorGarzon = ventasPorGarzon?.slice().sort((a, b) => b.ventas - a.ventas)[0] || { nombre: 'N/A', ventas: 0 };
  const productoTop = productosMasVendidos?.[0] || { nombre: 'N/A', cantidad_vendida: 0, ventas: 0 };

  const stats = [
    {
      title: 'Total vendido',
      value: formatCurrency(totalVendido),
      icon: DollarSign,
      trend: '+12.5%',
      positive: true,
      bgColor: 'primary',
    },
    {
      title: 'Total pedidos',
      value: totalPedidos.toString(),
      icon: TrendingUp,
      trend: '+8.3%',
      positive: true,
      bgColor: 'accent',
    },
    {
      title: 'Top garzón vendido',
      value: `${mejorGarzon.nombre}`,
      icon: Users,
      trend: '+10.2%',
      positive: true,
      bgColor: 'primary',
    },
    {
      title: 'Producto más vendido',
      value: `${productoTop.nombre} (${productoTop.cantidad_vendida || 0})`,
      icon: Award,
      trend: '+15.8%',
      positive: true,
      bgColor: 'accent',
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-primary mb-2">Dashboard Principal</h1>
        <p className="text-muted-foreground">Vista general del sistema - {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card border border-primary/20 rounded-xl p-6 hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-secondary/10">
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bgColor === 'primary' ? 'bg-primary/20' : 'bg-accent/20'} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.bgColor === 'primary' ? 'text-primary' : 'text-accent'}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs ${stat.positive ? 'text-accent' : 'text-red-400'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
            <p className="text-2xl text-foreground font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Card garzones activos/inactivos */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-card border border-green-500/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{statsGarzones.activos}</p>
          <p className="text-sm text-muted-foreground mt-1">Garzones activos</p>
        </div>
        <div className="bg-card border border-red-400/30 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{statsGarzones.inactivos}</p>
          <p className="text-sm text-muted-foreground mt-1">Garzones inactivos</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ventas por Día */}
        <div className="bg-card border border-primary/20 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg text-foreground font-semibold mb-3">
              Ventas por Día {formatDateRange(ventasPorDiaRange.from, ventasPorDiaRange.to) && `(${formatDateRange(ventasPorDiaRange.from, ventasPorDiaRange.to)})`}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Desde:</span>
              <input
                type="date"
                value={ventasPorDiaRange.from ? ventasPorDiaRange.from.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setVentasPorDiaRange(prev => ({ ...prev, from: date }));
                }}
                className="px-2 py-1 border border-input rounded text-sm"
              />
              <span className="text-sm text-muted-foreground">Hasta:</span>
              <input
                type="date"
                value={ventasPorDiaRange.to ? ventasPorDiaRange.to.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setVentasPorDiaRange(prev => ({ ...prev, to: date }));
                }}
                className="px-2 py-1 border border-input rounded text-sm"
              />
              <Button onClick={handleApplyVentasPorDiaFilter} size="sm" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Aplicar
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ventasPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
              <XAxis dataKey="dia" stroke="#86a895" />
              <YAxis stroke="#86a895" 
                tickFormatter={(value) => value.toLocaleString()}
                />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f1f18', 
                  border: '1px solid #1e3a2b',
                  borderRadius: '8px',
                  color: '#e8f5e9'
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ventas por Garzón */}
        <div className="bg-card border border-primary/20 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg text-foreground font-semibold mb-3">
              Total por Garzón {formatDateRange(ventasPorGarzonRange.from, ventasPorGarzonRange.to) && `(${formatDateRange(ventasPorGarzonRange.from, ventasPorGarzonRange.to)})`}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Desde:</span>
              <input
                type="date"
                value={ventasPorGarzonRange.from ? ventasPorGarzonRange.from.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setVentasPorGarzonRange(prev => ({ ...prev, from: date }));
                }}
                className="px-2 py-1 border border-input rounded text-sm"
              />
              <span className="text-sm text-muted-foreground">Hasta:</span>
              <input
                type="date"
                value={ventasPorGarzonRange.to ? ventasPorGarzonRange.to.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setVentasPorGarzonRange(prev => ({ ...prev, to: date }));
                }}
                className="px-2 py-1 border border-input rounded text-sm"
              />
              <Button onClick={handleApplyVentasPorGarzonFilter} size="sm" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Aplicar
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorGarzon}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
              <XAxis dataKey="nombre" stroke="#86a895" />
              <YAxis stroke="#86a895" 
                tickFormatter={(value) => value.toLocaleString()}
                />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f1f18', 
                  border: '1px solid #1e3a2b',
                  borderRadius: '8px',
                  color: '#e8f5e9'
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Bar dataKey="ventas" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Producto más vendido */}
        <div className="bg-card border border-primary/20 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg text-foreground font-semibold mb-3">
              Productos más vendidos {formatDateRange(productosRange.from, productosRange.to) && `(${formatDateRange(productosRange.from, productosRange.to)})`}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Desde:</span>
              <input
                type="date"
                value={productosRange.from ? productosRange.from.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setProductosRange(prev => ({ ...prev, from: date }));
                }}
                className="px-2 py-1 border border-input rounded text-sm"
              />
              <span className="text-sm text-muted-foreground">Hasta:</span>
              <input
                type="date"
                value={productosRange.to ? productosRange.to.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setProductosRange(prev => ({ ...prev, to: date }));
                }}
                className="px-2 py-1 border border-input rounded text-sm"
              />
              <Button onClick={handleApplyProductosFilter} size="sm" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Aplicar
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productosMasVendidos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
              <XAxis type="number" stroke="#86a895" tickFormatter={(value) => value.toLocaleString()} />
              <YAxis dataKey="nombre" type="category" stroke="#86a895" width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f1f18', 
                  border: '1px solid #1e3a2b',
                  borderRadius: '8px',
                  color: '#e8f5e9'
                }}
                formatter={(value: any) => value.toLocaleString()}
              />
              <Bar dataKey="cantidad_vendida" fill="#f59e0b" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fichas por Personal Chart */}
      <div className="bg-card border border-primary/20 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-lg text-foreground font-semibold mb-3">
            Fichas Generadas por Personal {formatDateRange(fichasRange.from, fichasRange.to) && `(${formatDateRange(fichasRange.from, fichasRange.to)})`}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Desde:</span>
            <input
              type="date"
              value={fichasRange.from ? fichasRange.from.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                setFichasRange(prev => ({ ...prev, from: date }));
              }}
              className="px-2 py-1 border border-input rounded text-sm"
            />
            <span className="text-sm text-muted-foreground">Hasta:</span>
            <input
              type="date"
              value={fichasRange.to ? fichasRange.to.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : undefined;
                setFichasRange(prev => ({ ...prev, to: date }));
              }}
              className="px-2 py-1 border border-input rounded text-sm"
            />
            <Button onClick={handleApplyFichasFilter} size="sm" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Aplicar
            </Button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={fichasPorPersonal} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a2b" />
            <XAxis type="number" stroke="#86a895" 
            tickFormatter={(value) => value.toLocaleString()}
             />
            <YAxis dataKey="nombre" type="category" stroke="#86a895" width={100} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f1f18', 
                border: '1px solid #1e3a2b',
                borderRadius: '8px',
                color: '#e8f5e9'
              }}
              formatter={(value: any) => `$${value.toLocaleString()}`}
            />
            <Bar dataKey="fichas" fill="#34d399" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen Tabla */}
      <div className="bg-card border border-primary/20 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg text-foreground font-semibold">Resumen de Garzones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/20">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-primary uppercase tracking-wider">Garzón</th>
                <th className="px-6 py-3 text-left text-xs text-primary uppercase tracking-wider">Ventas Mes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ventasPorGarzon.map((garzon) => (
                <tr key={garzon.nombre} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{garzon.nombre}</td>
                  <td className="px-6 py-4 text-sm text-accent font-semibold">{formatCurrency(garzon.ventas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
