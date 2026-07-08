import React, { useState } from "react";
import {
  FaPlusCircle,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
} from "react-icons/fa";
import axios from "axios";
import "./InventoryTab.css";

const InventoryTab = ({
  inventory,
  setInventory,
  globalCatalog,
  setGlobalCatalog,
  activePharmacy,
  currentUser,
  loadPharmacyAndData,
}) => {
  // Local tab/search state
  const [inventorySubTab, setInventorySubTab] = useState("stock"); // "stock" or "catalog"
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showAddToStockModal, setShowAddToStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({
    name: "",
    genericName: "",
    manufacturer: "",
    category: "General",
    description: "",
    prescriptionRequired: false,
  });

  const [stockForm, setStockForm] = useState({
    price: "",
    quantity: "",
  });

  const [medForm, setMedForm] = useState({
    name: "",
    price: "",
    quantity: "",
  });

  // --- Handlers ---
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!medForm.name || !medForm.price || !medForm.quantity) {
      alert("Please fill all fields");
      return;
    }
    if (!activePharmacy) {
      alert("Active pharmacy profile is not loaded yet.");
      return;
    }

    try {
      // Step A: Search for the medicine in the catalog by name
      const searchRes = await axios.get(
        `http://localhost:8080/api/medicines/search?name=${encodeURIComponent(medForm.name)}`
      );
      let medicine = searchRes.data.find(
        (m) => m.name.toLowerCase() === medForm.name.toLowerCase()
      );

      // Step B: If it doesn't exist, create a new catalog entry
      if (!medicine) {
        const newMedCatalog = {
          name: medForm.name,
          genericName: medForm.name,
          category: "General",
          prescriptionRequired: false,
          description: "Added by Admin",
          stock: 0,
        };
        const medCreateRes = await axios.post(
          "http://localhost:8080/api/medicines",
          newMedCatalog
        );
        medicine = medCreateRes.data;
      }

      // Step C: Save to Inventory
      const newInventoryItem = {
        stock: parseInt(medForm.quantity),
        price: parseFloat(medForm.price),
        pharmacy: { id: activePharmacy.id },
        medicine: { id: medicine.id },
      };

      await axios.post("http://localhost:8080/api/inventory", newInventoryItem);

      // Step D: Reload dashboard data
      await loadPharmacyAndData(currentUser);

      setMedForm({ name: "", price: "", quantity: "" });
      setShowAddModal(false);
      alert("Medicine added successfully! ✅");
    } catch (err) {
      console.error("Error adding medicine to API:", err);
      
      // Offline fallback: save to localStorage inventory cache
      const newLocalItem = {
        id: "MED-LOCAL-" + Date.now(),
        name: medForm.name,
        price: parseFloat(medForm.price),
        quantity: parseInt(medForm.quantity),
      };
      const updatedInv = [...inventory, newLocalItem];
      setInventory(updatedInv);
      localStorage.setItem(`inventory_${currentUser.email}`, JSON.stringify(updatedInv));

      // Also add to mock catalog if it's new
      const existsInCatalog = globalCatalog.some(
        (c) => c.name.toLowerCase() === medForm.name.toLowerCase()
      );
      if (!existsInCatalog) {
        const newCatalogItem = {
          id: Date.now(),
          name: medForm.name,
          genericName: medForm.name,
          category: "General",
          manufacturer: "Local Listing",
          prescriptionRequired: false,
          description: "Added locally offline",
        };
        const updatedCat = [...globalCatalog, newCatalogItem];
        setGlobalCatalog(updatedCat);
        localStorage.setItem("globalCatalog", JSON.stringify(updatedCat));
      }

      setMedForm({ name: "", price: "", quantity: "" });
      setShowAddModal(false);
      alert("Offline Mode: Medicine listed locally successfully! ⚠️✅");
    }
  };

  const openEditModal = (med) => {
    setSelectedMed(med);
    setMedForm({
      name: med.name,
      price: med.price.toString(),
      quantity: med.quantity.toString(),
    });
    setShowEditModal(true);
  };

  const handleEditMedicine = async (e) => {
    e.preventDefault();
    if (!medForm.name || !medForm.price || !medForm.quantity || !selectedMed) {
      alert("Please fill all fields");
      return;
    }
    if (!activePharmacy) {
      alert("Active pharmacy is not loaded.");
      return;
    }

    try {
      const updatedInventoryItem = {
        id: selectedMed.id,
        stock: parseInt(medForm.quantity),
        price: parseFloat(medForm.price),
        pharmacy: { id: activePharmacy.id },
        medicine: { id: selectedMed.medicineId },
      };

      await axios.post(
        "http://localhost:8080/api/inventory",
        updatedInventoryItem
      );

      await loadPharmacyAndData(currentUser);

      setMedForm({ name: "", price: "", quantity: "" });
      setShowEditModal(false);
      setSelectedMed(null);
      alert("Inventory updated successfully! ✅");
    } catch (err) {
      console.error("Error editing inventory:", err);
      
      // Offline fallback: update local inventory state and cache
      const updatedInv = inventory.map((med) => {
        if (med.id === selectedMed.id) {
          return {
            ...med,
            name: medForm.name,
            price: parseFloat(medForm.price),
            quantity: parseInt(medForm.quantity),
          };
        }
        return med;
      });
      setInventory(updatedInv);
      localStorage.setItem(`inventory_${currentUser.email}`, JSON.stringify(updatedInv));

      setMedForm({ name: "", price: "", quantity: "" });
      setShowEditModal(false);
      setSelectedMed(null);
      alert("Offline Mode: Inventory updated locally! ⚠️✅");
    }
  };

  const handleDeleteMedicine = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await axios.delete(`http://localhost:8080/api/inventory/${id}`);
        await loadPharmacyAndData(currentUser);
        alert("Listing deleted successfully! ✅");
      } catch (err) {
        console.error("Error deleting inventory listing:", err);
        
        // Offline fallback: delete from local inventory state and cache
        const updatedInv = inventory.filter((med) => med.id !== id);
        setInventory(updatedInv);
        localStorage.setItem(`inventory_${currentUser.email}`, JSON.stringify(updatedInv));
        alert("Offline Mode: Listing deleted locally! ⚠️✅");
      }
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (
      !productForm.name ||
      !productForm.manufacturer ||
      !productForm.genericName
    ) {
      alert("Please fill name, manufacturer, and generic name");
      return;
    }
    try {
      await axios.post("http://localhost:8080/api/medicines", productForm);
      await loadPharmacyAndData(currentUser);
      setProductForm({
        name: "",
        genericName: "",
        manufacturer: "",
        category: "General",
        description: "",
        prescriptionRequired: false,
      });
      setShowAddProductModal(false);
      alert("Product created in global catalog! ✅");
    } catch (err) {
      console.error("Error creating product:", err);
      
      // Offline fallback: save to localStorage globalCatalog cache
      const newProduct = {
        id: Date.now(),
        ...productForm,
      };
      const updatedCatalog = [...globalCatalog, newProduct];
      setGlobalCatalog(updatedCatalog);
      localStorage.setItem("globalCatalog", JSON.stringify(updatedCatalog));

      setProductForm({
        name: "",
        genericName: "",
        manufacturer: "",
        category: "General",
        description: "",
        prescriptionRequired: false,
      });
      setShowAddProductModal(false);
      alert("Offline Mode: Product created locally in catalog! ⚠️✅");
    }
  };

  const openEditProductModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      genericName: product.genericName || "",
      manufacturer: product.manufacturer || "",
      category: product.category || "General",
      description: product.description || "",
      prescriptionRequired: product.prescriptionRequired || false,
    });
    setShowEditProductModal(true);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await axios.put(
        `http://localhost:8080/api/medicines/${selectedProduct.id}`,
        productForm
      );
      await loadPharmacyAndData(currentUser);
      setProductForm({
        name: "",
        genericName: "",
        manufacturer: "",
        category: "General",
        description: "",
        prescriptionRequired: false,
      });
      setShowEditProductModal(false);
      setSelectedProduct(null);
      alert("Product updated in global catalog! ✅");
    } catch (err) {
      console.error("Error updating product:", err);
      
      // Offline fallback: update in local globalCatalog state and cache
      const updatedCatalog = globalCatalog.map((prod) => {
        if (prod.id === selectedProduct.id) {
          return {
            ...prod,
            ...productForm,
          };
        }
        return prod;
      });
      setGlobalCatalog(updatedCatalog);
      localStorage.setItem("globalCatalog", JSON.stringify(updatedCatalog));

      setProductForm({
        name: "",
        genericName: "",
        manufacturer: "",
        category: "General",
        description: "",
        prescriptionRequired: false,
      });
      setShowEditProductModal(false);
      setSelectedProduct(null);
      alert("Offline Mode: Product updated locally in catalog! ⚠️✅");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this product from the global catalog? This will remove it completely from all listings."
      )
    ) {
      try {
        await axios.delete(`http://localhost:8080/api/medicines/${id}`);
        await loadPharmacyAndData(currentUser);
        alert("Product deleted from catalog! ✅");
      } catch (err) {
        console.error("Error deleting product:", err);
        
        // Offline fallback: delete from local globalCatalog state and cache
        const updatedCatalog = globalCatalog.filter((prod) => prod.id !== id);
        setGlobalCatalog(updatedCatalog);
        localStorage.setItem("globalCatalog", JSON.stringify(updatedCatalog));
        alert("Offline Mode: Product deleted locally from catalog! ⚠️✅");
      }
    }
  };

  const openAddToStockModal = (product) => {
    setSelectedProduct(product);
    setStockForm({
      price: "",
      quantity: "",
    });
    setShowAddToStockModal(true);
  };

  const handleAddToStock = async (e) => {
    e.preventDefault();
    if (!stockForm.price || !stockForm.quantity || !selectedProduct) {
      alert("Please fill price and quantity");
      return;
    }
    if (!activePharmacy) {
      alert("Active pharmacy is not loaded");
      return;
    }
    try {
      const newStockItem = {
        stock: parseInt(stockForm.quantity),
        price: parseFloat(stockForm.price),
        pharmacy: { id: activePharmacy.id },
        medicine: { id: selectedProduct.id },
      };

      await axios.post("http://localhost:8080/api/inventory", newStockItem);
      await loadPharmacyAndData(currentUser);

      setStockForm({ price: "", quantity: "" });
      setShowAddToStockModal(false);
      setSelectedProduct(null);
      alert("Stock added successfully to your pharmacy! ✅");
    } catch (err) {
      console.error("Error adding stock:", err);
      
      // Offline fallback: save to localStorage inventory cache
      const newLocalItem = {
        id: "MED-LOCAL-" + Date.now(),
        name: selectedProduct.name,
        price: parseFloat(stockForm.price),
        quantity: parseInt(stockForm.quantity),
      };
      const updatedInv = [...inventory, newLocalItem];
      setInventory(updatedInv);
      localStorage.setItem(`inventory_${currentUser.email}`, JSON.stringify(updatedInv));

      setStockForm({ price: "", quantity: "" });
      setShowAddToStockModal(false);
      setSelectedProduct(null);
      alert("Offline Mode: Stock added locally successfully! ⚠️✅");
    }
  };

  // --- Filtered lists for rendering ---
  const filteredInventory = inventory.filter(
    (med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="tab-panel inventory-panel">
      <div className="dashboard-widget glass-panel full-widget">
        <div
          className="widget-header search-add-row"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div
              className="sub-tabs-container"
              style={{
                display: "flex",
                gap: "10px",
                background: "rgba(255,255,255,0.05)",
                padding: "4px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <button
                type="button"
                className={`sub-tab-btn ${inventorySubTab === "stock" ? "active" : ""}`}
                onClick={() => setInventorySubTab("stock")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.3s ease",
                  background:
                    inventorySubTab === "stock"
                      ? "var(--btn-primary-bg)"
                      : "transparent",
                  color:
                    inventorySubTab === "stock"
                      ? "var(--btn-primary-text)"
                      : "var(--text-secondary)",
                }}
              >
                Pharmacy Stock List
              </button>
              <button
                type="button"
                className={`sub-tab-btn ${inventorySubTab === "catalog" ? "active" : ""}`}
                onClick={() => setInventorySubTab("catalog")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontFamily: "var(--font-body)",
                  transition: "all 0.3s ease",
                  background:
                    inventorySubTab === "catalog"
                      ? "var(--btn-primary-bg)"
                      : "transparent",
                  color:
                    inventorySubTab === "catalog"
                      ? "var(--btn-primary-text)"
                      : "var(--text-secondary)",
                }}
              >
                Global Product Catalog
              </button>
            </div>

            {inventorySubTab === "stock" ? (
              <button
                onClick={() => {
                  setMedForm({ name: "", price: "", quantity: "" });
                  setShowAddModal(true);
                }}
                className="add-med-btn btn-primary"
              >
                <FaPlusCircle />
                <span>Quick List Stock</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setProductForm({
                    name: "",
                    genericName: "",
                    manufacturer: "",
                    category: "General",
                    description: "",
                    prescriptionRequired: false,
                  });
                  setShowAddProductModal(true);
                }}
                className="add-med-btn btn-primary"
              >
                <FaPlusCircle />
                <span>Create New Product</span>
              </button>
            )}
          </div>

          <div
            className="search-group"
            style={{ width: "100%", maxWidth: "none" }}
          >
            <FaSearch className="search-icon-in" />
            <input
              type="text"
              placeholder={
                inventorySubTab === "stock"
                  ? "Search active pharmacy stock..."
                  : "Search global database catalog by name or generic name..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inventory-search-input"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div className="widget-content">
          {/* SUBTAB 1: PHARMACY STOCK */}
          {inventorySubTab === "stock" &&
            (filteredInventory.length === 0 ? (
              <div className="empty-search-state">
                <p>No listed pharmacy stock matches your search.</p>
              </div>
            ) : (
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Medicine Name</th>
                    <th>Price</th>
                    <th>Current Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((med, index) => {
                    const status =
                      med.quantity === 0
                        ? "Out of Stock"
                        : med.quantity < 5
                          ? "Low Stock"
                          : "In Stock";
                    return (
                      <tr key={index}>
                        <td className="bold">{med.id}</td>
                        <td className="med-name-cell">{med.name}</td>
                        <td>₹{med.price}</td>
                        <td>{med.quantity} unit(s)</td>
                        <td>
                          <span
                            className={`stock-badge status-${status.toLowerCase().replace(" ", "")}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button
                              onClick={() => openEditModal(med)}
                              className="edit-btn-tbl"
                              title="Modify Stock / Price"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMedicine(med.id)
                              }
                              className="delete-btn-tbl"
                              title="Remove Stock Listing"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))}

          {/* SUBTAB 2: GLOBAL CATALOG */}
          {inventorySubTab === "catalog" &&
            (() => {
              const filteredCatalog = globalCatalog.filter(
                (m) =>
                  m.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  (m.genericName &&
                    m.genericName
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()))
              );
              return filteredCatalog.length === 0 ? (
                <div className="empty-search-state">
                  <p>
                    No products found in global catalog matching "
                    {searchQuery}".
                  </p>
                </div>
              ) : (
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Product Name</th>
                      <th>Generic Formulation</th>
                      <th>Category</th>
                      <th>Manufacturer</th>
                      <th>Prescription?</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCatalog.map((prod, index) => (
                      <tr key={index}>
                        <td className="bold">{prod.id}</td>
                        <td className="med-name-cell">{prod.name}</td>
                        <td>{prod.genericName || "—"}</td>
                        <td>{prod.category || "General"}</td>
                        <td>{prod.manufacturer || "—"}</td>
                        <td>
                          <span
                            className={`stock-badge ${prod.prescriptionRequired ? "status-lowstock" : "status-instock"}`}
                          >
                            {prod.prescriptionRequired
                              ? "Required"
                              : "No"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-group">
                            <button
                              onClick={() => openAddToStockModal(prod)}
                              className="complete-pickup-btn"
                              title="Add Stock listing for your Store"
                              style={{
                                padding: "6px 12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                              }}
                            >
                              <FaPlusCircle /> Add Stock
                            </button>
                            <button
                              onClick={() => openEditProductModal(prod)}
                              className="edit-btn-tbl"
                              title="Edit Catalog Metadata"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteProduct(prod.id)
                              }
                              className="delete-btn-tbl"
                              title="Delete from Global Catalog"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
        </div>
      </div>

      {/* --- ADD MEDICINE MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-container glass-panel">
            <button
              className="modal-close-btn"
              onClick={() => setShowAddModal(false)}
            >
              <FaTimes />
            </button>
            <div className="modal-header">
              <FaPlusCircle className="modal-title-icon green" />
              <h2>Add New Drug Listing</h2>
              <p>Add medicine inventory details to the live portal.</p>
            </div>

            <form onSubmit={handleAddMedicine} className="modal-form">
              <div className="form-group-in">
                <label>Medicine Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg"
                  value={medForm.name}
                  onChange={(e) =>
                    setMedForm({ ...medForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-row-in">
                <div className="form-group-in">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={medForm.price}
                    onChange={(e) =>
                      setMedForm({ ...medForm, price: e.target.value })
                    }
                    required
                    min="1"
                  />
                </div>
                <div className="form-group-in">
                  <label>Initial Quantity</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={medForm.quantity}
                    onChange={(e) =>
                      setMedForm({ ...medForm, quantity: e.target.value })
                    }
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="modal-actions-tbl">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  List Drug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MEDICINE MODAL --- */}
      {showEditModal && selectedMed && (
        <div className="modal-overlay">
          <div className="modal-container glass-panel">
            <button
              className="modal-close-btn"
              onClick={() => {
                setShowEditModal(false);
                setSelectedMed(null);
              }}
            >
              <FaTimes />
            </button>
            <div className="modal-header">
              <FaEdit className="modal-title-icon" />
              <h2>Modify Stock / Price</h2>
              <p>
                Updating details for <strong>{selectedMed.name}</strong>
              </p>
            </div>

            <form onSubmit={handleEditMedicine} className="modal-form">
              <div className="form-group-in">
                <label>Medicine Name</label>
                <input
                  type="text"
                  value={medForm.name}
                  onChange={(e) =>
                    setMedForm({ ...medForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-row-in">
                <div className="form-group-in">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={medForm.price}
                    onChange={(e) =>
                      setMedForm({ ...medForm, price: e.target.value })
                    }
                    required
                    min="1"
                  />
                </div>
                <div className="form-group-in">
                  <label>Update Stock Quantity</label>
                  <input
                    type="number"
                    value={medForm.quantity}
                    onChange={(e) =>
                      setMedForm({ ...medForm, quantity: e.target.value })
                    }
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="modal-actions-tbl">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMed(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CREATE CATALOG PRODUCT MODAL --- */}
      {showAddProductModal && (
        <div className="modal-overlay">
          <div className="modal-container glass-panel">
            <button
              className="modal-close-btn"
              onClick={() => setShowAddProductModal(false)}
            >
              <FaTimes />
            </button>
            <div className="modal-header">
              <FaPlusCircle className="modal-title-icon green" />
              <h2>Create Catalog Product</h2>
              <p>Add a new medicine product to the global portal database.</p>
            </div>

            <form onSubmit={handleCreateProduct} className="modal-form">
              <div className="form-group-in">
                <label>Medicine / Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group-in">
                <label>Generic active formulation name</label>
                <input
                  type="text"
                  placeholder="e.g. Acetaminophen"
                  value={productForm.genericName}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      genericName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-row-in">
                <div className="form-group-in">
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Analgesics / Antipyretics"
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group-in">
                  <label>Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. GSK / Cipla"
                    value={productForm.manufacturer}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        manufacturer: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group-in">
                <label>Product Description / Dosage Details</label>
                <textarea
                  placeholder="Dosage guidelines and instructions..."
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "10px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
              <div
                className="form-group-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <input
                  type="checkbox"
                  id="presc-req"
                  checked={productForm.prescriptionRequired}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      prescriptionRequired: e.target.checked,
                    })
                  }
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label
                  htmlFor="presc-req"
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  Requires Doctor Prescription
                </label>
              </div>

              <div className="modal-actions-tbl" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddProductModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CATALOG PRODUCT MODAL --- */}
      {showEditProductModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-container glass-panel">
            <button
              className="modal-close-btn"
              onClick={() => {
                setShowEditProductModal(false);
                setSelectedProduct(null);
              }}
            >
              <FaTimes />
            </button>
            <div className="modal-header">
              <FaEdit className="modal-title-icon" />
              <h2>Edit Catalog Details</h2>
              <p>
                Updating specifications for catalog product:{" "}
                <strong>{selectedProduct.name}</strong>
              </p>
            </div>

            <form onSubmit={handleEditProduct} className="modal-form">
              <div className="form-group-in">
                <label>Medicine / Brand Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group-in">
                <label>Generic active formulation name</label>
                <input
                  type="text"
                  value={productForm.genericName}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      genericName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-row-in">
                <div className="form-group-in">
                  <label>Category</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group-in">
                  <label>Manufacturer</label>
                  <input
                    type="text"
                    value={productForm.manufacturer}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        manufacturer: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group-in">
                <label>Product Description / Dosage Details</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    padding: "10px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>
              <div
                className="form-group-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <input
                  type="checkbox"
                  id="edit-presc-req"
                  checked={productForm.prescriptionRequired}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      prescriptionRequired: e.target.checked,
                    })
                  }
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <label
                  htmlFor="edit-presc-req"
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  Requires Doctor Prescription
                </label>
              </div>

              <div className="modal-actions-tbl" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditProductModal(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD STOCK FROM CATALOG ITEM MODAL --- */}
      {showAddToStockModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-container glass-panel">
            <button
              className="modal-close-btn"
              onClick={() => {
                setShowAddToStockModal(false);
                setSelectedProduct(null);
              }}
            >
              <FaTimes />
            </button>
            <div className="modal-header">
              <FaPlusCircle className="modal-title-icon green" />
              <h2>List Stock Listing</h2>
              <p>
                Add <strong>{selectedProduct.name}</strong> to your pharmacy's
                live stock.
              </p>
            </div>

            <form onSubmit={handleAddToStock} className="modal-form">
              <div className="form-row-in">
                <div className="form-group-in">
                  <label>Unit Price (₹)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={stockForm.price}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, price: e.target.value })
                    }
                    required
                    min="1"
                  />
                </div>
                <div className="form-group-in">
                  <label>Initial Stock Quantity</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={stockForm.quantity}
                    onChange={(e) =>
                      setStockForm({ ...stockForm, quantity: e.target.value })
                    }
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="modal-actions-tbl" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddToStockModal(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Stock listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;
