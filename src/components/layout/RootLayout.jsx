import { Outlet } from "react-router-dom";
import Navbar from "./Navbar"; 
import { AuthContextProvider } from "../../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthContextProvider>
      <div className="min-h-screen bg-gray-100 font-body text-gray-700 antialiased">
        <Navbar />
        <main className="container mx-auto p-4">
         
          <Outlet />
        </main>
      </div>
    </AuthContextProvider>
  );
}