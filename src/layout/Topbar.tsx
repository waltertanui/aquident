function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3">
      <div className="flex items-center gap-3">
        <input
          placeholder="Search patients, appointments…"
          className="w-96 rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-2 hover:bg-gray-100" aria-label="Notifications">
          🔔
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gray-300" />
      </div>
    </header>
  );
}

export default Topbar;