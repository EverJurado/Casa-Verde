import { useState, useEffect } from 'react';
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const MONTO_FIJO_TOTAL = 150;

interface EditarOrdenProps {
  open: boolean;
  orden: any;
  personalDisponible: any[];
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

export function EditarOrden({ open, orden, personalDisponible, onClose, onSaved, onDeleted }: EditarOrdenProps) {
  const [carrito, setCarrito] = useState<any[]>([]);
  const [selectedPersonal, setSelectedPersonal] = useState<string>("");

  useEffect(() => {
    if (open && orden?.items) {
      const itemsNormalizados = orden.items.map((item: any) => ({
        ...item,
        id: item.id || item.producto_id,
        producto_nombre: item.producto_nombre || item.productoNombre || "Producto",
        personal: (item.personal || item.chicas || []).map((p: any) => {
          const montoActual = Number(p.monto) || MONTO_FIJO_TOTAL / (item.personal?.length || item.chicas?.length || 1);
          return {
            ...p,
            personal_id: p.personal_id || p.chica_id || p.id,
            personal_nombre: p.personal_nombre || p.chica_nombre || p.nombre_artistico || p.nombre || "Sin Nombre",
            monto: montoActual,
            porcentaje: (montoActual / MONTO_FIJO_TOTAL) * 100,
          };
        }),
      }));
      setCarrito(itemsNormalizados);
    }
  }, [open, orden]);

  const handleCambiarMontoManual = (itemId: string, personalId: string, nuevoMonto: number) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nuevosPersonal = item.personal.map((p: any) => {
          if (p.personal_id === personalId || p.id === personalId) {
            return { ...p, monto: nuevoMonto, porcentaje: (nuevoMonto / MONTO_FIJO_TOTAL) * 100 };
          }
          return p;
        });
        return { ...item, personal: nuevosPersonal };
      })
    );
  };

  const guardarCambios = async () => {
    try {
      await axios.put("http://localhost:3000/api/editar-montos", {
        orden_id: orden.id,
        items: carrito,
      });
      onClose();
      onSaved?.();
    } catch (error) {
      console.log(error);
    }
  };

  const agregarPersonalAlPedido = () => {
    if (!selectedPersonal) return;

    const pSeleccionado = personalDisponible.find((p: any) => p.id.toString() === selectedPersonal);
    if (!pSeleccionado) return;

    setCarrito((prev) =>
      prev.map((item) => {
        const yaExiste = item.personal.some((p: any) => p.personal_id === pSeleccionado.id);
        if (yaExiste) return item;

        const nuevosPersonal = [
          ...item.personal,
          { personal_id: pSeleccionado.id, personal_nombre: pSeleccionado.nombre_artistico, monto: 0, porcentaje: 0 },
        ];

        const montoPorPersona = MONTO_FIJO_TOTAL / nuevosPersonal.length;
        const recalculados = nuevosPersonal.map((p: any) => ({
          ...p,
          monto: montoPorPersona,
          porcentaje: (montoPorPersona / MONTO_FIJO_TOTAL) * 100,
        }));

        return { ...item, personal: recalculados };
      })
    );

    setSelectedPersonal("");
  };

  const guardarCambiosInterno = async (carritoActualizado: any[]) => {
    try {
      await axios.put("http://localhost:3000/api/editar-montos", {
        orden_id: orden.id,
        items: carritoActualizado,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const eliminarPersonalDelPedido = (itemId: string, personalId: string) => {
    setCarrito((prev) => {
      const nuevoCarrito = prev.map((item) => {
        if (item.id !== itemId) return item;

        const restantes = item.personal.filter(
          (p: any) => p.personal_id !== personalId && p.id !== personalId
        );

        if (restantes.length === 0) return item;

        const montoPorPersona = MONTO_FIJO_TOTAL / restantes.length;
        const recalculados = restantes.map((p: any) => ({
          ...p,
          monto: montoPorPersona,
          porcentaje: (montoPorPersona / MONTO_FIJO_TOTAL) * 100,
        }));

        return { ...item, personal: recalculados };
      });

      guardarCambiosInterno(nuevoCarrito);
      return nuevoCarrito;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!max-w-[90vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Editando Orden #{orden?.id?.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {carrito.map((item) => (
              <div key={item.id} className="border rounded-xl p-4 bg-card">
                <h4 className="font-bold mb-3">{item.producto_nombre}</h4>

                <div className="space-y-2">
                  {item.personal.map((p: any) => (
                    <div key={p.personal_id || p.id} className="flex items-center gap-3 bg-secondary/20 p-3 rounded-lg">
                      <span className="flex-1 font-medium text-sm">{p.personal_nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Bs</span>
                        <Input
                          type="number"
                          className="w-20 h-8 text-sm"
                          value={Math.round(p.monto)}
                          onChange={(e) => handleCambiarMontoManual(item.id, p.personal_id || p.id, Number(e.target.value))}
                        />
                        <Badge variant="secondary" className="text-[10px]">
                          {Math.round(p.porcentaje)}%
                        </Badge>
                        <Button
                          size="sm" variant="destructive" className="h-8 w-8 p-0"
                          onClick={() => eliminarPersonalDelPedido(item.id, p.personal_id || p.id)}
                          title="Eliminar del pedido"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 mt-3 border-t bg-secondary/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium">Agregar al Pedido:</label>
                    <Select value={selectedPersonal} onValueChange={setSelectedPersonal}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Seleccionar personal" />
                      </SelectTrigger>
                      <SelectContent>
                        {personalDisponible?.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.nombre_artistico}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={agregarPersonalAlPedido}
                      disabled={!selectedPersonal}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Agregar al Pedido
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex justify-end gap-2 shrink-0">
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={async () => {
              if (!window.confirm("¿Seguro que quieres eliminar este pedido?")) return;
              try {
                await axios.delete(`http://localhost:3000/api/pedidos/${orden.id}`);
                onClose();
                onDeleted?.();
              } catch (error) {
                console.log(error);
              }
            }}
          >
            Eliminar
          </Button>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button className="bg-primary text-white" onClick={guardarCambios}>Guardar Cambios</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
