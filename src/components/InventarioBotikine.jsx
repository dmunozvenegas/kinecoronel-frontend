import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';

export default function InventarioBotikine() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null); // Nuevo estado para edición
  
  const estadoInicial = { nombre: '', descripcion: '', precio: '', stock: '', categoria: '', imagen_url: '📦' };
  const [formData, setFormData] = useState(estadoInicial);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      const { data } = await axios.get('http://localhost:3000/api/botikine/productos');
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Función para preparar el modal en modo Edición
  const abrirModalEdicion = (producto) => {
    setProductoEditando(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      stock: producto.stock,
      categoria: producto.categoria || '',
      imagen_url: producto.imagen_url || '📦'
    });
    setModalAbierto(true);
  };

  // Función para resetear y cerrar el modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoEditando(null);
    setFormData(estadoInicial);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        precio: parseInt(formData.precio, 10),
        stock: parseInt(formData.stock, 10)
      };

      if (productoEditando) {
        // Modo Edición (PUT)
        await axios.put(`http://localhost:3000/api/botikine/productos/${productoEditando.id}`, payload);
      } else {
        // Modo Creación (POST)
        await axios.post('http://localhost:3000/api/botikine/productos', payload);
      }

      cerrarModal();
      cargarProductos();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("Hubo un error al guardar el producto.");
    }
  };

  // Función para Eliminar
  const manejarEliminar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar "${nombre}" de la tienda?`)) {
      try {
        await axios.delete(`http://localhost:3000/api/botikine/productos/${id}`);
        cargarProductos();
      } catch (error) {
        console.error("Error al eliminar:", error);
        alert("Hubo un error al eliminar el producto.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" /> Inventario Botikine
          </h2>
          <p className="text-gray-500 text-sm mt-1">Gestiona los productos, stock y precios de tu tienda.</p>
        </div>
        <button 
          onClick={() => { setProductoEditando(null); setFormData(estadoInicial); setModalAbierto(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition shadow-sm"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium">Categoría</th>
                <th className="p-4 font-medium text-right">Precio</th>
                <th className="p-4 font-medium text-center">Stock</th>
                <th className="p-4 font-medium text-center">Estado</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">Cargando inventario...</td></tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                    No hay productos registrados en el inventario.
                  </td>
                </tr>
              ) : (
                productos.map((prod) => (
                  <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl bg-white border border-gray-100 p-2 rounded-lg">{prod.imagen_url}</div>
                        <div>
                          <p className="font-semibold text-gray-800">{prod.nombre}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{prod.descripcion}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{prod.categoria || 'Sin categoría'}</td>
                    <td className="p-4 text-right font-medium text-gray-800">${prod.precio.toLocaleString('es-CL')}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        prod.stock > 5 ? 'bg-green-100 text-green-700' : 
                        prod.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {prod.stock} un.
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-medium text-green-600">Activo</span>
                    </td>
                    <td className="p-4 text-right">
                      {/* Botón Editar conectado */}
                      <button 
                        onClick={() => abrirModalEdicion(prod)} 
                        className="text-gray-400 hover:text-blue-600 p-1 mx-1 transition"
                      >
                        <Edit size={18} />
                      </button>
                      {/* Botón Eliminar conectado */}
                      <button 
                        onClick={() => manejarEliminar(prod.id, prod.nombre)} 
                        className="text-gray-400 hover:text-red-600 p-1 mx-1 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {productoEditando ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows="2"
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio (CLP)</label>
                  <input type="number" name="precio" value={formData.precio} onChange={handleChange} required min="0"
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleChange} required min="0"
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <input type="text" name="categoria" value={formData.categoria} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Emoji)</label>
                  <input type="text" name="imagen_url" value={formData.imagen_url} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={cerrarModal}
                  className="flex-1 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition shadow-sm">
                  {productoEditando ? 'Guardar Cambios' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}