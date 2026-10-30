import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  ShoppingCart, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Tag, 
  X,
  History,
  TrendingUp,
  Scale
} from 'lucide-react';
import { api } from '../../services/api';

export default function BatchInventoryPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterStage, setFilterStage] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Add Batch Form
  const [addForm, setAddForm] = useState({
    batch_id: `TOM-${String(Math.floor(100 + Math.random() * 900))}`,
    variety: 'Arka Rakshak',
    storage_bay: 'Bay 1',
    initial_quantity_kg: 2000,
    harvest_date: new Date().toISOString().split('T')[0],
    entry_date: new Date().toISOString().split('T')[0],
    current_maturity_stage: 'Breaker',
    quality_grade: 'A',
    notes: 'Premium harvest from local polyhouse.'
  });

  // Sale Record Form
  const [saleForm, setSaleForm] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    quantity_sold_kg: 500,
    sale_price_per_kg: 28.5,
    destination_mandi: 'Kolar',
    buyer_name: 'Shree Krishna Traders',
    notes: 'Direct morning dispatch'
  });

  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadBatches = () => {
    setLoading(true);
    api.getBatches({
      search: search || undefined,
      spoilage_risk: filterRisk || undefined,
      maturity_stage: filterStage || undefined,
      include_exhausted: true
    })
      .then(setBatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBatches();
  }, [search, filterRisk, filterStage]);

  const handleCreateBatch = (e) => {
    e.preventDefault();
    setFormError('');
    api.createBatch({
      ...addForm,
      initial_quantity_kg: Number(addForm.initial_quantity_kg),
      quantity_stored_kg: Number(addForm.initial_quantity_kg),
      storage_entry_date: addForm.entry_date,
      storage_bay: addForm.storage_bay || 'Bay 1',
      storage_room: `Room A - ${addForm.storage_bay || 'Bay 1'}`
    })
      .then(() => {
        setActionSuccess(`Batch ${addForm.batch_id} registered successfully!`);
        setShowAddModal(false);
        loadBatches();
        setTimeout(() => setActionSuccess(''), 4000);
      })
      .catch(err => {
        setFormError(err.message || 'Failed to create batch.');
      });
  };

  const handleOpenSaleModal = (batch) => {
    setSelectedBatch(batch);
    setFormError('');
    setSaleForm({
      sale_date: new Date().toISOString().split('T')[0],
      quantity_sold_kg: Math.min(500, batch.remaining_quantity_kg),
      sale_price_per_kg: 28.0,
      destination_mandi: 'Kolar',
      buyer_name: 'Regional Wholesale Agent',
      notes: `Dispatch from ${batch.storage_bay}`
    });
    setShowSaleModal(true);
  };

  const handleOpenHistoryModal = (batch) => {
    setSelectedBatch(batch);
    setShowHistoryModal(true);
  };

  const handleRecordSale = (e) => {
    e.preventDefault();
    setFormError('');

    const qty = Number(saleForm.quantity_sold_kg);
    if (!qty || qty <= 0) {
      setFormError('Sale quantity must be greater than 0 kg.');
      return;
    }
    if (qty > selectedBatch.remaining_quantity_kg) {
      setFormError(`Cannot sell ${qty} kg. Remaining inventory is only ${selectedBatch.remaining_quantity_kg} kg!`);
      return;
    }

    api.recordBatchSale(selectedBatch.batch_id, {
      sale_date: saleForm.sale_date,
      quantity_sold_kg: qty,
      sale_price_per_kg: Number(saleForm.sale_price_per_kg),
      destination_mandi: saleForm.destination_mandi,
      buyer_name: saleForm.buyer_name,
      notes: saleForm.notes
    })
      .then(() => {
        setActionSuccess(`Sale of ${qty} kg recorded for batch ${selectedBatch.batch_id}!`);
        setShowSaleModal(false);
        loadBatches();
        setTimeout(() => setActionSuccess(''), 4000);
      })
      .catch(err => {
        setFormError(err.message || 'Failed to record sale.');
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Chamber A Inventory
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Multi-Batch Stock & Sales Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Tomato Batch Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Track tomato batches by harvest date, maturity stage, storage bay, and record partial market dispatches.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadBatches}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-white border border-gray-300 hover:border-[#164B35] text-gray-700 hover:text-[#164B35] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setFormError('');
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 bg-[#164B35] hover:bg-[#0E3626] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Batch</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Batch ID, Variety, Bay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:ring-1 focus:ring-[#164B35] outline-none font-medium"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Spoilage Risk Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-gray-500 font-semibold">Risk:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 font-bold text-gray-800 outline-none"
            >
              <option value="">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>

          {/* Maturity Stage Filter */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-gray-500 font-semibold">Stage:</span>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 font-bold text-gray-800 outline-none"
            >
              <option value="">All Stages</option>
              <option value="Green">Green</option>
              <option value="Breaker">Breaker</option>
              <option value="Turning">Turning</option>
              <option value="Pink">Pink</option>
              <option value="Light Red">Light Red</option>
              <option value="Red">Red</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batches Table Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Batch ID & Variety</th>
                <th className="py-3.5 px-4">Storage Bay</th>
                <th className="py-3.5 px-4">Maturity Stage</th>
                <th className="py-3.5 px-4">Inventory Progress</th>
                <th className="py-3.5 px-4">Spoilage Risk</th>
                <th className="py-3.5 px-4">Est. Shelf Life</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {batches.length > 0 ? (
                batches.map((b) => {
                  const initialKg = b.initial_quantity_kg || 1;
                  const remainingKg = b.remaining_quantity_kg || 0;
                  const percentLeft = Math.round((remainingKg / initialKg) * 100);
                  const isExhausted = remainingKg <= 0;

                  return (
                    <tr 
                      key={b.batch_id} 
                      className={`hover:bg-gray-50/80 transition-colors ${isExhausted ? 'opacity-60 bg-gray-50/40' : ''}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {b.batch_id}
                          </span>
                          <span className="font-black text-gray-900">{b.variety}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 flex items-center space-x-2">
                          <span>Harvest: {b.harvest_date}</span>
                          <span>•</span>
                          <span>Grade: {b.quality_grade || 'A'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-gray-800">
                        <span className="bg-emerald-50 text-[#164B35] px-2 py-1 rounded-lg border border-emerald-200/60">
                          {b.storage_bay}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-gray-900">
                          {b.current_maturity_stage}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-black text-gray-900">{remainingKg} kg</span>
                            <span className="text-gray-400">/ {initialKg} kg</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percentLeft > 50 ? 'bg-emerald-500' : percentLeft > 20 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${percentLeft}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center space-x-1 ${
                          b.spoilage_risk === 'High'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : b.spoilage_risk === 'Medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          <span>{b.spoilage_risk}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-black text-gray-900">
                          ~{b.shelf_life_days_remaining} Days
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenHistoryModal(b)}
                            title="View Sales History"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenSaleModal(b)}
                            disabled={isExhausted}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm ${
                              isExhausted
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-[#164B35] text-white hover:bg-[#0E3626]'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isExhausted ? 'Exhausted' : 'Record Sale'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <Boxes className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-gray-700">No batches match your search filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD BATCH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-[#164B35]" />
                <h3 className="font-black text-gray-900 text-base">Register New Harvest Batch</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Batch Identifier</label>
                  <input
                    type="text"
                    required
                    value={addForm.batch_id}
                    onChange={(e) => setAddForm({ ...addForm, batch_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-mono font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Tomato Variety</label>
                  <select
                    value={addForm.variety}
                    onChange={(e) => setAddForm({ ...addForm, variety: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  >
                    <option value="Arka Rakshak">Arka Rakshak</option>
                    <option value="Vaishnavi">Vaishnavi</option>
                    <option value="Avinash-2">Avinash-2</option>
                    <option value="PKM-1">PKM-1</option>
                    <option value="Pusa Ruby">Pusa Ruby</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Storage Bay Allocation</label>
                  <select
                    value={addForm.storage_bay}
                    onChange={(e) => setAddForm({ ...addForm, storage_bay: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  >
                    <option value="Bay 1">Bay 1 (South-West)</option>
                    <option value="Bay 2">Bay 2 (Central-East)</option>
                    <option value="Bay 3">Bay 3 (North-West)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Harvest Mass (kg)</label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    required
                    value={addForm.initial_quantity_kg}
                    onChange={(e) => setAddForm({ ...addForm, initial_quantity_kg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Maturity at Entry</label>
                  <select
                    value={addForm.current_maturity_stage}
                    onChange={(e) => setAddForm({ ...addForm, current_maturity_stage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  >
                    <option value="Green">Green (Stage 1)</option>
                    <option value="Breaker">Breaker (Stage 2 - Recommended)</option>
                    <option value="Turning">Turning (Stage 3)</option>
                    <option value="Pink">Pink (Stage 4)</option>
                    <option value="Light Red">Light Red (Stage 5)</option>
                    <option value="Red">Red (Stage 6 - Table Ready)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={addForm.harvest_date}
                    onChange={(e) => setAddForm({ ...addForm, harvest_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Field Notes & Polyhouse Origin</label>
                <textarea
                  rows="2"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#164B35] text-white font-bold hover:bg-[#0E3626] shadow-md"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD SALE MODAL */}
      {showSaleModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-[#164B35]" />
                <div>
                  <h3 className="font-black text-gray-900 text-base">Record Produce Sale</h3>
                  <p className="text-[11px] text-gray-500">
                    Batch: <span className="font-mono font-bold text-gray-900">{selectedBatch.batch_id}</span> ({selectedBatch.variety})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSaleModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Remaining Inventory Callout */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span>Available Stock in {selectedBatch.storage_bay}:</span>
              </div>
              <span className="font-black text-sm text-[#164B35]">
                {selectedBatch.remaining_quantity_kg.toLocaleString()} kg
              </span>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordSale} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Quantity to Sell (kg)</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedBatch.remaining_quantity_kg}
                    required
                    value={saleForm.quantity_sold_kg}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity_sold_kg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Selling Price (₹/kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={saleForm.sale_price_per_kg}
                    onChange={(e) => setSaleForm({ ...saleForm, sale_price_per_kg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-600">Calculated Gross Realization:</span>
                <span className="font-black text-[#164B35] text-sm">
                  ₹{(Number(saleForm.quantity_sold_kg || 0) * Number(saleForm.sale_price_per_kg || 0)).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Target Mandi</label>
                  <select
                    value={saleForm.destination_mandi}
                    onChange={(e) => setSaleForm({ ...saleForm, destination_mandi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  >
                    <option value="Kolar">Kolar APMC</option>
                    <option value="Bengaluru">Bengaluru (Yeshwanthpur)</option>
                    <option value="Chintamani">Chintamani</option>
                    <option value="Ramanagara">Ramanagara</option>
                    <option value="Malur">Malur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-bold mb-1">Sale Date</label>
                  <input
                    type="date"
                    required
                    value={saleForm.sale_date}
                    onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1">Buyer / Commission Agent</label>
                <input
                  type="text"
                  value={saleForm.buyer_name}
                  onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#164B35] text-white font-bold hover:bg-[#0E3626] shadow-md"
                >
                  Confirm & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALES HISTORY MODAL */}
      {showHistoryModal && selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-[#164B35]" />
                <h3 className="font-black text-gray-900 text-base">
                  Dispatches for {selectedBatch.batch_id}
                </h3>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {selectedBatch.sales && selectedBatch.sales.length > 0 ? (
                selectedBatch.sales.map((s, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1 text-xs">
                    <div className="flex justify-between items-center font-bold text-gray-900">
                      <span>{s.quantity_sold_kg} kg sold @ ₹{s.sale_price_per_kg}/kg</span>
                      <span className="text-[#164B35] font-black">₹{s.total_amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Mandi: {s.destination_mandi}</span>
                      <span>Date: {s.sale_date}</span>
                    </div>
                    {s.buyer_name && (
                      <p className="text-[10px] text-gray-400">Buyer: {s.buyer_name}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-gray-400 text-xs">No dispatches recorded yet for this batch.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}