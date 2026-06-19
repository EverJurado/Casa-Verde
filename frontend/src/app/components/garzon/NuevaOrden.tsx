import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, ShoppingCart, Trash2 } from 'lucide-react';

import { ModalAsignacion } from './ModalAsignacion';
import type { ItemOrden } from '../../data/mockData';

interface NuevaOrdenProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function NuevaOrden({ open, onClose, onSave }: NuevaOrdenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Licores');
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<ItemOrden[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [personalSeleccionado, setPersonalSeleccionado] = useState<any[]>([]);
  const [itemEnEdicion, setItemEnEdicion] = useState<any>(null);
  const [showModalAsignacion, setShowModalAsignacion] = useState(false);

  const categorias = ['Licores', 'Cerveza', 'Vaso'];

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get('https://casa-verde-production.up.railway.app/api/productos');
        setProductos(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setProductos([]);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    const fetchPersonal = async () => {
      try {
        const res = await axios.get('https://casa-verde-production.up.railway.app/api/personal');
        setPersonal(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Error al cargar personal:', error);
        setPersonal([]);
      }
    };
    fetchPersonal();
  }, []);

  const togglePersonal = (p: any) => {
    const existe = personalSeleccionado.find(c => c.id === p.id);
    if (existe) {
      setPersonalSeleccionado(personalSeleccionado.filter(c => c.id !== p.id));
    } else {
      setPersonalSeleccionado([...personalSeleccionado, p]);
    }
  };

  const productosFiltrados = productos.filter((p) => {
    const matchSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = categoriaActiva === 'Todas' || p.categoria === categoriaActiva;
    return matchSearch && matchCategoria;
  });

  const handleAgregarProducto = (producto: any) => {
    setItemEnEdicion({
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoCategoria: producto.categoria,
      cantidad: 1,
      precio: producto.precio,
    });
    setShowModalAsignacion(true);
  };

  const handleGuardarItem = (item: ItemOrden) => {
    setCarrito([...carrito, { ...item, id: Date.now().toString(), anulado: false }]);
    setShowModalAsignacion(false);
    setItemEnEdicion(null);
  };

  const handleEliminarItem = (id: string) => {
    setCarrito(carrito.filter((item) => item.id !== id));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const guardarPedido = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

      const payload = {
        garzon_id: usuario.id,
        total: totalCarrito,
        items: carrito,
      };

      await axios.post("https://casa-verde-production.up.railway.app/api/pedidos", payload);

      setCarrito([]);
      onClose();
      onSave?.();
      toast.success("Pedido creado correctamente");
    } catch (error: any) {
      console.error("Error guardando pedido", error);
      toast.error(error.response?.data?.error || "No hay stock suficiente");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="!max-w-[95vw] md:!max-w-[90vw] w-full max-h-[95vh] md:max-h-[90vh] p-0 overflow-hidden flex flex-col">

          <DialogHeader className="px-6 py-4 border-b bg-background shrink-0">
            <DialogTitle className="text-xl md:text-2xl flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 md:h-6 md:h-6" />
              Nueva Orden
            </DialogTitle>
            <DialogDescription>
              Selecciona productos y agrégalos al carrito
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden min-h-0">

            {/* PRODUCTOS */}
            <div className="w-full md:flex-[1.5] lg:flex-[2] flex flex-col border-r border-b md:border-b-0 bg-background min-h-[400px] md:min-h-0">
              <div className="p-4 border-b bg-secondary/10 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Tabs value={categoriaActiva} onValueChange={setCategoriaActiva} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <TabsList className="bg-secondary/30 border-b px-2 h-11 shrink-0 overflow-x-auto justify-start">
                  {categorias.map((cat) => (
                    <TabsTrigger key={cat} value={cat} className="text-xs md:text-sm">{cat}</TabsTrigger>
                  ))}
                </TabsList>

                <ScrollArea className="flex-1 p-4">
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {productosFiltrados.map((producto) => (
                      <Button
                        key={producto.id}
                        variant="outline"
                        onClick={() => handleAgregarProducto(producto)}
                        className="h-auto flex flex-col justify-between items-start p-2 md:p-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                      >
                        <div className="font-semibold text-xs md:text-sm line-clamp-2 w-full">{producto.nombre}</div>
                        <div className="w-full flex justify-between items-end gap-2">
                          <div className="text-primary font-bold text-sm md:text-base">
                            Bs {Number(producto.precio).toLocaleString()}
                          </div>
                          <Badge variant="secondary" className="text-[8px] md:text-[10px] px-1 shrink-0">
                            {producto.categoria}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </Tabs>
            </div>

            {/* CARRITO */}
            <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-secondary/5 min-h-[400px] md:min-h-0">
              <div className="p-4 border-b bg-background/50 shrink-0">
                <h3 className="font-semibold text-lg flex justify-between items-center">
                  Carrito
                  <Badge variant="outline">{carrito.length} items</Badge>
                </h3>
              </div>

              {/* PERSONAL */}
              <div className="p-3 md:p-4 border-b shrink-0">
                <span className="text-xs font-medium text-muted-foreground uppercase mb-2 block">Seleccionar Personal</span>
                <ScrollArea className="h-[80px] md:h-[100px]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-2">
                    {personal?.map((p: any) => (
                      <Button
                        key={p.id}
                        variant={personalSeleccionado.some(c => c.id === p.id) ? "default" : "outline"}
                        size="sm"
                        className="text-xs justify-start px-2 hover:border-primary/50"
                        onClick={() => togglePersonal(p)}
                      >
                        {p.nombre_artistico}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <ScrollArea className="flex-1 p-4 min-h-[200px]">
                {carrito.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Carrito vacío</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carrito.map((item) => (
                      <div key={item.id} className="bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{item.productoNombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.cantidad} x Bs {item.precio}
                            </div>
                          </div>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => handleEliminarItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="text-right font-bold text-sm mt-1">
                          Bs {(item.precio * item.cantidad).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t bg-background shrink-0 space-y-3">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-muted-foreground text-sm font-normal">Total a pagar:</span>
                  <span>Bs {totalCarrito.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button disabled={carrito.length === 0} onClick={guardarPedido}>Finalizar</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ModalAsignacion
        open={showModalAsignacion}
        onClose={() => { setShowModalAsignacion(false); setItemEnEdicion(null); }}
        item={itemEnEdicion}
        onGuardar={handleGuardarItem}
        personal={personal}
      />
      <Toaster richColors position="top-right" />
    </>
  );
}
