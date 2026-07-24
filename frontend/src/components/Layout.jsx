import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Functional, raw Navbar */}
      <header className="p-4 bg-gray-900 border-b border-gray-700">
        <h1 className="text-xl font-bold">RxGuard</h1>
      </header>
      
      {/* The Outlet is where the other pages will load */}
      <main className="flex-grow p-4">
        <Outlet />
      </main>
    </div>
  );
}