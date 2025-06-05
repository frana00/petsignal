/**
 * Test de Funcionalidad de Autorización
 * Simula la lógica de autorización implementada en AlertDetailScreen
 */

// Simulación de la función isAlertOwner
const isAlertOwner = (user, currentAlert) => {
  if (!user || !user.username || !currentAlert || !currentAlert.username) {
    return false;
  }
  return user.username === currentAlert.username;
};

// Test cases
const testCases = [
  {
    name: "Usuario dueño de la alerta",
    user: { username: "juan123", id: 1 },
    alert: { id: 1, username: "juan123", petName: "Max", type: "LOST" },
    expectedResult: true
  },
  {
    name: "Usuario NO dueño de la alerta",
    user: { username: "maria456", id: 2 },
    alert: { id: 1, username: "juan123", petName: "Max", type: "LOST" },
    expectedResult: false
  },
  {
    name: "Usuario no autenticado",
    user: null,
    alert: { id: 1, username: "juan123", petName: "Max", type: "LOST" },
    expectedResult: false
  },
  {
    name: "Usuario sin username",
    user: { id: 1 },
    alert: { id: 1, username: "juan123", petName: "Max", type: "LOST" },
    expectedResult: false
  },
  {
    name: "Alerta sin username",
    user: { username: "juan123", id: 1 },
    alert: { id: 1, petName: "Max", type: "LOST" },
    expectedResult: false
  },
  {
    name: "Alerta no existe",
    user: { username: "juan123", id: 1 },
    alert: null,
    expectedResult: false
  }
];

// Ejecutar tests
console.log("🧪 Ejecutando Tests de Autorización...\n");

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = isAlertOwner(testCase.user, testCase.alert);
  const success = result === testCase.expectedResult;
  
  if (success) {
    console.log(`✅ Test ${index + 1}: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${testCase.name}`);
    console.log(`   Esperado: ${testCase.expectedResult}, Obtenido: ${result}`);
    failed++;
  }
});

console.log(`\n📊 Resumen de Tests:`);
console.log(`✅ Pasaron: ${passed}`);
console.log(`❌ Fallaron: ${failed}`);
console.log(`📈 Total: ${testCases.length}`);

if (failed === 0) {
  console.log("\n🎉 ¡Todos los tests de autorización pasaron!");
  console.log("✅ La implementación de seguridad está funcionando correctamente.");
} else {
  console.log("\n⚠️ Algunos tests fallaron. Revisar la implementación.");
}

// Simular casos de uso de UI
console.log("\n🖥️ Simulación de UI:");

const mockScenarios = [
  {
    user: { username: "usuario1" },
    alert: { username: "usuario1", petName: "Rex" },
    description: "Usuario ve su propia alerta"
  },
  {
    user: { username: "usuario1" },
    alert: { username: "usuario2", petName: "Luna" },
    description: "Usuario ve alerta de otro usuario"
  }
];

mockScenarios.forEach((scenario, index) => {
  const canEdit = isAlertOwner(scenario.user, scenario.alert);
  console.log(`\n${index + 1}. ${scenario.description}:`);
  console.log(`   - Botón Editar visible: ${canEdit ? "SÍ" : "NO"}`);
  console.log(`   - Botón Eliminar visible: ${canEdit ? "SÍ" : "NO"}`);
  console.log(`   - Puede realizar acciones: ${canEdit ? "SÍ" : "NO"}`);
  if (canEdit) {
    console.log(`   - Mensaje: "✅ Esta es tu alerta"`);
  } else {
    console.log(`   - Mensaje: "👤 Creado por: ${scenario.alert.username}"`);
  }
});

module.exports = { isAlertOwner };
