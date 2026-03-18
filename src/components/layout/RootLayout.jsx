import { Outlet } from "react-router-dom";
import { AuthContextProvider } from "../../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <div className="min-h-screen bg-white font-body text-gray-700 antialiased overflow-x-hidden">
        <main>
          <Outlet />
        </main>
      </div>
    </AuthContextProvider>
  );
}