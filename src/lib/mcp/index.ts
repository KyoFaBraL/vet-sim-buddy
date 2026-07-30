import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listClinicalCases from "./tools/list-clinical-cases";
import getClinicalCase from "./tools/get-clinical-case";
import listMySessions from "./tools/list-my-sessions";
import getSessionReport from "./tools/get-session-report";
import getMyProgress from "./tools/get-my-progress";
import listTreatments from "./tools/list-treatments";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "vetbalance",
  title: "vetbalance",
  version: "0.1.0",
  instructions:
    "Ferramentas do VetBalance, simulador gamificado de distúrbios ácido-básicos em Medicina Veterinária. Use `list_clinical_cases` e `get_clinical_case` para explorar casos clínicos, `list_treatments` para os tratamentos disponíveis, e `list_my_sessions`, `get_session_report` e `get_my_progress` para o histórico e desempenho do usuário conectado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listClinicalCases,
    getClinicalCase,
    listTreatments,
    listMySessions,
    getSessionReport,
    getMyProgress,
  ],
});
