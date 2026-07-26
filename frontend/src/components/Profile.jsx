export default function Profile() {
  return (
    <div className="space-y-4">
      <section className="glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5b3bbb] text-2xl text-white">
            👤
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#8b6fd6]">
              Caretaker summary
            </p>
            <h1 className="text-xl font-semibold text-[#34214f]">Mina Patel</h1>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#f5edff] p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b6fd6]">Medication count</p>
            <p className="mt-2 text-lg font-semibold text-[#34214f]">6 active</p>
          </div>
          <div className="rounded-2xl bg-[#f5edff] p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b6fd6]">Last scan</p>
            <p className="mt-2 text-lg font-semibold text-[#34214f]">2h ago</p>
          </div>
        </div>
      </section>

      <section className="glass-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#34214f]">Weekly calendar</h2>
          <span className="text-sm font-semibold text-[#7f6b9d]">Mon–Sun</span>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {['M','T','W','T','F','S','S'].map((day, index) => (
            <div key={day + index} className="min-w-[44px] rounded-2xl bg-[#f4ebff] px-3 py-2 text-center text-sm font-semibold text-[#5b3bbb]">
              <div>{day}</div>
              <div className="mt-1 text-[11px] opacity-70">{index + 1}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex gap-3">
        <button className="flex-1 rounded-2xl bg-[#5b3bbb] px-3 py-3 text-sm font-semibold text-white">
          Sync to insurance
        </button>
        <button className="flex-1 rounded-2xl border border-[#dfd0ff] bg-white/70 px-3 py-3 text-sm font-semibold text-[#34214f]">
          Export report
        </button>
      </section>
    </div>
  );
}
