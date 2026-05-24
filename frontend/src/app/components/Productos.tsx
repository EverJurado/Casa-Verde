import React from 'react';
import { Package, Wine, Beer, UtensilsCrossed } from 'lucide-react';
import { formatCurrency } from '../utils/pdfGenerator';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast, Toaster } from "sonner";

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  categoria: string;
  activo: boolean;
  stock_botellas: number;
  stock_medias: number;
};

export function Productos() {

  const [productos, setProductos] = React.useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('Todos');

  const [stockInputs, setStockInputs] = React.useState<any>({});

  // 🔥 NUEVO: estado para crear producto
  const [nuevoProducto, setNuevoProducto] = React.useState({
    nombre: "",
    precio: "",
    categoria: "",
    stock_botellas: "",
    stock_medias: ""
  });

  // cargar productos
  React.useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await fetch("https://casa-verde-production.up.railway.app/api/productos");
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setProductos([]);
    }
  };

  const handleChange = (id: number, field: string, value: any) => {
    setStockInputs((prev: any) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: Number(value) < 0 ? 0 : Number(value)
      }
    }));
  };

const agregarStock = async (id: number) => {
  try {
    const botellas = Number(stockInputs[id]?.botellas || 0);
    const medias = Number(stockInputs[id]?.medias || 0);

    // 🚫 VALIDACIÓN CLAVE
    if (botellas < 0 || medias < 0) {
      toast.error("No puedes ingresar valores negativos");
      return;
    }

    // (opcional) evitar ambos en 0
    if (botellas === 0 && medias === 0) {
      toast.error("Debes ingresar al menos un valor mayor a 0");
      return;
    }

    const res = await fetch(`https://casa-verde-production.up.railway.app/api/productos/${id}/stock`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        botellas,
        medias
      })
    });

    if (!res.ok) {
      throw new Error("Error al actualizar stock");
    }

    toast.success("Stock actualizado correctamente");

    cargarProductos();

    setStockInputs((prev: any) => ({
      ...prev,
      [id]: { botellas: 0, medias: 0 }
    }));

  } catch (error) {
    console.error(error);
    toast.error("Error al actualizar stock");
  }
};

  // 🔥 NUEVO: crear producto
const crearProducto = async () => {
  try {

    const res = await fetch("https://casa-verde-production.up.railway.app/api/productos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre: nuevoProducto.nombre,
        precio: Number(nuevoProducto.precio),
        categoria: nuevoProducto.categoria,
        stock_botellas: Number(nuevoProducto.stock_botellas || 0),
        stock_medias: Number(nuevoProducto.stock_medias || 0)
      })
    });

    if (!res.ok) {
      throw new Error("Error al crear producto");
    }

    toast.success("Producto creado correctamente");

    setNuevoProducto({
      nombre: "",
      precio: "",
      categoria: "",
      stock_botellas: "",
      stock_medias: ""
    });

    cargarProductos();

  } catch (error) {
    console.error(error);
    toast.error("Error al crear producto");
  }
};

  const categories = [
    'Todos',
    ...Array.from(new Set(productos.map(p => p.categoria)))
  ];

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Todos' ||
      producto.categoria === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'Licores': return Wine;
      case 'Cervezas': return Beer;
      case 'Alimentos': return UtensilsCrossed;
      default: return Package;
    }
  };

  const totalProductos = productos.length;

  const valorInventario = productos.reduce(
    (acc, p) => acc + Number(p.precio),
    0
  );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div>
        <h1 className="text-3xl text-primary mb-2">
          Gestión de Productos
        </h1>
        <p className="text-muted-foreground">
          Inventario y control de productos
        </p>
      </div>

      {/* 🔥 FORMULARIO NUEVO */}
      <div className="bg-card border rounded-xl p-6 space-y-3">
        <h2 className="text-lg font-semibold">Agregar Producto</h2>

        <Input
          placeholder="Nombre"
          value={nuevoProducto.nombre}
          onChange={(e) =>
            setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })
          }
        />

        <Input
          type="number"
          placeholder="Precio"
          value={nuevoProducto.precio}
          onChange={(e) =>
            setNuevoProducto({ ...nuevoProducto, precio: e.target.value })
          }
        />

        <Input
          placeholder="Categoría"
          value={nuevoProducto.categoria}
          onChange={(e) =>
            setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })
          }
        />

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Botellas"
            value={nuevoProducto.stock_botellas}
            onChange={(e) =>
              setNuevoProducto({ ...nuevoProducto, stock_botellas: e.target.value })
            }
          />

          <Input
            type="number"
            placeholder="Medias"
            value={nuevoProducto.stock_medias}
            onChange={(e) =>
              setNuevoProducto({ ...nuevoProducto, stock_medias: e.target.value })
            }
          />
        </div>

        <Button onClick={crearProducto}>
          Crear Producto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">

        <div className="bg-card border rounded-xl p-6">
          <p className="text-sm">Total Productos</p>
          <p className="text-2xl">{totalProductos}</p>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <p className="text-sm">Valor Inventario</p>
          <p className="text-2xl">
            Bs {valorInventario?.toLocaleString()}
          </p>
        </div>

      </div>

      {/* Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {filteredProductos.map((producto) => {

          const Icon = getCategoryIcon(producto.categoria);

          return (
            <div
              key={producto.id}
              className="bg-card border rounded-xl p-6"
            >
              <div className="flex justify-between mb-4">

                <div className="bg-primary/20 p-3 rounded-lg">
                  <Icon className="w-6 h-6" />
                </div>

                <span className="text-xs bg-secondary px-2 py-1 rounded">
                  {producto.categoria}
                </span>

              </div>

              <h3 className="text-lg mb-2">
                {producto.nombre}
              </h3>

              <div className="flex justify-between text-sm">
                <span>Botellas</span>
                <span className="font-semibold">
                  {producto.stock_botellas}
                </span>
              </div>

              <div className="flex justify-between text-sm mb-4">
                <span>Medias</span>
                <span className="font-semibold">
                  {producto.stock_medias}
                </span>
              </div>

              <div className="flex gap-2 mb-3">
                <Input
                  type="number"
                  placeholder="Botellas"
                  value={stockInputs[producto.id]?.botellas || ""}
                  onChange={(e) =>
                    handleChange(producto.id, "botellas", e.target.value)
                  }
                />

                <Input
                  type="number"
                  placeholder="Medias"
                  value={stockInputs[producto.id]?.medias || ""}
                  onChange={(e) =>
                    handleChange(producto.id, "medias", e.target.value)
                  }
                />
              </div>

              <Button
                className="w-full mb-4"
                onClick={() => agregarStock(producto.id)}
              >
                Agregar stock
              </Button>

              <div className="flex justify-between">
                <span>Precio</span>
                <span className="text-primary font-semibold">
                 Bs {producto.precio?.toLocaleString()}
                </span>
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}