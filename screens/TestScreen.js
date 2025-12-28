import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Button } from "react-native";
import { pingSupabase, testTable } from "../config/supabase";

export default function TestScreen() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const newResults = [];

    // Test 1: Ping general
    console.log("\n🧪 Test 1: Ping Supabase");
    const ping = await pingSupabase();
    newResults.push({
      name: "📡 Ping Supabase",
      ok: ping.ok,
      detail: `Status: ${ping.status}`,
    });

    // Test 2: Tabla spots
    console.log("\n🧪 Test 2: Tabla spots");
    const spotTest = await testTable("spots");
    newResults.push({
      name: "📍 Tabla spots",
      ok: spotTest.ok,
      detail: `${spotTest.count || 0} registros`,
    });

    // Test 3: Tabla parches
    console.log("\n🧪 Test 3: Tabla parches");
    const parchesTest = await testTable("parches");
    newResults.push({
      name: "👥 Tabla parches",
      ok: parchesTest.ok,
      detail: `${parchesTest.count || 0} registros`,
    });

    // Test 4: Tabla usuarios
    console.log("\n🧪 Test 4: Tabla usuarios");
    const usuariosTest = await testTable("usuarios");
    newResults.push({
      name: "👤 Tabla usuarios",
      ok: usuariosTest.ok,
      detail: `${usuariosTest.count || 0} registros`,
    });

    setResults(newResults);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Diagnóstico Supabase</Text>

      {results.map((result, idx) => (
        <View
          key={idx}
          style={[styles.testBox, result.ok ? styles.success : styles.error]}
        >
          <Text style={styles.testName}>{result.name}</Text>
          <Text style={styles.status}>{result.ok ? "✅ OK" : "❌ ERROR"}</Text>
          <Text style={styles.detail}>{result.detail}</Text>
        </View>
      ))}

      <Button
        title={loading ? "Testeando..." : "Ejecutar de nuevo"}
        onPress={runTests}
        disabled={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  testBox: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  success: {
    backgroundColor: "#e8f5e9",
    borderLeftColor: "#4caf50",
  },
  error: {
    backgroundColor: "#ffebee",
    borderLeftColor: "#f44336",
  },
  testName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  detail: {
    fontSize: 12,
    color: "#666",
  },
});
