import React, { useState } from "react";

/* =======================
   Types
======================= */
type Mode = "single" | "pair";

type LabProcedureItem = {
  id: string;
  name: string;
  price: number;
  supportsUnits?: boolean;
  supportsPair?: boolean;
};

type LabProcedureCategory = {
  id: string;
  name: string;
  items: LabProcedureItem[];
};

type SelectedItem = {
  id: string;
  units: number;
  mode: Mode;
};

/* =======================
   Data (ALL ORIGINAL ITEMS INCLUDED)
======================= */
const PROCEDURE_CATEGORIES: LabProcedureCategory[] = [
  {
    id: "crown-bridge",
    name: "Crown & Bridge",
    items: [
      { id: "temp-acrylic", name: "Temporary Acrylic Crown / Bridge", price: 1000, supportsUnits: true },
      { id: "full-metal", name: "Full Metal", price: 2500, supportsUnits: true },
      { id: "emax", name: "Porcelain Crown (EMAX)", price: 8500, supportsUnits: true },
      { id: "pfm", name: "Porcelain Fused to Metal (PFM)", price: 3000, supportsUnits: true },
      { id: "zirconia", name: "Zirconia", price: 7500, supportsUnits: true },
      { id: "substructure-zirconia", name: "Substructure (Zirconia)", price: 7500, supportsUnits: true },
      { id: "pfm-repair", name: "PFM Repair", price: 1000, supportsUnits: true },
    ],
  },
  {
    id: "flexible-dentures",
    name: "Flexible Dentures",
    items: [
      { id: "1-3-teeth", name: "1–3 Teeth", price: 3350 },
      { id: "4-8-teeth", name: "4–8 Teeth", price: 4500 },
      { id: "9-13-teeth", name: "9–13 Teeth", price: 5600 },
      { id: "complete-denture", name: "Complete Denture (Full-Full)", price: 11250, supportsPair: true },
    ],
  },
  {
    id: "orthodontics",
    name: "Orthodontics",
    items: [
      { id: "ess-retainer", name: "ESS Retainer / Simple Appliance (Upper or Lower)", price: 3000 },
      { id: "hawley-retainer", name: "Hawley Retainer (Pair)", price: 4000, supportsPair: true },
      { id: "retraction-appliance", name: "Retraction Appliance", price: 3500 },
      { id: "habit-breaker", name: "Habit Breaker (Removable)", price: 3500 },
      { id: "expansion-normal", name: "Expansion Appliance (Normal)", price: 4000 },
      { id: "expansion-hyrax", name: "Expansion Appliance (Hyrax)", price: 10500 },
      { id: "quad-helix", name: "Quad Helix", price: 3500 },
      { id: "palatal-arch", name: "Palatal Arch", price: 3500 },
      { id: "lingual-arch", name: "Lingual Arch", price: 3000 },
      { id: "cobalt-chrome", name: "Cobalt Chrome Plate (per jaw)", price: 4000 },
      { id: "bleaching-trays", name: "Bleaching Trays (per jaw)", price: 12000, supportsPair: true },
      { id: "mouth-guards", name: "Mouth Guards (1 pair)", price: 5000, supportsPair: true },
      { id: "surgical-plate", name: "Surgical Plate", price: 1500 },
      { id: "appliance-repair", name: "Appliance Repair", price: 2500 },
      { id: "bite-plane", name: "Bite Plane", price: 1500 },
      { id: "study-model", name: "Study Model", price: 450 },
      { id: "space-maintainer", name: "Space Maintainer", price: 3500 },
      { id: "band-loop", name: "Band and Loop", price: 3500 },
      { id: "crown-loop", name: "Crown and Loop", price: 3500 },
      { id: "molar-band-tubes", name: "Molar Band with Tubes", price: 1500 },
    ],
  },
  {
    id: "prosthetics",
    name: "Prosthetics",
    items: [
      { id: "partial-denture-1st", name: "Partial Denture (1st tooth)", price: 1000 },
      { id: "partial-denture-additional", name: "Partial Denture (Any additional tooth)", price: 200 },
      { id: "complete-denture-full", name: "Complete Denture (Full-Full Upper & Lower)", price: 8000, supportsPair: true },
      { id: "complete-denture-upper-lower", name: "Complete Denture (Upper or Lower)", price: 4500 },
      { id: "repairs-partial", name: "Repairs (Partial Denture)", price: 750 },
      { id: "repairs-complete", name: "Repairs (Complete Denture)", price: 1500 },
      { id: "tooth-addition-partial", name: "Tooth Addition (Partial Denture)", price: 600 },
      { id: "tooth-addition-complete", name: "Tooth Addition (Complete Denture)", price: 1100 },
      { id: "rebasing", name: "Rebasing (Complete Denture)", price: 1850 },
      { id: "relining", name: "Relining", price: 1500 },
      { id: "special-trays", name: "Special Trays (Per jaw)", price: 600 },
      { id: "bite-registration", name: "Bite Registration Blocks (Per jaw)", price: 600 },
      { id: "trial-dentures", name: "Trial Dentures (Per jaw)", price: 900 },
      { id: "denture-duplication", name: "Denture Duplication", price: 600 },
      { id: "obturators", name: "Obturators", price: 3750 },
      { id: "cleaning-polishing", name: "Denture Cleaning / Polishing", price: 1100 },
    ],
  },
];

/* =======================
   Component
======================= */
interface LabProceduresProps {
  onSelect?: (name: string) => void;
  onTotalChange?: (total: number) => void;
  hidePrices?: boolean;
}

const LabProcedures: React.FC<LabProceduresProps> = ({ onSelect, onTotalChange, hidePrices = false }) => {
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});

  const toggleItem = (item: LabProcedureItem) => {
    // If selecting (not unselecting), notify parent
    if (!selected[item.id] && onSelect) {
      onSelect(item.name);
    }

    setSelected(prev => {
      if (prev[item.id]) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: { id: item.id, units: 1, mode: "single" },
      };
    });
  };

  const updateUnits = (id: string, units: number) => {
    setSelected(prev => ({
      ...prev,
      [id]: { ...prev[id], units: Math.max(1, units) },
    }));
  };

  const updateMode = (id: string, mode: Mode) => {
    setSelected(prev => ({
      ...prev,
      [id]: { ...prev[id], mode },
    }));
  };

  const calculateTotal = (currentSelected: Record<string, SelectedItem>) => {
    let total = 0;
    PROCEDURE_CATEGORIES.forEach(category => {
      category.items.forEach(item => {
        const sel = currentSelected[item.id];
        if (!sel) return;

        const multiplier = sel.mode === "pair" ? 2 : 1;
        total += item.price * multiplier * sel.units;
      });
    });
    return total;
  };

  const totalPrice = () => calculateTotal(selected);

  // Notify parent of total change
  React.useEffect(() => {
    if (onTotalChange) {
      onTotalChange(calculateTotal(selected));
    }
  }, [selected, onTotalChange]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-semibold">Lab Procedures</h2>

      {PROCEDURE_CATEGORIES.map(category => (
        <div key={category.id} className="border rounded-xl p-4">
          <h3 className="font-medium mb-3">{category.name}</h3>

          <div className="space-y-3">
            {category.items.map(item => {
              const isSelected = !!selected[item.id];
              const sel = selected[item.id];

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item)}
                      />
                      <span className="font-medium">{item.name}</span>
                    </label>

                    {!hidePrices && (
                      <span className="font-semibold">
                        Ksh {item.price.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3 flex gap-4 flex-wrap">
                      {item.supportsUnits && (
                        <div>
                          <label className="text-xs block mb-1">Units</label>
                          <input
                            type="number"
                            min={1}
                            value={sel.units}
                            onChange={e => updateUnits(item.id, Number(e.target.value))}
                            className="w-20 border rounded px-2 py-1"
                          />
                        </div>
                      )}

                      {item.supportsPair && (
                        <div>
                          <label className="text-xs block mb-1">Mode</label>
                          <select
                            value={sel.mode}
                            onChange={e => updateMode(item.id, e.target.value as Mode)}
                            className="border rounded px-2 py-1"
                          >
                            <option value="single">Single</option>
                            <option value="pair">Pair</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {!hidePrices && (
        <div className="text-right text-lg font-bold">
          Total:{" "}
          <span className="text-blue-600">
            Ksh {totalPrice().toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default LabProcedures;
