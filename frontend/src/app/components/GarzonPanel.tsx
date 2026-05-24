import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, ClipboardList, BarChart3 } from 'lucide-react';
import { NuevaOrden } from './garzon/NuevaOrden';
import { OrdenesAbiertas } from './garzon/OrdenesAbiertas';
import { ReportesGarzon } from './garzon/ReportesGarzon';
import axios from 'axios';

export function GarzonPanel() {
  const [activeTab, setActiveTab] = useState('ordenes');
  const [showNuevaOrden, setShowNuevaOrden] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<any>({
    ventasDia: 0,
    ventasMes: 0,
    comision: 0
  });

  const ahora = new Date();
  const hora = ahora.getHours();
  const turnoActual = (hora >= 20 || hora < 7) ? "Noche" : "Día";
  const fetchStats = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      const ahora = new Date();
      const hora = ahora.getHours();

      const turno = (hora >= 20 || hora < 7) ? "noche" : "dia";

      const res = await axios.get(
        `http://localhost:3000/api/reportes/garzon/${usuario.id}/${turno}`
      );

      setStats({
        ventasDia: res.data.total || 0,
        ventasMes: res.data.total || 0,
        comision: (res.data.total || 0) * 0.07
      });

    } catch (error) {
      console.error("Error cargando stats", error);
    }
  };

  // ✅ cargar al iniciar
  useEffect(() => {
    fetchStats();
  }, []);

  // ✅ recargar cuando se crea o actualiza una orden
  const handleNuevaOrden = () => {
    setShowNuevaOrden(false);
    setRefreshKey((prev) => prev + 1);
    fetchStats();
  };

  const handlePedidoActualizado = () => {
    setRefreshKey((prev) => prev + 1);
    fetchStats();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-primary">Panel de Garzón</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus órdenes y revisa tus reportes</p>
        </div>
        
      </div>
      <Button
          onClick={() => setShowNuevaOrden(true)}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
          >
          <Plus className="mr-2 h-5 w-5" />
          Nueva Orden
        </Button>
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-card to-secondary/20 border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-muted-foreground">Ventas {turnoActual}</CardDescription>
            <CardTitle className="text-3xl text-primary">Bs {stats.ventasDia?.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-gradient-to-br from-card to-secondary/20 border-primary/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-muted-foreground">Comisión {turnoActual}</CardDescription>
            <CardTitle className="text-3xl text-accent">Bs {stats.comision?.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="ordenes" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <ClipboardList className="mr-2 h-4 w-4" />
            Órdenes
          </TabsTrigger>
          <TabsTrigger value="reportes" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="mr-2 h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-4">
          <OrdenesAbiertas
            refreshKey={refreshKey}
            onAction={handlePedidoActualizado}
          />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <ReportesGarzon />
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Orden */}
      <NuevaOrden
        open={showNuevaOrden}
        onClose={() => setShowNuevaOrden(false)}
        onSave={handleNuevaOrden}
      />
    </div>
  );
}
