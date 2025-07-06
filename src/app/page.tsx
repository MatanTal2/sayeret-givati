"use client";
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
  const [now, setNow] = useState<string>("");
  const [selectedPlatoon, setSelectedPlatoon] = useState<string>("");
  const [searchName, setSearchName] = useState<string>("");
  const [generatedText, setGeneratedText] = useState<string>("");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Function to update status
  const updateStatus = (rowName: string, newStatus: string) => {
    setData(prevData => 
      prevData.map((row) => 
        row.name === rowName ? { ...row, status: newStatus } : row
      )
    );
  };

  // Function to toggle row selection
  const toggleRowSelection = (rowName: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowName)) {
        newSet.delete(rowName);
      } else {
        newSet.add(rowName);
      }
      return newSet;
    });
  };

  // Function to select all rows
  const selectAll = () => {
    const allNames = new Set(filteredData.map(row => row.name));
    setSelectedRows(allNames);
  };

  // Function to deselect all rows
  const deselectAll = () => {
    setSelectedRows(new Set());
  };

  // Function to select by status
  const selectByStatus = (status: string) => {
    const statusNames = new Set(filteredData.filter(row => row.status === status).map(row => row.name));
    setSelectedRows(statusNames);
  };

  // Function to generate report text
  const generateReport = () => {
    const currentTime = new Date().toLocaleString("he-IL");
    const selectedData = filteredData.filter(row => selectedRows.has(row.name));
    
    let report = `דוח שבצ"ק מסייעת - סיירת גבעתי\n`;
    report += `תאריך ושעה: ${currentTime}\n\n`;
    
    // Group by platoon
    const platoonGroups = selectedData.reduce((acc, row) => {
      const platoon = row.platoon || "לא מוגדר";
      if (!acc[platoon]) acc[platoon] = [];
      acc[platoon].push(row);
      return acc;
    }, {} as Record<string, typeof selectedData>);
    
    // Generate report for each platoon
    Object.entries(platoonGroups).forEach(([platoon, soldiers]) => {
      report += `${platoon}:\n`;
      soldiers.forEach(soldier => {
        report += `  • ${soldier.name} - ${soldier.status}`;
        if (soldier.notes) report += ` (${soldier.notes})`;
        report += `\n`;
      });
      report += `\n`;
    });
    
    report += `סה"כ נבדקו: ${selectedData.length} חיילים\n`;
    
    setGeneratedText(report);
    setShowPreview(true);
    
    // Scroll to preview after a short delay to ensure it's rendered
    setTimeout(() => {
      const previewElement = document.getElementById('report-preview');
      if (previewElement) {
        previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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

  useEffect(() => {
    setNow(new Date().toLocaleString("he-IL"));
  }, []);

  // Extract unique platoons for filter
  const platoons = Array.from(new Set(data.map((r) => r.platoon).filter(Boolean)));

  // Filter data based on selected platoon and search name
  const filteredData = data.filter(row => {
    const matchesPlatoon = !selectedPlatoon || row.platoon === selectedPlatoon;
    const matchesName = !searchName || row.name.toLowerCase().includes(searchName.toLowerCase());
    return matchesPlatoon && matchesName;
  });

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans text-gray-800">
      <header className="flex flex-col items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-purple-800">שבצ&quot;ק מסייעת - סיירת גבעתי</h1>
        <div className="text-sm text-gray-700">{now}</div>
      </header>
      <section className="mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <select 
          className="border rounded p-2" 
          value={selectedPlatoon}
          onChange={(e) => setSelectedPlatoon(e.target.value)}
        >
          <option value="">כל המחלקות</option>
          {platoons.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="חפש שם..."
          className="border rounded p-2 w-48"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded">הוסף שורה</button>
      </section>
      
      {/* Bulk selection controls */}
      <section className="mb-4 bg-white rounded shadow p-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={selectAll}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              בחר הכל
            </button>
            <button 
              onClick={deselectAll}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              בטל בחירה
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">בחר לפי סטטוס:</span>
            <button 
              onClick={() => selectByStatus("בית")}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
            >
              בית
            </button>
            <button 
              onClick={() => selectByStatus("משמר")}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
            >
              משמר
            </button>
          </div>
          <div className="text-sm text-gray-600">
            נבחרו: {selectedRows.size} מתוך {filteredData.length}
          </div>
        </div>
      </section>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-700 py-8">טוען נתונים...</div>
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
              {filteredData.map((row, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedRows.has(row.name)}
                      onChange={() => toggleRowSelection(row.name)}
                    />
                  </td>
                  <td className="p-2">{row.name}</td>
                  <td className="p-2">{row.platoon}</td>
                  <td className="p-2">
                    <div className="flex gap-1 flex-wrap">
                      <button 
                        onClick={() => updateStatus(row.name, "בית")}
                        className={`px-3 py-1 rounded cursor-pointer transition-colors font-medium ${row.status === "בית" ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                      >
                        בית
                      </button>
                      <button 
                        onClick={() => updateStatus(row.name, "משמר")}
                        className={`px-3 py-1 rounded cursor-pointer transition-colors font-medium ${row.status === "משמר" ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                      >
                        משמר
                      </button>
                      <input
                        type="text"
                        placeholder="אחר..."
                        className="border-2 border-gray-400 rounded px-2 py-1 w-20 focus:border-purple-500 focus:outline-none"
                        defaultValue={row.status !== "בית" && row.status !== "משמר" ? row.status : ""}
                        onChange={(e) => updateStatus(row.name, e.target.value)}
                      />
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="border-2 border-gray-400 rounded px-2 py-1 w-32 focus:border-purple-500 focus:outline-none"
                      defaultValue={row.notes}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Sticky bottom bar for buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg p-3 z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button 
            onClick={generateReport}
            className="bg-purple-700 text-white px-5 py-2 rounded hover:bg-purple-800 transition-colors font-medium"
          >
            הפק טקסט
          </button>
          <button 
            onClick={() => {
              if (generatedText) {
                navigator.clipboard.writeText(generatedText);
                alert("הטקסט הועתק ללוח!");
              }
            }}
            className="bg-gray-300 text-gray-900 px-5 py-2 rounded hover:bg-gray-400 transition-colors font-medium"
            disabled={!generatedText}
          >
            העתק ללוח
          </button>
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
      </div>
      
      {/* Add bottom padding to prevent content from being hidden behind sticky bar */}
      <div className="h-24"></div>
      
      {showPreview && (
        <section id="report-preview" className="mt-6 bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-purple-800">תצוגה מקדימה של הדוח</h2>
            <button 
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          <textarea
            value={generatedText}
            readOnly
            className="w-full h-64 p-3 border-2 border-gray-300 rounded font-mono text-sm resize-none"
            dir="rtl"
          />
        </section>
      )}
    </div>
  );
}
