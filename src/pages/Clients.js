import { useState } from "react";
import { useData } from "../context/DataContext";
import ClientFormModal from "../components/ClientFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";

export default function Clients() {
  const { clients, invoices, deleteClient, showToast } = useData();
  const [search, setSearch] = useState("");
  // clientForm is null (closed), 'new' (adding), or a client object (editing)
  const [clientForm, setClientForm] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  const searchText = search.trim().toLowerCase();
  const visibleClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchText) ||
      client.email.toLowerCase().includes(searchText)
  );

  async function confirmDelete() {
    const result = await deleteClient(clientToDelete.id);
    if (result.ok) showToast(`${clientToDelete.name} was deleted.`);
    else showToast(result.message, "error");
    setClientToDelete(null);
  }

  const addButton = (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => setClientForm("new")}
    >
      <Icon name="plusCircle" size={18} /> Add Client
    </button>
  );

  return (
    <>
      <div className="page-header">
        <h1>Clients</h1>
        {addButton}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              aria-label="Search clients"
            />
          </div>
        </div>

        {clients.length === 0 ? (
          <EmptyState
            title="No clients yet"
            message="Add a client so you can start creating invoices for them."
            action={addButton}
          />
        ) : visibleClients.length === 0 ? (
          <EmptyState
            title="No clients match"
            message="Check the spelling or try a different search."
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th className="num">Invoices</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleClients.map((client) => (
                  <tr key={client.id}>
                    <td data-label="Client">
                      <strong>{client.name}</strong>
                      <span className="cell-sub">{client.email}</span>
                    </td>
                    <td data-label="Phone">{client.phone || "-"}</td>
                    <td data-label="Address">{client.address || "-"}</td>
                    <td data-label="Invoices" className="num">
                      {
                        invoices.filter(
                          (invoice) => invoice.clientId === client.id
                        ).length
                      }
                    </td>
                    <td data-label="Actions" className="actions-col">
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setClientForm(client)}
                          aria-label={`Edit ${client.name}`}
                          title="Edit"
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-danger"
                          onClick={() => setClientToDelete(client)}
                          aria-label={`Delete ${client.name}`}
                          title="Delete"
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {clientForm && (
        <ClientFormModal
          client={clientForm === "new" ? null : clientForm}
          onClose={() => setClientForm(null)}
        />
      )}

      {clientToDelete && (
        <ConfirmDialog
          title="Delete client?"
          message={`${clientToDelete.name} will be permanently deleted. Clients that still have invoices cannot be deleted.`}
          onConfirm={confirmDelete}
          onCancel={() => setClientToDelete(null)}
        />
      )}
    </>
  );
}
