import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Eye } from 'lucide-react';
import { EditarOrden } from './EditarOrden';
import axios from 'axios';

interface OrdenesAbiertasProps {
  refreshKey?: number;
  onAction?: () => void;
}

export function OrdenesAbiertas({ refreshKey, onAction }: OrdenesAbiertasProps) {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenEnEdicion, setOrdenEnEdicion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [personalDisponible, setPersonalDisponible] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const usuario = JSON.parse(localStorage.getItem("usuario"));

        const [resOrdenes, resPersonal] = await Promise.all([
          axios.get("https://casa-verde-production.up.railway.app/api/pedidos/abiertas", { params: { garzon_id: usuario.id } }),
          axios.get("https://casa-verde-production.up.railway.app/api/personal/"),
        ]);

        setOrdenes(resOrdenes.data);
        setPersonalDisponible(resPersonal.data);
      } catch (err) {
        console.error('Error cargando datos', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  const getGrupoTurno = (fecha: string) => {
    const f = new Date(fecha);
    const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
    const horas = f.getHours();
    const turno = (horas >= 20 || horas < 7) ? "noche" : "día";
    const dia = String(f.getDate()).padStart(2, "0");
    const mes = String(f.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes} ${dias[f.getDay()]} ${turno}`;
  };

  const ordenesAgrupadas = ordenes.reduce((acc: any, orden: any) => {
    const grupo = getGrupoTurno(orden.fecha);
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(orden);
    return acc;
  }, {});

  return (
    <>
      {loading ? (
        <p>Cargando órdenes...</p>
      ) : (
        <div className="space-y-6">
          {ordenes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No hay órdenes abiertas</p>
                  <p className="text-sm mt-1">Crea una nueva orden para comenzar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(ordenesAgrupadas).map(([grupo, ordenesGrupo]: any) => (
              <div key={grupo} className="space-y-3">
                <div className="text-lg font-semibold border-b pb-1">{grupo}</div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {ordenesGrupo.map((orden: any) => (
                    <Card key={orden.id} className="hover:border-primary/50 transition-colors cursor-pointer bg-gradient-to-br from-card to-secondary/10 border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">
                              {orden.items.length > 0 ? orden.items[0].productoNombre : `Orden #${orden.id}`}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(orden.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Pedido</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {orden.items.map((item: any) => (
                          item.personal && item.personal.length > 0 && (
                            <div key={item.id} className="text-sm text-muted-foreground space-y-1">
                              <div className="font-semibold">
                                {item.productoNombre} - Personal ({item.personal.length})
                              </div>
                              {item.personal.map((p: any) => (
                                <div key={p.personal_id} className="flex justify-between px-2">
                                  <span>{p.personal_nombre}</span>
                                </div>
                              ))}
                            </div>
                          )
                        ))}

                        <div className="space-y-1">
                          {orden.items.slice(0, 2).map((item: any) => (
                            <div key={item.id} className="text-sm flex justify-between">
                              <span>
                                {item.productoNombre}
                                {" - "}
                                {item.fraccion === 0.5 ? "MEDIA" : "BOTELLA"}
                                {item.modo === "Bar" ? " BAR" : ""}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-border flex items-center justify-between">
                          <div className="flex items-center gap-1 text-primary font-semibold">
                            {orden.items.slice(0, 2).map((item: any) => (
                              <span key={item.id}>Bs {item.precio}</span>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setOrdenEnEdicion(orden)}
                            className="bg-primary hover:bg-primary/90 text-white"
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Ver / Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {ordenEnEdicion && (
        <EditarOrden
          open={!!ordenEnEdicion}
          orden={ordenEnEdicion}
          personalDisponible={personalDisponible}
          onClose={() => setOrdenEnEdicion(null)}
          onSaved={() => { setOrdenEnEdicion(null); if (onAction) onAction(); }}
          onDeleted={() => { setOrdenEnEdicion(null); if (onAction) onAction(); }}
        />
      )}
    </>
  );
}
