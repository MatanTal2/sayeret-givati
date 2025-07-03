import React, { useEffect, useState } from "react";

interface Row {
  name: string;
  platoon: string;
  status: string;
  notes: string;
}

export default function Home() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API on mount
  useEffect(() => {
    fetch("/api/sheets")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((json) => {
        // Expecting { data: string[][] }
        const rows = json.data;
        if (!Array.isArray(rows) || rows.length < 1) throw new Error("No data");
        // Assume first row is header
        const [header, ...body] = rows;
        // Map columns to Row
        const colIdx = {
          name: header.findIndex((h: string) => h.includes("שם")),
          platoon: header.findIndex((h: string) => h.includes("מחלקה") || h.includes("צוות")),
          status: header.findIndex((h: string) => h.includes("סטטוס")),
          notes: header.findIndex((h: string) => h.includes("הערות")),
        };
        const mapped: Row[] = body.map((r: string[]) => ({
          name: r[colIdx.name] || "",
          platoon: r[colIdx.platoon] || "",
          status: r[colIdx.status] || "בית", // default
          notes: r[colIdx.notes] || "",
        }));
        setData(mapped);
        setLoading(false);
      })
      .catch(() => {
        setError("לא ניתן לטעון את הנתונים כרגע. ניתן להוסיף רשומות ידנית.");
        setLoading(false);
      });
  }, []);

  // Extract unique platoons for filter
  const platoons = Array.from(new Set(data.map((r) => r.platoon).filter(Boolean)));

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <header className="flex flex-col items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-purple-800">שבצ&quot;ק מסייעת - סיירת גבעתי</h1>
        <div className="text-sm text-gray-600">{new Date().toLocaleString("he-IL")}</div>
      </header>
      <section className="mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <select className="border rounded p-2" defaultValue="">
          <option value="">כל המחלקות</option>
          {platoons.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="חפש שם..."
          className="border rounded p-2 w-48"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded">הוסף שורה</button>
      </section>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-8">טוען נתונים...</div>
        ) : (
          <table className="w-full bg-white rounded shadow text-right">
            <thead className="bg-purple-100">
              <tr>
                <th className="p-2">בחר</th>
                <th className="p-2">שם</th>
                <th className="p-2">מחלקה/צוות</th>
                <th className="p-2">סטטוס</th>
                <th className="p-2">הערות</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 text-center">
                    <input type="checkbox" />
                  </td>
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">{row.platoon}</td>
                  <td className="p-2">
                    <div className="flex gap-1 flex-wrap">
                      <button className={`px-2 py-1 rounded ${row.status === "בית" ? "bg-blue-200" : "bg-gray-100"}`}>בית</button>
                      <button className={`px-2 py-1 rounded ${row.status === "משמר" ? "bg-blue-200" : "bg-gray-100"}`}>משמר</button>
                      <input
                        type="text"
                        placeholder="אחר..."
                        className="border rounded px-2 py-1 w-20"
                        defaultValue={row.status !== "בית" && row.status !== "משמר" ? row.status : ""}
                      />
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-32"
                      defaultValue={row.notes}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <section className="flex flex-col sm:flex-row gap-4 mt-6 items-center justify-between">
        <button className="bg-purple-700 text-white px-4 py-2 rounded">הפק טקסט</button>
        <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded">העתק ללוח</button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </section>
    </div>
  );
}
