import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, Plus, Edit2, Power, ShieldCheck } from 'lucide-react';

interface Garzon {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  username: string;
  ci: string;
  celular: string;
  celular_referencia?: string;
  activo: boolean;
  force_password_change: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  username: '',
  ci: '',
  celular: '',
  celular_referencia: '',
  password: '',
  activo: true,
};

export function GarzonesAdmin() {
  const [garzones, setGarzones] = useState<Garzon[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal formulario
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Garzon | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Modal contraseña maestra
  const [masterOpen, setMasterOpen] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [masterError, setMasterError] = useState('');
  const [pendingAction, setPendingAction] = useState<'guardar' | 'toggle' | null>(null);
  const [pendingToggle, setPendingToggle] = useState<Garzon | null>(null);
  const [saving, setSaving] = useState(false);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const headers = { 'x-user-rol': 'admin' };

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('https://casa-verde-production.up.railway.app/api/usuarios', {
        params: { search, page },
        headers,
      });
      setGarzones(res.data.garzones);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Error cargando garzones');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { cargar(); }, [cargar]);

  // Verificar contraseña maestra contra el backend
  const verificarMaster = async (): Promise<boolean> => {
    try {
      const res = await axios.post('https://casa-verde-production.up.railway.app/api/verify-master-password', {
        admin_id: usuario.id,
        password: masterPassword,
      });
      return res.data.valid === true;
    } catch {
      return false;
    }
  };

  // Abrir modal de formulario
  const abrirCrear = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const abrirEditar = (g: Garzon) => {
    setEditando(g);
    setForm({
      nombre: g.nombre,
      apellido_paterno: g.apellido_paterno,
      apellido_materno: g.apellido_materno || '',
      username: g.username,
      ci: g.ci,
      celular: g.celular,
      celular_referencia: g.celular_referencia || '',
      password: '',
      activo: g.activo,
    });
    setModalOpen(true);
  };

  // Al hacer click en Guardar del formulario → pedir contraseña maestra
  const pedirMasterParaGuardar = () => {
    setMasterPassword('');
    setMasterError('');
    setPendingAction('guardar');
    setPendingToggle(null);
    setModalOpen(false);
    setMasterOpen(true);
  };

  // Al hacer click en toggle → pedir contraseña maestra
  const pedirMasterParaToggle = (g: Garzon) => {
    setMasterPassword('');
    setMasterError('');
    setPendingAction('toggle');
    setPendingToggle(g);
    setMasterOpen(true);
  };

  // Confirmar con contraseña maestra y ejecutar la acción pendiente
  const confirmarConMaster = async () => {
    setSaving(true);
    setMasterError('');

    const valida = await verificarMaster();
    if (!valida) {
      setMasterError('Contraseña maestra incorrecta');
      setSaving(false);
      return;
    }

    try {
      if (pendingAction === 'guardar') {
        if (editando) {
          await axios.put(`https://casa-verde-production.up.railway.app/api/usuarios/${editando.id}`, form, { headers });
          toast.success('Garzón actualizado');
        } else {
          await axios.post('https://casa-verde-production.up.railway.app/api/usuarios', form, { headers });
          toast.success('Garzón creado');
        }
      } else if (pendingAction === 'toggle' && pendingToggle) {
        await axios.patch(`https://casa-verde-production.up.railway.app/api/usuarios/${pendingToggle.id}/toggle`, {}, { headers });
        toast.success(pendingToggle.activo ? 'Garzón desactivado' : 'Garzón reactivado');
      }
      setMasterOpen(false);
      cargar();
    } catch (err: any) {
      setMasterError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-primary mb-1">Garzones</h1>
          <p className="text-muted-foreground text-sm">{total} registros totales</p>
        </div>
        <Button onClick={abrirCrear} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Añadir Garzón
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, usuario o CI..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Tabla */}
      <div className="bg-card border border-primary/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-primary uppercase">Nombre completo</th>
                <th className="px-4 py-3 text-left text-xs text-primary uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs text-primary uppercase">CI</th>
                <th className="px-4 py-3 text-left text-xs text-primary uppercase">Celular</th>
                <th className="px-4 py-3 text-left text-xs text-primary uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs text-primary uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
              ) : garzones.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay garzones registrados</td></tr>
              ) : (
                garzones.map(g => (
                  <tr key={g.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {g.nombre} {g.apellido_paterno} {g.apellido_materno || ''}
                      {g.force_password_change && (
                        <span className="ml-2 text-xs text-amber-500" title="Debe cambiar contraseña">⚠</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{g.username}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{g.ci}</td>
                    <td className="px-4 py-3 text-sm">{g.celular}</td>
                    <td className="px-4 py-3">
                      <Badge variant={g.activo ? 'default' : 'secondary'}
                        className={g.activo ? 'bg-green-500/20 text-green-600' : 'text-muted-foreground'}>
                        {g.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => abrirEditar(g)} title="Editar">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={g.activo ? 'destructive' : 'outline'}
                          onClick={() => pedirMasterParaToggle(g)}
                          title={g.activo ? 'Desactivar' : 'Reactivar'}
                        >
                          <Power className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal formulario crear/editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Garzón' : 'Nuevo Garzón'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={e => field('nombre', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Apellido paterno *</Label>
                <Input value={form.apellido_paterno} onChange={e => field('apellido_paterno', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Apellido materno</Label>
              <Input value={form.apellido_materno} onChange={e => field('apellido_materno', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Usuario *</Label>
                <Input value={form.username} onChange={e => field('username', e.target.value)} placeholder="ej: jperez" />
              </div>
              <div className="space-y-1">
                <Label>CI *</Label>
                <Input value={form.ci} onChange={e => field('ci', e.target.value)} placeholder="Solo números" inputMode="numeric" />
              </div>
            </div>
            {!editando && (
              <p className="text-xs text-muted-foreground">
                La contraseña inicial será el CI del garzón. Deberá cambiarla al primer ingreso.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Celular *</Label>
                <Input value={form.celular} onChange={e => field('celular', e.target.value)} placeholder="ej: 71234567" />
              </div>
              <div className="space-y-1">
                <Label>Celular referencia</Label>
                <Input value={form.celular_referencia} onChange={e => field('celular_referencia', e.target.value)} />
              </div>
            </div>
            {editando && (
              <div className="space-y-1">
                <Label>Nueva contraseña (vacío = no cambia)</Label>
                <Input type="password" value={form.password} onChange={e => field('password', e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="activo" checked={form.activo}
                onChange={e => field('activo', e.target.checked)} className="w-4 h-4" />
              <Label htmlFor="activo">Activo</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={pedirMasterParaGuardar} className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal contraseña maestra */}
      <Dialog open={masterOpen} onOpenChange={v => { if (!saving) setMasterOpen(v); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Confirmar con Contraseña Maestra
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pendingAction === 'toggle' && pendingToggle
              ? `¿${pendingToggle.activo ? 'Desactivar' : 'Reactivar'} a ${pendingToggle.nombre}?`
              : editando ? `Confirmar edición de ${editando.nombre}` : 'Confirmar creación de nuevo garzón'}
          </p>
          <div className="space-y-3 py-2">
            <Input
              type="password"
              placeholder="Ingresa tu contraseña de admin"
              value={masterPassword}
              onChange={e => { setMasterPassword(e.target.value); setMasterError(''); }}
              onKeyDown={e => e.key === 'Enter' && confirmarConMaster()}
              autoFocus
            />
            {masterError && <p className="text-red-500 text-sm">{masterError}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMasterOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={confirmarConMaster} disabled={saving || !masterPassword}>
              {saving ? 'Verificando...' : 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster richColors position="top-right" />
    </div>
  );
}
