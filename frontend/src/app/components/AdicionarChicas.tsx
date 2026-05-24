import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export function AdicionarPersonal() {
  const [nombreArtistico, setNombreArtistico] = useState('');
  const [celular, setCelular] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [personalId, setPersonalId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.personal) {
      const p = location.state.personal;
      setNombreArtistico(p.nombre_artistico);
      setCelular(p.celular || '');
      setPersonalId(p.id);
      setIsEditing(true);
    }
    // Compatibilidad con estado anterior que usaba "chica"
    if (location.state?.chica) {
      const p = location.state.chica;
      setNombreArtistico(p.nombre_artistico);
      setCelular(p.celular || '');
      setPersonalId(p.id);
      setIsEditing(true);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        await axios.put(`http://localhost:3000/api/personal/${personalId}`, {
          nombre_artistico: nombreArtistico,
          celular,
        });
        alert('Personal actualizado correctamente');
      } else {
        await axios.post('http://localhost:3000/api/personal', {
          nombre_artistico: nombreArtistico,
          celular,
        });
        alert('Personal agregado correctamente');
        setNombreArtistico('');
        setCelular('');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl text-primary mb-4">
        {isEditing ? 'Editar Personal' : 'Adicionar Personal'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre Artístico"
          value={nombreArtistico}
          onChange={(e) => setNombreArtistico(e.target.value)}
          className="w-full border p-3 rounded-lg"
          required
        />

        <input
          type="text"
          placeholder="Celular"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
          className="w-full border p-3 rounded-lg"
        />

        <button className="w-full bg-primary text-white py-3 rounded-lg">
          {isEditing ? 'Actualizar' : 'Guardar'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/app/personal')}
          className="w-full bg-gray-500 text-white py-3 rounded-lg mt-2"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
