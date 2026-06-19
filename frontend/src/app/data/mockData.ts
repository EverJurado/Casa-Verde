export interface ItemOrden {
  id: string;
  productoId: string;
  productoNombre: string;
  productoCategoria?: string;
  cantidad: number;
  precio: number;
  modo: 'Bar' | 'Acompañado';
  personal?: PersonalParticipante[];
  fraccion?: number;
  anulado: boolean;
  anuladoPor?: string;
  anuladoFecha?: string;
}

export interface PersonalParticipante {
  id: string;
  nombreArtistico: string;
  porcentaje: number;
  montoFicha: number;
}

export interface Orden {
  id: string;
  fecha: string;
  garzonId: string;
  garzonNombre: string;
  zona?: 'Bar' | 'VIP' | 'Salón';
  items: ItemOrden[];
  estado: 'abierta' | 'cerrada';
  total: number;
}

export interface Personal {
  id: string;
  nombreArtistico: string;
  celular?: string;
  totalFichasDia: number;
  totalFichasMes: number;
  totalServicios: number;
}

export interface Garzon {
  id: string;
  nombre: string;
  ventasDia: number;
  ventasMes: number;
  comisionDia: number;
  comisionMes: number;
  activo: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: 'Licores' | 'Servicios';
  precio: number;
  stock: number;
}

export const MOCK_PERSONAL: Personal[] = [
  { id: 'c1', nombreArtistico: 'Valentina', celular: '9 8765 4321', totalFichasDia: 120000, totalFichasMes: 3450000, totalServicios: 45 },
  { id: 'c2', nombreArtistico: 'Isabella', celular: '9 7654 3210', totalFichasDia: 150000, totalFichasMes: 4200000, totalServicios: 56 },
  { id: 'c3', nombreArtistico: 'Camila', celular: '9 6543 2109', totalFichasDia: 100000, totalFichasMes: 2980000, totalServicios: 38 },
  { id: 'c4', nombreArtistico: 'Sofía', celular: '9 5432 1098', totalFichasDia: 180000, totalFichasMes: 5120000, totalServicios: 68 },
  { id: 'c5', nombreArtistico: 'Daniela', celular: '9 4321 0987', totalFichasDia: 80000, totalFichasMes: 2340000, totalServicios: 31 },
  { id: 'c6', nombreArtistico: 'Natalia', celular: '9 3210 9876', totalFichasDia: 140000, totalFichasMes: 3890000, totalServicios: 52 },
  { id: 'c7', nombreArtistico: 'Martina', celular: '9 2109 8765', totalFichasDia: 95000, totalFichasMes: 2750000, totalServicios: 42 },
  { id: 'c8', nombreArtistico: 'Catalina', celular: '9 1098 7654', totalFichasDia: 165000, totalFichasMes: 4680000, totalServicios: 61 },
];

export const MOCK_GARZONES: Garzon[] = [
  { id: '2', nombre: 'Carlos Mendez', ventasDia: 450000, ventasMes: 12500000, comisionDia: 45000, comisionMes: 1250000, activo: true },
  { id: '3', nombre: 'Luis Torres', ventasDia: 380000, ventasMes: 10800000, comisionDia: 38000, comisionMes: 1080000, activo: true },
  { id: 'g3', nombre: 'Pedro Silva', ventasDia: 520000, ventasMes: 14200000, comisionDia: 52000, comisionMes: 1420000, activo: true },
  { id: 'g4', nombre: 'Miguel Rojas', ventasDia: 290000, ventasMes: 8900000, comisionDia: 29000, comisionMes: 890000, activo: false },
];

export const MOCK_PRODUCTOS: Producto[] = [
  { id: 'p1', nombre: 'Abuelo', categoria: 'Licores', precio: 180000, stock: 24 },
  { id: 'p2', nombre: 'Solera', categoria: 'Licores', precio: 150000, stock: 28 },
  { id: 'p3', nombre: 'Whisky Premium', categoria: 'Licores', precio: 200000, stock: 18 },
  { id: 'p4', nombre: 'Vodka Absolut', categoria: 'Licores', precio: 120000, stock: 35 },
  { id: 'p5', nombre: 'Ron Diplomático', categoria: 'Licores', precio: 95000, stock: 28 },
  { id: 's1', nombre: 'Servicio Completo', categoria: 'Servicios', precio: 80000, stock: 999 },
  { id: 's2', nombre: 'Servicio Express', categoria: 'Servicios', precio: 50000, stock: 999 },
];

export const MOCK_ORDENES: Orden[] = [
  {
    id: 'o1', fecha: '2026-02-27T20:30:00', garzonId: '2', garzonNombre: 'Carlos Mendez',
    zona: 'VIP', estado: 'abierta',
    items: [
      {
        id: 'i1', productoId: 'p1', productoNombre: 'Abuelo', cantidad: 1, precio: 180000,
        modo: 'Acompañado', fraccion: 1.0, anulado: false,
        personal: [
          { id: 'c1', nombreArtistico: 'Valentina', porcentaje: 50, montoFicha: 45000 },
          { id: 'c2', nombreArtistico: 'Isabella', porcentaje: 50, montoFicha: 45000 },
        ],
      },
      { id: 'i2', productoId: 'p10', productoNombre: 'Red Bull', cantidad: 4, precio: 6000, modo: 'Bar', anulado: false },
    ],
    total: 204000,
  },
  {
    id: 'o2', fecha: '2026-02-27T21:15:00', garzonId: '2', garzonNombre: 'Carlos Mendez',
    zona: 'Salón', estado: 'abierta',
    items: [
      {
        id: 'i3', productoId: 'p2', productoNombre: 'Solera', cantidad: 1, precio: 150000,
        modo: 'Acompañado', fraccion: 0.5, anulado: false,
        personal: [{ id: 'c4', nombreArtistico: 'Sofía', porcentaje: 100, montoFicha: 75000 }],
      },
    ],
    total: 175000,
  },
];

export interface DetalleVentaPersonal {
  id: string;
  fecha: string;
  producto: string;
  cantidad: number;
  participantes: number;
  fraccion: number;
  ganancia: number;
  estado: 'Activo' | 'Anulado';
}

export const MOCK_DETALLE_PERSONAL: { [personalId: string]: DetalleVentaPersonal[] } = {
  c1: [
    { id: 'dv1', fecha: '2026-02-27T20:30:00', producto: 'Abuelo', cantidad: 1, participantes: 2, fraccion: 1.0, ganancia: 45000, estado: 'Activo' },
  ],
  c4: [
    { id: 'dv3', fecha: '2026-02-27T21:15:00', producto: 'Solera', cantidad: 1, participantes: 1, fraccion: 0.5, ganancia: 75000, estado: 'Activo' },
  ],
};

export const MOCK_VENTAS_POR_DIA = [
  { dia: 'Lun', ventas: 3200000 },
  { dia: 'Mar', ventas: 2800000 },
  { dia: 'Mié', ventas: 4100000 },
  { dia: 'Jue', ventas: 3500000 },
  { dia: 'Vie', ventas: 5800000 },
  { dia: 'Sáb', ventas: 6200000 },
  { dia: 'Dom', ventas: 4800000 },
];

export const MOCK_VENTAS_POR_GARZON = [
  { nombre: 'Carlos', ventas: 12500000 },
  { nombre: 'Luis', ventas: 10800000 },
  { nombre: 'Pedro', ventas: 14200000 },
  { nombre: 'Miguel', ventas: 8900000 },
];

export const MOCK_FICHAS_POR_PERSONAL = [
  { nombre: 'Sofía', fichas: 5120000 },
  { nombre: 'Catalina', fichas: 4680000 },
  { nombre: 'Isabella', fichas: 4200000 },
  { nombre: 'Natalia', fichas: 3890000 },
  { nombre: 'Valentina', fichas: 3450000 },
  { nombre: 'Camila', fichas: 2980000 },
  { nombre: 'Martina', fichas: 2750000 },
  { nombre: 'Daniela', fichas: 2340000 },
];

// Alias para compatibilidad
export const MOCK_CHICAS = MOCK_PERSONAL;
export type ChicaParticipante = PersonalParticipante;
export const MOCK_FICHAS_POR_CHICA = MOCK_FICHAS_POR_PERSONAL;
