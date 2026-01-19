import React, { useState, useEffect } from "react";
import {
    listInternalInventory,
    createInventoryRequest,
    type InternalInventoryItem,
    type InventoryRequestSource,
} from "../middleware/data";

interface InventoryRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    source: InventoryRequestSource;
    patientName?: string;
    sourceReference?: string;
    onSuccess?: () => void;
}

export default function InventoryRequestModal({
    isOpen,
    onClose,
    source,
    patientName = "",
    sourceReference = "",
    onSuccess,
}: InventoryRequestModalProps) {
    const [items, setItems] = useState<InternalInventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [selectedItemId, setSelectedItemId] = useState<number | "">("");
    const [quantity, setQuantity] = useState(1);
    const [requestedBy, setRequestedBy] = useState("");

    // Fetch inventory items when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchItems();
        }
    }, [isOpen]);

    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await listInternalInventory();
            // Filter to only show items with stock
            const availableItems = data.filter((item) => item.qty > 0);
            setItems(availableItems);
        } catch (err) {
            console.error("Error fetching inventory:", err);
            setError("Failed to load inventory items");
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedItemId === "" || quantity < 1) {
            setError("Please select an item and quantity");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const result = await createInventoryRequest({
                inventory_item_id: selectedItemId as number,
                quantity,
                source,
                source_reference: sourceReference || undefined,
                patient_name: patientName || undefined,
                requested_by: requestedBy || undefined,
            });

            if (result) {
                // Reset form
                setSelectedItemId("");
                setQuantity(1);
                setRequestedBy("");
                onSuccess?.();
                onClose();
                alert("Inventory request submitted successfully!");
            } else {
                setError("Failed to submit request. Please try again.");
            }
        } catch (err) {
            console.error("Error submitting request:", err);
            setError("An error occurred while submitting the request.");
        }
        setSubmitting(false);
    };

    const selectedItem = items.find((i) => i.id === selectedItemId);

    const getSourceLabel = () => {
        switch (source) {
            case "internal_lab":
                return "Internal Lab";
            case "external_lab":
                return "External Lab";
            case "clinic":
                return "Clinic";
            default:
                return source;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">
                        Request Inventory Items
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-xl"
                    >
                        ×
                    </button>
                </div>

                {/* Source Badge */}
                <div className="mb-4">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                        Source: {getSourceLabel()}
                    </span>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-gray-500">
                        Loading inventory...
                    </div>
                ) : error && items.length === 0 ? (
                    <div className="py-8 text-center text-red-500">{error}</div>
                ) : items.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        No inventory items available
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded bg-red-50 text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Item Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Item <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedItemId}
                                onChange={(e) =>
                                    setSelectedItemId(e.target.value ? Number(e.target.value) : "")
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">-- Select an item --</option>
                                {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.sku}) - {item.qty} available
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={selectedItem?.qty || 100}
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {selectedItem && quantity > selectedItem.qty && (
                                <p className="mt-1 text-xs text-red-500">
                                    Quantity exceeds available stock ({selectedItem.qty})
                                </p>
                            )}
                        </div>

                        {/* Patient Name (if provided) */}
                        {patientName && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Patient
                                </label>
                                <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                    {patientName}
                                </div>
                            </div>
                        )}

                        {/* Requested By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Requested By
                            </label>
                            <input
                                type="text"
                                value={requestedBy}
                                onChange={(e) => setRequestedBy(e.target.value)}
                                placeholder="Your name (optional)"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    submitting ||
                                    selectedItemId === "" ||
                                    quantity < 1 ||
                                    (selectedItem && quantity > selectedItem.qty)
                                }
                                className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {submitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
