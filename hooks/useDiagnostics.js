import { useEffect, useState } from "react";
import { testSupabaseConnection } from "../config/supabase";

export const useDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState({
    initialized: false,
    supabaseOk: null,
    errorDetails: null,
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log("\n🔧 === EJECUTANDO DIAGNÓSTICOS ===\n");

      try {
        await testSupabaseConnection();
        setDiagnostics({
          initialized: true,
          supabaseOk: true,
          errorDetails: null,
        });
      } catch (error) {
        setDiagnostics({
          initialized: true,
          supabaseOk: false,
          errorDetails: {
            message: error.message,
            code: error.code,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    runDiagnostics();
  }, []);

  return diagnostics;
};
