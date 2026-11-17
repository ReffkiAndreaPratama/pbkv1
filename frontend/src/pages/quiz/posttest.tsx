import { Navigate } from "react-router-dom";

/**
 * Posttest lama kini menjadi Ujian Akhir formal di /exam.
 * Route ini dipertahankan agar tautan lama tetap bekerja.
 */
export function PosttestPage() {
  return <Navigate to="/exam" replace />;
}
