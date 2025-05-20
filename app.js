// === Verificar autenticación al iniciar ===
auth.onAuthStateChanged(user => {
  const info = document.getElementById("user-info");
  info.textContent = user ? "Usuario: " + user.email : "No autenticado";
});

// === Función auxiliar para mostrar notificaciones ===
function mostrarMensaje(texto, tipo = "info") {
  const colores = {
    info: "#007BFF",
    success: "#28a745",
    error: "#dc3545"
  };
  const msg = document.createElement("div");
  msg.textContent = texto;
  msg.style.background = colores[tipo] || "#000";
  msg.style.color = "#fff";
  msg.style.padding = "10px";
  msg.style.marginTop = "10px";
  msg.style.borderRadius = "8px";
  msg.style.fontWeight = "bold";
  msg.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 4000);
}

// === Función de protección contra spam ===
function throttleAction(callback, delay = 5000) {
  let lastRun = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastRun >= delay) {
      lastRun = now;
      callback.apply(this, args);
    } else {
      mostrarMensaje("⚠️ Espera unos segundos antes de volver a intentarlo.", "info");
    }
  };
}

// === Registro de usuario ===
function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return mostrarMensaje("Completa email y contraseña.", "error");

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => mostrarMensaje("✅ Registro exitoso", "success"))
    .catch(err => mostrarMensaje("Error: " + err.message, "error"));
}

// === Login de usuario ===
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) return mostrarMensaje("Completa email y contraseña.", "error");

  auth.signInWithEmailAndPassword(email, password)
    .then(user => {
      document.getElementById("user-info").textContent = "Usuario: " + user.user.email;
      mostrarMensaje("✅ Sesión iniciada", "success");
    })
    .catch(err => mostrarMensaje("Error: " + err.message, "error"));
}

// === Cerrar sesión ===
function logout() {
  auth.signOut().then(() => {
    document.getElementById("user-info").textContent = "Sesión cerrada";
    mostrarMensaje("🔒 Has cerrado sesión", "info");
  });
}

// === Registrar Cliente ===
function registrarCliente() {
  const nombre = document.getElementById("cliente-nombre").value.trim();
  const contacto = document.getElementById("cliente-contacto").value.trim();
  const direccion = document.getElementById("cliente-direccion").value.trim();
  const observaciones = document.getElementById("cliente-obs").value.trim();

  if (!nombre || !contacto)
    return mostrarMensaje("Faltan campos obligatorios (nombre, contacto)", "error");

  db.collection("clientes").add({
    nombre,
    contacto,
    direccion,
    observaciones,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    mostrarMensaje("✅ Cliente registrado", "success");
    document.getElementById("cliente-nombre").value = "";
    document.getElementById("cliente-contacto").value = "";
    document.getElementById("cliente-direccion").value = "";
    document.getElementById("cliente-obs").value = "";
  }).catch(err => mostrarMensaje("Error al guardar cliente: " + err.message, "error"));
}

// === Registrar Venta ===
function registrarVenta() {
  const clienteId = document.getElementById("venta-cliente").value.trim();
  const productos = document.getElementById("venta-productos").value.trim();
  const monto = parseFloat(document.getElementById("venta-monto").value);
  const fecha = document.getElementById("venta-fecha").value;
  const medioPago = document.getElementById("venta-medio").value.trim();

  if (!clienteId || !productos || isNaN(monto) || !fecha || !medioPago)
    return mostrarMensaje("Completa todos los campos de venta.", "error");

  db.collection("ventas").add({
    clienteId,
    productos,
    monto,
    fecha,
    medioPago,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    mostrarMensaje("✅ Venta registrada", "success");
    document.getElementById("venta-cliente").value = "";
    document.getElementById("venta-productos").value = "";
    document.getElementById("venta-monto").value = "";
    document.getElementById("venta-fecha").value = "";
    document.getElementById("venta-medio").value = "";
  }).catch(err => {
    console.error("Error al registrar venta:", err);
    mostrarMensaje("Error al guardar venta: " + err.message, "error");
  });
}

// === Generar Reporte ===
function generarReporte() {
  db.collection("ventas").orderBy("timestamp", "desc").get().then(snapshot => {
    let total = 0;
    let texto = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      total += data.monto;
      texto += `Cliente: ${data.clienteId} | Monto: $${data.monto} | Fecha: ${data.fecha}\n`;
    });
    texto += `\n🧾 TOTAL VENDIDO: $${total.toFixed(2)}`;
    document.getElementById("reporte-output").textContent = texto;
  }).catch(err => {
    mostrarMensaje("Error al generar reporte: " + err.message, "error");
  });
}

// === Versión segura de funciones (antispam) ===
const registroSeguro = throttleAction(register, 5000);
const loginSeguro = throttleAction(login, 5000);
const registrarClienteSeguro = throttleAction(registrarCliente, 4000);
const registrarVentaSeguro = throttleAction(registrarVenta, 4000);
const generarReporteSeguro = throttleAction(generarReporte, 4000);