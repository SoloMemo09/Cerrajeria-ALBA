// Cargar productos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
  });
  
  // Función para obtener y mostrar productos
  async function cargarProductos() {
    try {
      const response = await fetch('http://localhost:3000/api/productos');
      const productos = await response.json();
      mostrarProductos(productos);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  }
  
  // Mostrar productos en el HTML
  function mostrarProductos(productos) {
    const listaProductos = document.getElementById('lista-productos');
    listaProductos.innerHTML = ''; // Limpiar lista
  
    productos.forEach(producto => {
      listaProductos.innerHTML += `
        <div class="producto">
          <h3>${producto.nombre}</h3>
          <p>${producto.descripcion || 'Sin descripción'}</p>
          <p><strong>Precio:</strong> $${producto.precio.toFixed(2)}</p>
          <p><strong>Stock:</strong> ${producto.cantidad_stock}</p>
        </div>
      `;
    });
  }
  
  // Añadir nuevo producto
  document.getElementById('formulario-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const nuevoProducto = {
      nombre: document.getElementById('nombre').value,
      descripcion: document.getElementById('descripcion').value,
      precio: parseFloat(document.getElementById('precio').value),
      cantidad_stock: parseInt(document.getElementById('stock').value),
      id_categoria: parseInt(document.getElementById('categoria').value)
    };
  
    try {
      const response = await fetch('http://localhost:3000/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProducto)
      });
  
      if (response.ok) {
        alert('✅ Producto añadido correctamente');
        document.getElementById('formulario-producto').reset();
        cargarProductos(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al añadir producto:', error);
      alert('❌ Error al añadir producto');
    }
  });