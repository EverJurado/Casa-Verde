import React from 'react';
import { Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatCurrency } from '../utils/pdfGenerator';

interface ServicioExtra {
  id: string;
  fecha: string;
  personalId: string;
  personalNombre: string;
  tipo: string;
  precio: number;
  porcentajePersonal: number;
  montoPersonal: number;
  duracionMinutos: number;
  horaFin: string;
}

export function ServiciosExtras() {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [servicios, setServicios] = React.useState<ServicioExtra[]>([]);
  const [personal, setPersonal] = React.useState<any[]>([]);

  const [personalId, setPersonalId] = React.useState('');
  const [precio, setPrecio] = React.useState('');
  const [tipoServicio, setTipoServicio] = React.useState('salida');
  const [duracion, setDuracion] = React.useState('30');
  const [selectedServicio, setSelectedServicio] = React.useState<ServicioExtra | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const agruparPorFecha = (data: ServicioExtra[]): Record<string, ServicioExtra[]> => {
    const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

    return data.reduce((acc: Record<string, ServicioExtra[]>, item: ServicioExtra) => {
      const f = new Date(item.fecha);
      const horas = f.getHours();
      const turno = horas >= 8 && horas < 20 ? "día" : "noche";
      const dia = String(f.getDate()).padStart(2, "0");
      const mes = String(f.getMonth() + 1).padStart(2, "0");
      const key = `${dias[f.getDay()]} ${dia}/${mes} — Turno ${turno}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };

  const serviciosAgrupados = agruparPorFecha(servicios);

  React.useEffect(() => {
    cargarPersonal();
    cargarServiciosActivos();
  }, []);

  const cargarPersonal = async () => {
    try {
      const res = await fetch("https://casa-verde-production.up.railway.app/api/personal");
      const data = await res.json();
      setPersonal(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar personal:", error);
      setPersonal([]);
    }
  };

  const cargarServiciosActivos = async () => {
    const res = await fetch("https://casa-verde-production.up.railway.app/api/servicios-extras");
    const data = await res.json();

    const formateados = data.map((s: any) => ({
      id: s.id,
      fecha: s.fecha_local,
      personalId: s.personal_id,
      personalNombre: s.nombre_artistico,
      tipo: s.tipo,
      precio: Number(s.monto),
      porcentajePersonal: Number(s.porcentaje_personal),
      montoPersonal: Number(s.monto_personal),
      duracionMinutos: s.duracion_minutos,
      horaFin: s.hora_fin_local,
      garzon_id: s.garzon_id,
    }));

    setServicios(formateados);
  };

  const personalOcupado = (id: string) => {
    const ahora = new Date();
    return servicios.find(s => s.tipo === "salida" && s.personalId === id && new Date(s.horaFin) > ahora);
  };

  const resetForm = () => {
    setSelectedServicio(null);
    setIsEditing(false);
    setPersonalId('');
    setPrecio('');
    setTipoServicio('salida');
    setDuracion('30');
    setShowCreateModal(false);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditarServicio = (servicio: ServicioExtra) => {
    setSelectedServicio(servicio);
    setIsEditing(true);
    setShowCreateModal(true);
    setPersonalId(servicio.personalId);
    setPrecio(servicio.precio.toString());
    setTipoServicio(servicio.tipo);
    setDuracion(servicio.duracionMinutos?.toString() || '30');
  };

  const handleEliminarServicio = async (id: string) => {
    if (!window.confirm('¿Eliminar este servicio extra?')) return;
    try {
      await fetch(`https://casa-verde-production.up.railway.app/api/servicios-extras/${id}`, { method: 'DELETE' });
      await cargarServiciosActivos();
    } catch (error) {
      console.error(error);
    }
  };

  const handleGuardarServicio = async () => {
    if (!personalId || !precio) {
      alert('Completa todos los campos');
      return;
    }

    try {
      if (isEditing && !selectedServicio) {
        alert('No hay servicio seleccionado para editar');
        return;
      }

      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

      const payload = {
        personal_id: personalId,
        monto: Number(precio),
        tipo: tipoServicio,
        duracion_minutos: tipoServicio === 'propina' ? 0 : Number(duracion),
        garzon_id: usuario.id,
      };

      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing
        ? `https://casa-verde-production.up.railway.app/api/servicios-extras/${selectedServicio?.id}`
        : 'https://casa-verde-production.up.railway.app/api/servicios-extras';

      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      await cargarServiciosActivos();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-primary mb-2">Servicios Extras</h1>
          <p className="text-muted-foreground">Registro de salidas y propinas</p>
        </div>
      </div>

      <Button onClick={handleOpenCreateModal}>
        <Plus className="mr-2 h-5 w-5" />
        Registrar Servicio
      </Button>

      <div className="space-y-4">
        {Object.entries(serviciosAgrupados).map(([grupo, items]) => (
          <div key={grupo} className="bg-card border border-primary/20 rounded-xl p-4 space-y-2">
            <h3 className="text-lg font-bold capitalize">{grupo}</h3>

            <table className="w-full mt-2">
              <thead className="bg-secondary/20">
                <tr>
                  <th className="px-6 py-2 text-left text-xs">Personal</th>
                  <th className="px-6 py-2 text-left text-xs">Tipo</th>
                  <th className="px-6 py-2 text-left text-xs">Precio</th>
                  <th className="px-6 py-2 text-left text-xs">Ganancia</th>
                  <th className="px-6 py-2 text-left text-xs">Inicio</th>
                  <th className="px-6 py-2 text-left text-xs">Fin</th>
                  <th className="px-6 py-2 text-left text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((servicio) => (
                  <tr key={servicio.id} className="hover:bg-secondary/10">
                    <td className="px-6 py-2">{servicio.personalNombre}</td>
                    <td className="px-6 py-2">{servicio.tipo === "propina" ? "Propina" : "Salida"}</td>
                    <td className="px-6 py-2">{formatCurrency(servicio.precio)}</td>
                    <td className="px-6 py-2 text-green-400">{formatCurrency(servicio.montoPersonal)}</td>
                    <td className="px-6 py-2">
                      {new Date(servicio.fecha).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-2">
                      {servicio.horaFin
                        ? new Date(servicio.horaFin).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
                        : "-"}
                    </td>
                    <td className="px-6 py-2 flex gap-2">
                      <button type="button" onClick={() => handleEditarServicio(servicio)} className="text-sky-600 hover:text-sky-800" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleEliminarServicio(servicio.id)} className="text-red-600 hover:text-red-800" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Servicio</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipoServicio} onValueChange={setTipoServicio}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="salida">Salida (60%)</SelectItem>
                  <SelectItem value="propina">Propina (100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Seleccionar Personal</Label>
              <Select value={personalId} onValueChange={setPersonalId}>
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  {personal.map(p => {
                    const ocupado = personalOcupado(p.id);
                    const bloquear = tipoServicio === "salida" && ocupado;
                    return (
                      <SelectItem key={p.id} value={p.id} disabled={!!bloquear} className={bloquear ? "text-red-500" : ""}>
                        {p.nombre_artistico}
                        {ocupado && tipoServicio === "salida" && (
                          <span className="ml-2 text-xs">
                            (Ocupado hasta {new Date(ocupado.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {tipoServicio === "salida" && (
              <div>
                <Label>Duración</Label>
                <Select value={duracion} onValueChange={setDuracion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Media hora</SelectItem>
                    <SelectItem value="60">1 Hora</SelectItem>
                    <SelectItem value="90">1 Hora y media</SelectItem>
                    <SelectItem value="120">2 Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Precio</Label>
              <Input type="number" value={precio} onChange={e => setPrecio(e.target.value)} />
            </div>

            <Button onClick={handleGuardarServicio}>
              {isEditing ? 'Guardar cambios' : 'Registrar Servicio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
