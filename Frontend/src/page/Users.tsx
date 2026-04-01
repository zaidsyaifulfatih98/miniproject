
import { useState } from "react";

type Gender = "Laki-laki" | "Perempuan";

interface Transaction {
  id: string;
  event: string;
  ticketType: string;
  date: string;
  amount: number;
  status: "Berhasil" | "Menunggu" | "Gagal";
}

interface Customer {
  id: number;
  name: string;
  email: string;
  birthDate: string;
  gender: Gender;
  referralCode: string;
  referralPoints: number;
  joinDate: string;
  transactions: Transaction[];
}

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Andi Prasetyo",
    email: "andi.prasetyo@email.com",
    birthDate: "1995-03-14",
    gender: "Laki-laki",
    referralCode: "ANDI2025",
    referralPoints: 350,
    joinDate: "2025-11-20",
    transactions: [
      { id: "TRX-001", event: "Konser Malam Minggu", ticketType: "VIP", date: "2026-03-10", amount: 500000, status: "Berhasil" },
      { id: "TRX-002", event: "Festival Kuliner Nusantara", ticketType: "Reguler", date: "2026-03-25", amount: 100000, status: "Berhasil" },
    ],
  },
  {
    id: 2,
    name: "Sari Dewi",
    email: "sari.dewi@email.com",
    birthDate: "1998-07-22",
    gender: "Perempuan",
    referralCode: "SARI2025",
    referralPoints: 120,
    joinDate: "2025-12-05",
    transactions: [
      { id: "TRX-003", event: "Workshop UI/UX Design", ticketType: "Early Bird", date: "2026-04-01", amount: 80000, status: "Berhasil" },
      { id: "TRX-004", event: "Konser Malam Minggu", ticketType: "Reguler", date: "2026-03-28", amount: 250000, status: "Menunggu" },
    ],
  },
  {
    id: 3,
    name: "Budi Santoso",
    email: "budi.santoso@email.com",
    birthDate: "1990-01-08",
    gender: "Laki-laki",
    referralCode: "BUDI2025",
    referralPoints: 500,
    joinDate: "2025-10-15",
    transactions: [
      { id: "TRX-005", event: "Seminar Kewirausahaan", ticketType: "VVIP", date: "2026-02-20", amount: 750000, status: "Berhasil" },
    ],
  },
  {
    id: 4,
    name: "Rina Kusuma",
    email: "rina.kusuma@email.com",
    birthDate: "2000-09-30",
    gender: "Perempuan",
    referralCode: "RINA2025",
    referralPoints: 75,
    joinDate: "2026-01-10",
    transactions: [
      { id: "TRX-006", event: "Lari Maraton Kota", ticketType: "Reguler", date: "2026-03-15", amount: 150000, status: "Gagal" },
      { id: "TRX-007", event: "Workshop UI/UX Design", ticketType: "VIP", date: "2026-04-02", amount: 200000, status: "Menunggu" },
    ],
  },
  {
    id: 5,
    name: "Dimas Rahmat",
    email: "dimas.rahmat@email.com",
    birthDate: "1993-05-17",
    gender: "Laki-laki",
    referralCode: "DIMAS2025",
    referralPoints: 230,
    joinDate: "2025-11-01",
    transactions: [
      { id: "TRX-008", event: "Konser Malam Minggu", ticketType: "Early Bird", date: "2026-02-10", amount: 150000, status: "Berhasil" },
    ],
  },
];

const statusColor: Record<Transaction["status"], string> = {
  Berhasil: "bg-green-100 text-green-700",
  Menunggu: "bg-yellow-100 text-yellow-700",
  Gagal: "bg-red-100 text-red-600",
};

function age(birthDate: string) {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-orange-400", "bg-blue-400", "bg-purple-400", "bg-teal-400", "bg-pink-400",
];

export default function Users() {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<Gender | "Semua">("Semua");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.referralCode.toLowerCase().includes(search.toLowerCase());
    const matchGender = genderFilter === "Semua" || c.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const totalPoints = customers.reduce((s, c) => s + c.referralPoints, 0);
  const totalTrx    = customers.reduce((s, c) => s + c.transactions.length, 0);
  const totalRev    = customers.flatMap((c) => c.transactions)
    .filter((t) => t.status === "Berhasil")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Manajemen Pengguna</h1>
          <p className="text-sm text-gray-500 mt-0.5">Data pelanggan dan riwayat transaksi mereka</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-500">{customers.length}</p>
          <p className="text-xs text-gray-400">Total Pelanggan</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Transaksi", value: totalTrx, sub: "dari semua pelanggan", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Pendapatan", value: `Rp ${(totalRev / 1_000_000).toFixed(1)}jt`, sub: "transaksi berhasil", color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Poin Referral", value: totalPoints.toLocaleString("id-ID"), sub: "poin aktif pelanggan", color: "text-purple-600", bg: "bg-purple-50" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-none`}>
              <div className={`w-3.5 h-3.5 rounded-full ${c.color.replace("text-", "bg-")}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs font-medium text-gray-600">{c.label}</p>
              <p className="text-xs text-gray-400">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau kode referral..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value as Gender | "Semua")}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Semua">Semua Jenis Kelamin</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} pelanggan ditemukan</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pelanggan</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tgl Lahir / Usia</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis Kelamin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kode Referral</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Poin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Transaksi</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Riwayat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                  Tidak ada pelanggan ditemukan.
                </td>
              </tr>
            ) : filtered.map((c, idx) => (
              <>
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  {/* ID */}
                  <td className="px-5 py-4 text-xs font-mono text-gray-400">#{String(c.id).padStart(4, "0")}</td>

                  {/* Name + Email */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-none`}>
                        {initials(c.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Birth date */}
                  <td className="px-5 py-4 text-gray-600">
                    <p>{formatDate(c.birthDate)}</p>
                    <p className="text-xs text-gray-400">{age(c.birthDate)} tahun</p>
                  </td>

                  {/* Gender */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      c.gender === "Laki-laki" ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"
                    }`}>
                      {c.gender === "Laki-laki" ? "♂" : "♀"} {c.gender}
                    </span>
                  </td>

                  {/* Referral code */}
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded tracking-widest">
                      {c.referralCode}
                    </span>
                  </td>

                  {/* Points */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold text-gray-700">{c.referralPoints.toLocaleString("id-ID")}</span>
                    </div>
                  </td>

                  {/* Transaction count */}
                  <td className="px-5 py-4">
                    <span className="text-gray-600 font-medium">{c.transactions.length}</span>
                    <span className="text-gray-400 text-xs ml-1">transaksi</span>
                  </td>

                  {/* Expand button */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        expandedId === c.id
                          ? "bg-orange-100 text-orange-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Riwayat
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${expandedId === c.id ? "rotate-180" : ""}`}
                        fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </td>
                </tr>

                {/* Expanded Transaction Row */}
                {expandedId === c.id && (
                  <tr key={`trx-${c.id}`} className="bg-gray-50">
                    <td colSpan={8} className="px-5 py-4">
                      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Riwayat Transaksi — {c.name}
                          </p>
                          <span className="text-xs text-gray-400">{c.transactions.length} transaksi</span>
                        </div>
                        {c.transactions.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 py-6">Belum ada transaksi.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">ID Transaksi</th>
                                <th className="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                                <th className="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Tipe Tiket</th>
                                <th className="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                                <th className="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Jumlah</th>
                                <th className="text-left px-4 py-2 font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {c.transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-2.5 font-mono text-gray-500">{t.id}</td>
                                  <td className="px-4 py-2.5 text-gray-700 font-medium">{t.event}</td>
                                  <td className="px-4 py-2.5 text-gray-600">{t.ticketType}</td>
                                  <td className="px-4 py-2.5 text-gray-500">{formatDate(t.date)}</td>
                                  <td className="px-4 py-2.5 font-semibold text-gray-700">Rp {t.amount.toLocaleString("id-ID")}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusColor[t.status]}`}>
                                      {t.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
