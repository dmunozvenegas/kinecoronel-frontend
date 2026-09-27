import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Package } from 'lucide-react';
// Asumiendo que tienes tu AuthContext para sacar el ID del paciente logueado
// import { AuthContext } from '../context/AuthContext';

export default function BotikineStore() {
  // const { usuario } = useContext(AuthContext); // Descomenta esto para usar el usuario real
  const [carrito, setCarrito] = useState([]);
  const [cargandoPago, setCargandoPago] = useState(false);
  const [productos, setProductos] = useState([]);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.producto_id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.producto_id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { producto_id: producto.id, nombre: producto.nombre, precio_unitario: producto.precio, cantidad: 1 }];
    });
  };
  
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const { data } = await axios.get('http://localhost:3000/api/botikine/productos');
        setProductos(data);
      } catch (error) {
        console.error("Error al cargar productos", error);
      }
    };
    fetchProductos();
  }, []);

  const modificarCantidad = (id, delta) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.producto_id === id) {
          const nuevaCantidad = item.cantidad + delta;
          return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
        }
        return item;
      })
    );
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.producto_id !== id));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0);

  const procesarPago = async () => {
    if (carrito.length === 0) return;
    setCargandoPago(true);

    try {
      const { data } = await axios.post('http://localhost:3000/api/botikine/checkout', {
        // Reemplaza este ID quemado por: usuario.id (desde tu AuthContext)
        paciente_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
        carrito: carrito
      });

      // Redirigir al paciente a la URL de MercadoPago
      window.location.href = data.init_point;
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Hubo un error al conectar con el sistema de pagos.');
      setCargandoPago(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Vitrina de Productos (Lado Izquierdo) */}
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Package className="text-blue-600" /> Tienda Botikine
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productos.map((prod) => (
            <div key={prod.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">{prod.imagen}</div>
              <h3 className="font-semibold text-gray-800 text-lg">{prod.nombre}</h3>
              <p className="text-sm text-gray-500 my-2">{prod.descripcion}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-blue-600 text-xl">
                  ${prod.precio.toLocaleString('es-CL')}
                </span>
                <button
                  onClick={() => agregarAlCarrito(prod)}
                  className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carrito de Compras (Lado Derecho) */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-fit sticky top-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ShoppingCart className="text-blue-600" /> Tu Carrito
        </h2>

        {carrito.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Tu carrito está vacío</p>
        ) : (
          <div className="space-y-4">
            {carrito.map((item) => (
              <div key={item.producto_id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.nombre}</p>
                  <p className="text-sm text-blue-600 font-bold">${item.precio_unitario.toLocaleString('es-CL')}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                    <button onClick={() => modificarCantidad(item.producto_id, -1)} className="p-1 hover:text-blue-600 text-gray-500"><Minus size={16} /></button>
                    <span className="w-6 text-center text-sm font-medium">{item.cantidad}</span>
                    <button onClick={() => modificarCantidad(item.producto_id, 1)} className="p-1 hover:text-blue-600 text-gray-500"><Plus size={16} /></button>
                  </div>
                  <button onClick={() => eliminarDelCarrito(item.producto_id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-600 font-medium">Total a pagar</span>
                <span className="text-2xl font-bold text-gray-800">${totalCarrito.toLocaleString('es-CL')}</span>
              </div>

              <button
                onClick={procesarPago}
                disabled={cargandoPago}
                className={`w-full py-3 rounded-xl flex justify-center items-center gap-2 font-semibold text-white transition ${
                  cargandoPago ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                }`}
              >
                <CreditCard size={20} />
                {cargandoPago ? 'Generando pago...' : 'Pagar con MercadoPago'}
              </button>
              <p className="text-xs text-center text-gray-400 mt-3">Retiras tus productos el día de tu sesión.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}