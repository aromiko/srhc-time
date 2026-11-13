"use client";

import { useState } from "react";

export function EmployeePicker({ employees }: { employees: { id: string; full_name: string }[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = employees.length > 0 && selected.size === employees.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="block text-sm font-medium text-slate-700">
          Employees
          <span className="ml-1.5 font-normal text-slate-400">
            ({selected.size} selected)
          </span>
        </p>
        <button
          type="button"
          onClick={() =>
            setSelected(allSelected ? new Set() : new Set(employees.map((e) => e.id)))
          }
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="mt-1 max-h-72 space-y-1 overflow-y-auto rounded-md border border-slate-300 p-2">
        {employees.map((e) => (
          <label
            key={e.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              name="employee_ids"
              value={e.id}
              checked={selected.has(e.id)}
              onChange={() => toggle(e.id)}
              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
            />
            {e.full_name}
          </label>
        ))}
      </div>
    </div>
  );
}
