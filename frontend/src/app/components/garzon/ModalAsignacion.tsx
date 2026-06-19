import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';

import type { ItemOrden, PersonalParticipante } from '../../data/mockData';

interface ModalAsignacionProps {
  open: boolean;
  onClose: () => void;
  item: any;
  onGuardar: (item: ItemOrden) => void;
  personal: any[];
}

export function ModalAsignacion({ open, onClose, item, onGuardar, personal }: ModalAsignacionProps) {
  const [modo, setModo] = useState<'Bar' | 'Acompañado'>('Bar');
  const [cantidad, setCantidad] = useState(1);
  const [fraccion, setFraccion] = useState<number>(1);
  const [personalSeleccionado, setPersonalSeleccionado] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setCantidad(1);
      setModo('Bar');
      setFraccion(1);
      setPersonalSeleccionado([]);
    }
  }, [item]);

  if (!item) return null;

  const obtenerPagoUnitario = () => {
    const categoria = item.productoCategoria?.toLowerCase() || '';
    const nombre = item.productoNombre?.toLowerCase() || '';

    if (categoria === 'vaso') return 15;
    if (categoria === 'cerveza' || nombre.includes('cerveza')) return 50;
    if (nombre.includes('vaso')) return 15;

    return 150;
  };

  const handleTogglePersonal = (id: string) => {
    if (personalSeleccionado.includes(id)) {
      setPersonalSeleccionado(personalSeleccionado.filter(i => i !== id));
    } else {
      setPersonalSeleccionado([...personalSeleccionado, id]);
    }
  };

  const calcularReparto = (): PersonalParticipante[] => {
    if (modo === 'Bar' || personalSeleccionado.length === 0) return [];

    const pagoUnitario = obtenerPagoUnitario();
    const gananciaBase = pagoUnitario * fraccion * cantidad;
    const porcentajePorPersona = 100 / personalSeleccionado.length;
    const montoPorPersona = gananciaBase / personalSeleccionado.length;

    return personalSeleccionado.map(pid => {
      const p = personal.find(c => c.id === pid)!;
      return {
        id: p.id,
        nombreArtistico: p.nombre_artistico,
        porcentaje: porcentajePorPersona,
        montoFicha: montoPorPersona,
      };
    });
  };

  const reparto = calcularReparto();

  const handleGuardar = () => {
    const precioFinal = item.precio * fraccion;

    const itemCompleto: ItemOrden = {
      id: '',
      productoId: item.productoId,
      productoNombre: item.productoNombre,
      productoCategoria: item.productoCategoria,
      cantidad,
      precio: precioFinal,
      modo,
      personal: modo === 'Acompañado' ? reparto : undefined,
      fraccion,
      anulado: false,
    };

    onGuardar(itemCompleto);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-3xl">
        <DialogHeader>
          <DialogTitle>Asignar Producto</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-5">
            <div className="border rounded-lg p-3">
              <div className="font-semibold">{item.productoNombre}</div>
              <div className="text-sm text-muted-foreground">
                Precio botella: ${item.precio.toLocaleString()}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number" min="1" value={cantidad}
                onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup value={String(fraccion)} onValueChange={(v) => setFraccion(parseFloat(v))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="botella" />
                  <Label htmlFor="botella">Botella completa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0.5" id="media" />
                  <Label htmlFor="media">Media botella</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Modo</Label>
              <RadioGroup value={modo} onValueChange={(v: any) => setModo(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Bar" id="bar" />
                  <Label htmlFor="bar">Bar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Acompañado" id="acompañado" />
                  <Label htmlFor="acompañado">Acompañado</Label>
                </div>
              </RadioGroup>
            </div>

            {/* PERSONAL */}
            {modo === 'Acompañado' && (
              <div className="space-y-2">
                <Label>Seleccionar Personal</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {personal.map((p) => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={personalSeleccionado.includes(p.id)}
                        onCheckedChange={() => handleTogglePersonal(p.id)}
                      />
                      <Label>{p.nombre_artistico}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modo === 'Acompañado' && reparto.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="font-medium mb-2">Reparto</div>
                {reparto.map((r) => (
                  <div key={r.id} className="flex justify-between text-sm">
                    <span>{r.nombreArtistico}</span>
                    <span>{r.porcentaje.toFixed(0)}% — ${r.montoFicha}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleGuardar}>Agregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
