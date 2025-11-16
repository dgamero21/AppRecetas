import React from 'react';

const HelpView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Guía de Usuario</h2>

      <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
              ¿Prefieres una guía más visual? 
              <a 
                  href="https://gastronomia-l4zwmfb.gamma.site/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-bold underline hover:text-amber-600 ml-2"
              >
                  Visita nuestra guía interactiva aquí
              </a>
          </p>
      </div>

      <div className="space-y-10 text-gray-700 prose prose-lg max-w-none">
        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">1. Primeros Pasos: Iniciar Sesión y Navegación</h3>
          <ul className="list-disc list-inside space-y-2 mt-4">
            <li><strong>Inicio de Sesión:</strong> Accede a la aplicación con tu usuario y contraseña. Recuerda que solo el administrador puede crear nuevas cuentas.</li>
            <li><strong>Pantalla de Inicio:</strong> Al entrar, verás cuatro accesos directos principales que te llevarán a las secciones más importantes de la aplicación.</li>
            <li><strong>Navegación:</strong> En el lado izquierdo de la pantalla, siempre tendrás visible el menú lateral para navegar fácilmente entre las diferentes vistas.</li>
          </ul>
        </section>
        
        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">2. El Corazón de tu Negocio: Gestionar Inventario</h3>
          <div className="ml-4 mt-4 space-y-6">
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">A. Materias Primas</h4>
              <ul className="list-disc list-inside space-y-2">
                  <li><strong>Añadir un ingrediente:</strong> Haz clic en "Añadir Materia Prima" y completa los campos. Es fundamental registrar la <strong>compra inicial</strong> para que el sistema calcule el stock y el costo promedio.</li>
                  <li><strong>Acciones:</strong> Puedes registrar nuevas compras, mermas, editar o ver detalles de cada materia prima.</li>
                  <li><strong>Listas de Compra:</strong> Haz clic en "Ver Listas de Compra" para ver una lista autogenerada de insumos por debajo del stock mínimo y las listas guardadas desde tus propuestas. ¡Puedes exportarlas a <strong>PDF</strong>!</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">B. Recetas</h4>
               <ul className="list-disc list-inside space-y-2">
                  <li><strong>Crear una receta:</strong> Define el nombre, rendimiento (cuántas unidades produce), ingredientes y parámetros de costos (mano de obra, servicios, ganancia).</li>
                  <li><strong>Análisis en Tiempo Real:</strong> Mientras creas la receta, el sistema te mostrará el costo unitario y el PVP sugerido.</li>
                  <li><strong>Producir:</strong> Al confirmar la producción, el sistema descuenta automáticamente los ingredientes y añade el producto terminado a tu "Despensa".</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">C. Despensa</h4>
               <ul className="list-disc list-inside space-y-2">
                  <li>Es tu stock de productos listos para vender.</li>
                  <li><strong>Empaquetar:</strong> Crea combos o packs a partir de productos existentes.</li>
                  <li><strong>Transformar:</strong> Crea un nuevo producto a partir de otro (ej: pan rallado a partir de pan).</li>
                  <li><strong>Eliminar:</strong> Si eliminas un paquete, el sistema inteligentemente devuelve el stock al producto original.</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">D. Mermas</h4>
               <p className="mt-2">Un registro histórico de todas las mermas que has anotado. Si te equivocaste, puedes eliminar un registro y el stock se restaurará.</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">3. Gestión de Finanzas y Clientes</h3>
          <div className="ml-4 mt-4 space-y-6">
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">A. Costos Fijos</h4>
              <p className="mt-2">Registra tus gastos mensuales (alquiler, servicios, etc.). Estos se distribuyen en tus recetas para un cálculo de costo más preciso.</p>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">B. Ventas y Propuestas</h4>
              <ul className="list-disc list-inside space-y-2">
                  <li><strong>Registrar Venta:</strong> Selecciona el producto, cantidad y cliente. El modal te mostrará un análisis financiero en vivo de la venta, incluyendo ganancia y margen. Puedes aplicar descuentos.</li>
                  <li><strong>Crear Propuesta (para pedidos grandes):</strong> Simula una venta para ver si tienes stock de materias primas y cuál sería la rentabilidad. Desde aquí puedes:</li>
                  <li className="ml-6 mt-1"><strong>Exportar Propuesta (PDF):</strong> Genera un presupuesto profesional para tu cliente.</li>
                  <li className="ml-6"><strong>Guardar y Exportar Lista (PDF):</strong> Crea una lista de compra con los insumos que te faltan.</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section>
          <h3 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">4. El Pulso de tu Negocio: Dashboard</h3>
          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>Es tu panel de control con métricas clave: valor de inventario, costos fijos, ventas y ganancia.</li>
            <li>Descubre tus <strong>Top 5</strong> productos y clientes.</li>
            <li><strong>¡Alerta de Stock Bajo!</strong> La sección más importante, te avisa qué materias primas necesitas comprar.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default HelpView;
