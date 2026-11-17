import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      // O app carrega dados no cliente via useEffect (padrão usado em todas as telas).
      // A regra nova do React 19 sinaliza isso como erro; mantemos como aviso.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"],
  },
];

export default eslintConfig;
